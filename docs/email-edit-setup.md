# Email notifications + Edit-RSVP setup

This guide walks through the one-time setup for:

1. **Guest confirmation emails** with a private edit link
2. **Admin notification emails** to the couple when an RSVP comes in
3. **Edit RSVP** flow via magic link at `/rsvp/edit/:token`

Everything is already coded — what follows is the external infrastructure that the code depends on.

---

## What's already in the repo

| Path | Purpose |
|------|---------|
| `app/supabase/migrations/20260511000000_rsvp_edit_token.sql` | Adds `edit_token uuid` + `updated_at` to `rsvps`, plus two SECURITY DEFINER RPCs (`get_rsvp_by_token`, `update_rsvp_by_token`) |
| `app/supabase/functions/notify-rsvp/index.ts` | Edge Function that sends emails via Resend on INSERT |
| `app/src/components/RSVPForm.tsx` | Form (shared between create + edit) |
| `app/src/pages/RSVPEditPage.tsx` | `/rsvp/edit/:token` page |

## Step 1 — Sign up for Resend

Resend is the email-sending service. Free tier: 3,000 emails/month, 100/day. Far more than a wedding RSVP form needs.

1. Sign up at <https://resend.com>.
2. Add your domain (`ankhil.club`) under **Domains → Add Domain**.
3. Resend will give you three DNS records to add (SPF, DKIM, and DMARC). Add them in Cloudflare's DNS panel for `ankhil.club`.
4. Wait a few minutes, click **Verify** in Resend. All three records should turn green.
5. Under **API Keys**, create a key. Copy it — you'll need it in step 3.

> If you don't want to add DNS records, Resend also works with their default `onboarding@resend.dev` sender during testing — but emails won't be `from: rsvp@ankhil.club`. Use real DNS for production.

## Step 2 — Apply the database migration

Two options, pick whichever you prefer.

**Option A — Supabase Studio (web):**
1. Open your project at <https://supabase.com/dashboard>.
2. Go to **SQL Editor → New query**.
3. Paste the contents of `app/supabase/migrations/20260511000000_rsvp_edit_token.sql`.
4. Hit **Run**. Should complete with no errors.

**Option B — Supabase CLI:**
```bash
cd app
supabase login          # one-time
supabase link --project-ref <your-project-ref>
supabase db push        # applies all migrations under supabase/migrations
```

Verify by running this in the SQL editor:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'rsvps' AND column_name IN ('edit_token','updated_at');
```
Both rows should appear.

## Step 3 — Configure secrets for the Edge Function

The function needs four environment variables. Set them via the CLI:

```bash
cd app
supabase secrets set \
  RESEND_API_KEY="re_xxx_from_step_1" \
  SITE_URL="https://ankhil.club" \
  FROM_EMAIL="Ankita & Akhil <rsvp@ankhil.club>" \
  ADMIN_EMAIL="support@ankhil.club"
```

`ADMIN_EMAIL` can be comma-separated if you want both Ankita and Akhil notified directly: `ADMIN_EMAIL="ankita@example.com,akhil@example.com"`.

You can also set these in Supabase Studio under **Project Settings → Edge Functions → Secrets**.

## Step 4 — Deploy the Edge Function

```bash
cd app
supabase functions deploy notify-rsvp --no-verify-jwt
```

`--no-verify-jwt` is required because the Database Webhook calls the function without a user JWT.

After deploy, note the function URL. It looks like:
```
https://<project-ref>.supabase.co/functions/v1/notify-rsvp
```

Test it manually:
```bash
curl -X POST '<function-url>' \
  -H 'content-type: application/json' \
  -d '{
    "type":"INSERT",
    "table":"rsvps",
    "schema":"public",
    "record":{
      "id":"00000000-0000-0000-0000-000000000000",
      "full_name":"Test Guest",
      "phone":"+91-9999999999",
      "email":"YOUR_OWN_EMAIL@example.com",
      "dietary":"veg",
      "guest_count":1,
      "attending_kolkata":true,
      "kolkata_events":["reception"],
      "kolkata_arrival":null,
      "kolkata_departure":null,
      "kolkata_accommodation":null,
      "kolkata_airport_pickup":null,
      "attending_kerala":false,
      "kerala_arrival":null,
      "kerala_departure":null,
      "kerala_accommodation":null,
      "kerala_airport_pickup":null,
      "special_notes":null,
      "edit_token":"11111111-1111-1111-1111-111111111111",
      "created_at":"2026-07-01T12:00:00Z"
    },
    "old_record":null
  }'
```

Two emails should arrive (guest + admin). Check `supabase functions logs notify-rsvp` if they don't.

## Step 5 — Wire up the Database Webhook

This is what triggers the function on every INSERT.

1. In Supabase Studio, go to **Database → Webhooks** (sometimes called **Function Hooks**).
2. Click **Create a new hook**.
3. Configure:
   - **Name:** `rsvp-notify`
   - **Table:** `rsvps`
   - **Events:** check only `Insert`
   - **Type:** **Supabase Edge Function**
   - **Edge Function:** `notify-rsvp`
   - **HTTP Method:** `POST`
   - **HTTP Headers:** leave default
   - **Timeout:** 5000ms is fine
4. Save.

Now submit a real RSVP through the site — two emails should land within seconds.

## Step 6 — Test the edit flow

1. Submit an RSVP via the live site with your own email.
2. Open the email → click the **Edit my RSVP** button (or copy the URL).
3. The `/rsvp/edit/<token>` page should load with all your previous answers pre-filled.
4. Change something (e.g. guest count), click **Save Changes**. You should see a confirmation.
5. Re-open the same URL — your edit should be reflected.
6. Confirm the admin email did **not** re-fire on edit (UPDATE doesn't trigger the webhook, only INSERT does).

---

## Security model

- The edit token is a UUID v4 — 122 bits of entropy. Knowing the token = permission to read & update that one RSVP. Treat the URL like a password.
- The two RPCs (`get_rsvp_by_token`, `update_rsvp_by_token`) run as `SECURITY DEFINER`, meaning they bypass RLS but only operate on the row matching the supplied token. They cannot return or modify any other row.
- Anonymous clients can call these RPCs (grants are explicit in the migration). The token in the URL is the only auth.
- The `rsvps` table's existing RLS policies for direct `SELECT`/`UPDATE` should remain restrictive — clients only get to read/edit via the token-scoped RPCs.

## Cost

- **Supabase:** free tier handles this comfortably (Database Webhooks + Edge Functions both included).
- **Resend:** free tier (3,000 emails/month, 100/day). One wedding's worth of RSVPs is ~200 emails total = ~$0.
- **DNS:** no cost (Cloudflare DNS records are free).

Total ongoing cost: **$0** for this feature.

## Future improvements (not needed for launch)

- **Edit-confirmation email** (currently UPDATE doesn't notify anyone). Would need a second webhook on UPDATE, or extending `update_rsvp_by_token` to also call the Edge Function via `pg_net`.
- **Email-less edit lookup** (guest enters phone + name to find their RSVP). Useful if a guest loses the link and didn't provide email at submit time.
- **Admin dashboard** with RSVP list, CSV export, filter by attending/not. The current `/admin` route is a stub.
