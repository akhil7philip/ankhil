// @ts-nocheck — runs on Deno (Supabase Edge Function). Types resolve at runtime.
//
// Supabase Edge Function: notify-rsvp
// Triggered by a Database Webhook on INSERT to public.rsvps. Sends:
//   1. Guest confirmation email with the edit link (if the guest gave an email)
//   2. Admin notification email to ADMIN_EMAIL
//
// Environment variables (set via `supabase secrets set`):
//   RESEND_API_KEY   — Resend API key (required)
//   SITE_URL         — public site URL, e.g. https://ankhil.club (required)
//   FROM_EMAIL       — sender, e.g. "Ankita & Akhil <rsvp@ankhil.club>" (required)
//   ADMIN_EMAIL      — comma-separated admin recipient list (required)
//
// Webhook payload shape: https://supabase.com/docs/guides/database/webhooks
// Deno-based runtime: https://supabase.com/docs/guides/functions

interface RsvpRecord {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  dietary: string;
  guest_count: number;
  attending_kolkata: boolean;
  kolkata_events: string[] | null;
  kolkata_arrival: string | null;
  kolkata_departure: string | null;
  kolkata_accommodation: boolean | null;
  kolkata_airport_pickup: boolean | null;
  attending_kerala: boolean;
  kerala_arrival: string | null;
  kerala_departure: string | null;
  kerala_accommodation: boolean | null;
  kerala_airport_pickup: boolean | null;
  special_notes: string | null;
  edit_token: string;
  created_at: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: RsvpRecord;
  old_record: RsvpRecord | null;
}

const RESEND_API_KEY = required("RESEND_API_KEY");
const SITE_URL = required("SITE_URL");
const FROM_EMAIL = required("FROM_EMAIL");
const ADMIN_EMAIL = required("ADMIN_EMAIL");

function required(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function yn(b: boolean | null): string {
  if (b === null) return "—";
  return b ? "Yes" : "No";
}

function summaryRows(r: RsvpRecord): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    ["Name", escapeHtml(r.full_name)],
    ["Phone", escapeHtml(r.phone)],
    ["Email", escapeHtml(r.email ?? "—")],
    ["Guests", String(r.guest_count)],
    ["Dietary", r.dietary === "veg" ? "Vegetarian" : "Non-Vegetarian"],
    ["Attending Kolkata", yn(r.attending_kolkata)],
  ];
  if (r.attending_kolkata) {
    rows.push(["Kolkata events", escapeHtml((r.kolkata_events ?? []).join(", ") || "—")]);
    rows.push(["Kolkata arrival", fmtDateTime(r.kolkata_arrival)]);
    rows.push(["Kolkata departure", fmtDateTime(r.kolkata_departure)]);
    rows.push(["Kolkata accommodation", yn(r.kolkata_accommodation)]);
    rows.push(["Kolkata airport pickup", yn(r.kolkata_airport_pickup)]);
  }
  rows.push(["Attending Kerala", yn(r.attending_kerala)]);
  if (r.attending_kerala) {
    rows.push(["Kerala arrival", fmtDateTime(r.kerala_arrival)]);
    rows.push(["Kerala departure", fmtDateTime(r.kerala_departure)]);
    rows.push(["Kerala accommodation", yn(r.kerala_accommodation)]);
    rows.push(["Kerala airport pickup", yn(r.kerala_airport_pickup)]);
  }
  if (r.special_notes) {
    rows.push(["Notes", escapeHtml(r.special_notes)]);
  }
  return rows;
}

function htmlSummaryTable(r: RsvpRecord): string {
  const rows = summaryRows(r)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#3B2F2F;font-weight:600;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:6px 0;color:#3B2F2F;font-size:15px;vertical-align:top">${v}</td></tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-family:Georgia,serif">${rows}</table>`;
}

function shellHtml(opts: { heading: string; body: string }): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:32px 16px;background:#F5F1EB;font-family:Georgia,serif;color:#3B2F2F">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:6px;padding:32px;box-shadow:0 2px 12px rgba(59,47,47,0.08)">
    <div style="text-align:center;margin-bottom:24px">
      <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:0.18em;color:#3B2F2F">A&amp;A</div>
      <div style="width:60px;height:1px;background:#C4A055;margin:12px auto 0"></div>
    </div>
    <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:400;color:#3B2F2F;margin:0 0 16px;letter-spacing:0.02em">${opts.heading}</h1>
    ${opts.body}
    <div style="border-top:1px solid rgba(59,47,47,0.08);margin-top:32px;padding-top:16px;text-align:center;color:#3B2F2F;opacity:0.55;font-size:12px;letter-spacing:0.1em;text-transform:uppercase">
      #AnkitaAndAkhil &middot; July 2026
    </div>
  </div>
</body></html>`;
}

function guestEmailHtml(r: RsvpRecord, editUrl: string): string {
  const body = `
    <p style="font-size:16px;line-height:1.6">Dear ${escapeHtml(r.full_name)},</p>
    <p style="font-size:16px;line-height:1.6">Thank you so much for your RSVP. We&rsquo;ve received the details below — please reply to this email or message us at <a href="tel:+918373987643" style="color:#C4A055">+91-8373987643</a> if anything looks off.</p>
    <div style="margin:20px 0;padding:20px;background:#F5F1EB;border-radius:4px">${htmlSummaryTable(r)}</div>
    <p style="font-size:16px;line-height:1.6">If your plans change, you can update your RSVP at any time using your private edit link:</p>
    <p style="margin:16px 0"><a href="${editUrl}" style="display:inline-block;background:#3B2F2F;color:#fff;text-decoration:none;padding:12px 24px;border-radius:2px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase">Edit my RSVP</a></p>
    <p style="font-size:13px;color:rgba(59,47,47,0.6)">Or copy this link: <span style="word-break:break-all">${editUrl}</span></p>
    <p style="font-size:16px;line-height:1.6;margin-top:24px;font-style:italic">With love and gratitude,<br/>Ankita &amp; Akhil</p>
  `;
  return shellHtml({ heading: "Thank you for your RSVP", body });
}

function adminEmailHtml(r: RsvpRecord, editUrl: string): string {
  const body = `
    <p style="font-size:15px;line-height:1.6"><strong>${escapeHtml(r.full_name)}</strong> just RSVP&rsquo;d.</p>
    <div style="margin:20px 0;padding:20px;background:#F5F1EB;border-radius:4px">${htmlSummaryTable(r)}</div>
    <p style="font-size:13px"><a href="${editUrl}" style="color:#C4A055">View / edit this RSVP</a></p>
  `;
  return shellHtml({ heading: "New RSVP received", body });
}

async function sendEmail(opts: { to: string | string[]; subject: string; html: string }) {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Resend ${resp.status}: ${text}`);
  }
  return await resp.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, authorization",
      },
    });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "rsvps") {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "content-type": "application/json" },
    });
  }

  const r = payload.record;
  const editUrl = `${SITE_URL.replace(/\/$/, "")}/rsvp/edit/${r.edit_token}`;

  const tasks: Array<Promise<any>> = [];

  if (r.email) {
    tasks.push(
      sendEmail({
        to: r.email,
        subject: "Thank you for your RSVP — Ankita & Akhil",
        html: guestEmailHtml(r, editUrl),
      })
    );
  }

  const adminRecipients = ADMIN_EMAIL.split(",").map((s) => s.trim()).filter(Boolean);
  tasks.push(
    sendEmail({
      to: adminRecipients,
      subject: `New RSVP — ${r.full_name}`,
      html: adminEmailHtml(r, editUrl),
    })
  );

  const results = await Promise.allSettled(tasks);
  const errors = results
    .map((res, i) => (res.status === "rejected" ? `${i}: ${String(res.reason)}` : null))
    .filter(Boolean);

  // Log errors but still respond 200 — we don't want the webhook to retry
  // forever and risk duplicate emails.
  if (errors.length) {
    console.error("notify-rsvp partial failure:", errors);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      sent: {
        guest: r.email ? results[0].status : "skipped",
        admin: results[r.email ? 1 : 0].status,
      },
      errors,
    }),
    { headers: { "content-type": "application/json" } }
  );
});
