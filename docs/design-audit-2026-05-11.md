# Ankhil.club — Design & UX Audit

Date: 2026-05-11
Scope: full site as deployed (Hero → Events → RSVP → Travel → FAQ → Gallery → Footer)

---

## Overall verdict

The site is **well-built and structurally complete**. Tone is warm, type/color choices are tasteful (espresso/gold/cream/Kerala-green is a smart bicultural palette), and the form is more thorough than 90% of wedding sites. The audit below is mostly about **(a) missing sections** wedding guests expect, **(b) content gaps you can't fill yet but should at least scaffold**, and **(c) a handful of real UX/accessibility issues** that aren't placeholder problems — they're fixable today.

I've graded each item: **P0** = ship-blocker / common guest will be confused, **P1** = noticeably improves the site, **P2** = nice-to-have polish.

---

## 1. Information architecture — missing sections

### 1.1 No "Our Story" section — **P0**
The tech-spec lists `OurStorySection` but it isn't rendered in `App.tsx`. This is the single most expected section on a wedding site after dates. A Bengali-Hindu × Kerala-Christian wedding has an inherently interesting story — currently the site says nothing about who you two are. Add: how you met, the proposal, one engagement photo. 200 words, max.

> **Status: Done (2026-05-11).** `OurStorySection.tsx` rewritten with the real St. Stephen's → 2015 → today story, asymmetric two-column layout with overlapping `story-couple-1.jpg` + `story-couple-2.jpg`, rendered between Hero and Families. Nav entry "Story" added. Hero now has a "Read Our Story" link.

### 1.2 No families / wedding party section — **P1**
At minimum: parents' names (often expected by older relatives), and optionally siblings/wedding party. For a fusion wedding, naming both families helps cousins/aunts find their bearings.

> **Status: Done (2026-05-11).** New `FamiliesSection.tsx`, dark-brown background, two cards: Bride's side (Kiran Agarwal · Manoher Kumar Agarwal · sibling Ayush Agarwal) and Groom's side (Elsamma Binny · Binny Philip · siblings Amy Binny Philip, Allen Emmanuel Binny). Section ID `#families`, included in nav.

### 1.3 No accommodation block — **P0**
Travel section says "we can look into it" but lists **zero** hotel options. The `HotelCard` component is built (per tech-spec) but unused. Even with venues TBD, you can list 3–4 recommended hotels per city by tier (budget / mid / luxury) with approximate price bands. This is the #1 question out-of-town guests have after "where is it."

> **Status: Deferred.** Pending venue confirmation. Re-open once Kolkata and Pala/Kottayam venues are locked.

### 1.4 No "Things to do" / "Explore the cities" — **P1**
Many of Akhil's Kerala-side guests may be visiting Kolkata for the first time (and vice versa). A short list — 5 spots per city, with a one-line description — turns the trip from logistics into a vacation. Adds zero burden once written.

> **Status: Deferred.** Same gate as 1.3 — better to scope around final venues.

### 1.5 No registry / gifts policy — **P0**
Guests *will* ask. Choose one:
- "Your presence is the greatest gift" (most common in India)
- A honeymoon fund link
- An NGO donation link in lieu of gifts

Whatever you choose, **say it explicitly.** Silence makes guests anxious.

> **Status: Done (2026-05-11).** Added as FAQ entry: *"Your presence is the greatest gift. Having you celebrate this day with us — in person or in spirit — is more than enough."* Can be promoted to its own block later if a registry/honeymoon-fund decision is made.

### 1.6 No rituals explainer — **P1**
Pheras, Mehendi, Haldi, Sangeet, Christian reception — a Bengali guest may not know what "Christian-style reception" entails, and a Kerala guest may not know what a Sangeet is. A short "What to expect at each event" block (2–3 lines per ceremony) makes the site feel hospitable rather than assuming shared context. This is genuinely useful for a fusion wedding and is content you can write *now* — it doesn't depend on venue confirmation.

> **Status: Done (2026-05-11).** Each event in `EventsSection.tsx` now carries a 1–2 line "what to expect" note in the existing `notes` field — covering Reception, Mehendi & Haldi, Sangeet, Wedding/Pheras, and Kerala Reception. Bilingual-friendly framing (e.g., "Pheras — seven circles around a holy fire") so neither side's guests are left guessing.

### 1.7 No livestream / virtual attendance — **P2**
At least say "we'll share a livestream link closer to the day for those who can't travel." Even if you haven't decided.

> **Status: Done (2026-05-11).** Added as FAQ entry — promises a livestream link for the main ceremony closer to the date, with opt-in via RSVP or email.

---

## 2. Hero section

### 2.1 Two stacked countdown timers feel heavy — **P1**
The Kolkata countdown is the real event. The Kerala countdown is essentially "+12 days from the first" which doesn't create urgency — it creates visual repetition. Options, in order of preference:
1. **Single primary countdown** to July 6, with Kerala dates shown as small text below ("Kerala reception follows July 18–19").
2. Show one countdown, and only switch to the Kerala countdown *after* July 9.
3. Keep both, but make the Kerala one substantially smaller (it kind of is, but they still stack as two equally-prominent blocks).

> **Status: Done (2026-05-11) — Option 2 applied.** `HeroSection.tsx` renders a single `CountdownTimer` whose target is selected by `pickCountdown(now)`: Kolkata until `2026-07-09T00:00:00+05:30`, Kerala thereafter. Kerala dates remain visible as supporting text under the Kolkata line so the second leg isn't hidden.

### 2.2 No couple photo in hero — **P0**
`hero-background.jpg` is your only visual anchor and I can't tell what it is. Wedding hero sections almost always lead with an engagement photo of the couple. If you don't have one yet, that's a content task — get a portrait shoot before launch.

> **Status: Accepted as-is.** The hero background is an intentional silhouette of the couple from the past — keeps the photo abstract and atmospheric rather than literal. No change needed.

### 2.3 "Save the Date" label is wrong now — **P1**
RSVP is *open*, so "Save the Date" is outdated framing. Change to "We're Getting Married", "Join Us", or just lead with names + dates.

> **Status: Done (2026-05-11).** Label changed to "We're Getting Married". Initially set in muted gold (`#C4A055`); subsequently raised to white with a soft espresso text-shadow (`0 2px 12px rgba(59,47,47,0.55)`) and slightly wider tracking — the gold was disappearing against lighter areas of the silhouette photo. White-with-shadow reads reliably regardless of what's behind it.

### 2.4 Hero has no fallback for slow JS load — **P2**
The GSAP timeline sets everything to `opacity: 0` until JS executes. On slow networks/mobile, the hero is blank for 2–4 seconds. Either:
- Pre-render content visible, animate from current state
- Add a CSS-only fallback (no-JS users currently see *nothing*)

> **Status: Done (2026-05-11).** Refactored the GSAP timeline to use `gsap.from()` instead of `gsap.set() + gsap.to()` — elements now default to their final visible state in the DOM, and GSAP only tweens them *from* the hidden state into view. If JS fails to load (or is mid-load), content stays visible. Also added a `prefers-reduced-motion: reduce` check that skips the timeline entirely for users with that preference.

### 2.5 "View Events" + "RSVP Now" — good, but add "Our Story" once that section exists.

> **Status: Done (2026-05-11).** "Read Our Story →" added as a small text link under the two CTA buttons, scrolling to `#story`. Kept understated so it doesn't compete with the primary CTAs.

---

## 3. Events section

### 3.1 "Venue TBD" appears 4 times — **P0**
Visually it screams "this site is unfinished" four times in a row. Compress: one banner at the top of the Kolkata section saying *"Venues are being finalized — we'll share addresses by [date]"*, and remove "Venue TBD" from each card. The cards can show city only until venues are confirmed.

> **Status: Done (2026-05-11).** Each event's `venue` field is now optional and the cards conditionally render the venue line only when set. New `VenueBanner` component placed once under each city's section header reads *"Exact venues are being finalized — addresses will be shared with you closer to the date."* Tinted with the city's accent color (gold / Kerala-green) and a 2px left border. Replace the banner with per-card venues when addresses are confirmed.

### 3.2 Redundant copy: Mehendi card mentions Sangeet, then Sangeet has its own card — **P2**
Remove the "Followed by the Sangeet celebration in the evening" note from the Mehendi card. The next card handles it.

> **Status: Done (2026-05-11).** Folded into the 1.6 update — the Mehendi card's notes were rewritten to describe the ritual itself; the Sangeet line is gone.

### 3.3 No "Add to calendar" buttons — **P1**
Per-event `.ics` download or Google Calendar link is a 1-hour build and a meaningful UX win — many guests will block calendars *now* and forget by July without a reminder.

> **Status: Done (2026-05-11).** Each event card has an "Add to Calendar" link that opens Google Calendar in a new tab with the event pre-filled. Uses `calendar.google.com/calendar/render?action=TEMPLATE&…` with `ctz=Asia/Kolkata`, so the local IST time is preserved across guests in any timezone. Event title is prefixed with "Ankita & Akhil — ", the what-to-expect note flows into `details`, and (once set) `venue` becomes the `location`. Initial implementation generated a `.ics` data-URI download but switched to a hosted Google Calendar URL after feedback — fewer surprises, no file download UX.

### 3.4 Event cards lack visual differentiation — **P2**
All four Kolkata events look identical. A small per-ceremony icon (mehendi henna swirl, haldi yellow, sangeet music note, pheras flame/mandap) or color accent would help guests scan. Optional but warm.

> **Status: Done (2026-05-11).** Added an `EventIcon` component with five abstract line-stroke SVG icons (champagne coupe for the reception, henna leaf swirl for mehendi/haldi, paired music notes for sangeet, sacred flame for the wedding/pheras, crossing palm strokes for Kerala). Icons sit top-right of each card and inherit the city's accent color (gold for Kolkata, Kerala-green for Kerala), keeping the city-coding intact while making each ceremony visually distinct at a glance.

### 3.5 Wedding time "Morning" — **P1**
Placeholder is fine; just track to replace with actual muhurat time when set.

> **Status: Done (2026-05-11).** Muhurat time confirmed: **10:30 PM (July 8) – 12:30 AM (July 9)**. Wedding event card now displays this range, and the .ics download spans the same window. Ceremony note adjusted to "runs about 2 hours" (was "2–3 hours").

### 3.6 Bengali wedding vs Kerala Christian reception framing — **P1**
The Kerala section is labeled "Christian-Style Reception" — for a Kerala-Christian wedding this should probably just be "Reception" or "Kerala Reception." The "-Style" hedge makes it sound performative.

> **Status: Done (2026-05-11).** Renamed "Christian-Style Reception" → "Kerala Reception" in `EventsSection.tsx`.

---

## 4. RSVP section

This is the strongest part of the site, but the most opinionated changes are here because conversion matters.

### 4.1 Form is too long for a single page — **P0**
You're collecting 15+ fields. Break into **3 steps**:
1. Your details (name/phone/email/guest count/dietary)
2. Which celebrations + per-city events
3. Travel & accommodation per city + notes

Each step under "8 fields" converts dramatically better. Add a progress indicator (Step 1 of 3).

> **Status: Done (2026-05-11) — different approach.** Rather than introducing a multi-step wizard, the form was shortened by (a) initially removing the email field entirely and (b) hiding the per-city Arrival/Departure pickers until the guest answers "Yes" to accommodation or airport pickup. Net effect: a guest who doesn't need help sees a meaningfully shorter form. Email was later **re-added as optional** when 4.6/4.8 were implemented — it's now used for the edit-RSVP confirmation email but skippable.

### 4.2 Date inputs are pre-filled with arrival/departure defaults — **P0**
`kolkataArrival: '2026-07-05T18:00'` and similar defaults. Many guests will submit without noticing and you'll get bad data ("everyone arrives at 6 PM on July 5"). Use empty placeholders, or make them clearly placeholder text the user must overwrite.

> **Status: Done (2026-05-11).** Initial form state for all four date fields is now `''`. `DateTimePicker` was extended to support an empty/placeholder state — segments render dimmed `DD / MM / YYYY | HH : MM --` until the guest engages. On first interaction (click, focus, key) the picker snaps to a `fallback` ISO date the parent supplies, then behaves normally. Below each picker, a small "✓ Use suggested: Sat, Jul 5 · 6:00 pm" chip applies the suggested default in one click. Validation requires both arrival and departure to be set whenever accommodation or pickup is "Yes," so guests who skip the dates accidentally get a clear error rather than a silent garbage submission.

### 4.3 No RSVP deadline shown — **P0**
Guests need to know "RSVP by [date]." This belongs above the form. Default suggestion: 60 days before, i.e. by May 7, 2026 — which has already passed. Pick a real cutoff (e.g. June 1) and display it.

> **Status: Deferred.** Deadline not yet decided. Add later when picked — a single line above the form (e.g. "Please RSVP by [date]") is enough.

### 4.4 "Number of Guests" is ambiguous — **P1**
Is it total people (including me) or additional plus-ones? Add helper text: *"Total people in your party, including yourself"*. Also, capturing only a *count* loses names — for seating/place cards you'll want names. Consider a dynamic "Add guest 2, 3, …" pattern.

> **Status: Done (2026-05-11) — helper added.** Helper text *"Total people in your party, including yourself."* appears under the dropdown. Per-guest name capture is intentionally deferred — adds friction for the majority of guests bringing zero or one plus-one, and seating/place-card data can be requested via a follow-up message to confirmed Yes-RSVPs closer to the date.

### 4.5 Dietary is binary veg/non-veg — **P1**
Doesn't cover: vegan, Jain, no-onion-garlic, halal, allergies. Add a free-text "Allergies / dietary notes" field. Also surface the food policy *before* the form ("Kolkata is fully vegetarian; Kerala has veg and non-veg") — it's currently buried in FAQ and matters to the dietary answer.

> **Status: Done (2026-05-11).** Dietary radio is unchanged (veg / non-veg) but the food policy is now surfaced inline under it: *"Kolkata events are fully vegetarian; the Kerala reception has both vegetarian and non-vegetarian options."* The Special Notes textarea was relabeled with a placeholder explicitly inviting allergies and accessibility info: *"Allergies, accessibility needs, or anything else we should know..."*

### 4.6 No confirmation email mention — **P1**
After submit, the success state says "we'll be in touch" but doesn't tell the user *they* will receive anything. If you're emailing a copy of their RSVP, say so. If not — start; guests want a record of what they submitted.

> **Status: Done (2026-05-11) — code shipped, external setup required.** Email is re-added as an **optional** field with helper *"We'll email you a confirmation and a link to edit your RSVP later."* On INSERT, the new `notify-rsvp` Supabase Edge Function (`app/supabase/functions/notify-rsvp/`) sends two emails via **Resend**: a guest confirmation with a private edit link, and an admin notification to `support@ankhil.club`. The function is triggered by a Database Webhook on the `rsvps` table. See `docs/email-edit-setup.md` for the one-time external setup (Resend account, DNS records, secrets, webhook config). Cost: $0 — Resend free tier (3,000/month) and Supabase free tier both cover this comfortably.

### 4.7 Generic error state — **P2**
"Something went wrong" should include: *"…or message us at +91-8373987643 / support@ankhil.club"*. Don't lose an RSVP to a transient Supabase blip.

> **Status: Done (2026-05-11).** Error banner now reads *"Something went wrong while submitting. Please try again, or message us at +91-8373987643 / support@ankhil.club."* Both contact methods are clickable (`tel:` and `mailto:` links).

### 4.8 No edit-RSVP flow — **P2**
People change plans. A magic-link "edit your RSVP" via email is a P2 but worth considering.

> **Status: Done (2026-05-11).** Each RSVP row now carries a `uuid edit_token`. Two SECURITY DEFINER RPCs (`get_rsvp_by_token`, `update_rsvp_by_token`) let an anonymous client read or update only that one row, scoped by the unguessable token (~122 bits of entropy). New route `/rsvp/edit/:token` reads the row, pre-fills the form, and lets the guest save changes. The form was extracted into a reusable `RSVPForm` component so create and edit share code. The edit URL is delivered two ways: (a) emailed to the guest via the `notify-rsvp` Edge Function (per 4.6), and (b) shown on the success screen with a Copy button — so guests without email aren't locked out. SQL migration: `app/supabase/migrations/20260511000000_rsvp_edit_token.sql`. Apply via Supabase Studio SQL editor or `supabase db push`.

### 4.9 Timezone of arrival/departure inputs — **P2**
Datetime-local inputs don't display a timezone. Add helper text *"Local time on arrival (IST)"* so there's no ambiguity for anyone filling the form while travelling.

> **Status: Done (2026-05-11) — implicitly.** The conditional helper text now reads *"To help us coordinate accommodation [and/or your pickup], please share your expected travel dates."* Times are understood as IST in context (guest is arriving in Kolkata/Kerala). A literal "(IST)" tag can be added later if anyone is confused, but the local-airport framing made it feel redundant.

### 4.10 Phone required, email optional — **P1**
Phone-only is sensible for an India-only guest list. Worth confirming whether every invited guest actually has an Indian number — if any don't, accept international formats or require email *or* phone.

> **Status: Accepted as-is — Indian number only.** Couple confirmed: no international guests expected, every invited guest has a +91 number. Placeholder stays `+91-XXXXXXXXXX`. The email-or-phone alternative is moot now that email has been removed.

---

## 5. Travel section

### 5.1 No hotel recommendations — **P0** (duplicate of 1.3, but specifically here)
Build the `HotelCard` block. Even 3 hotels × 2 cities = 6 cards is enough.

> **Status: Deferred.** Same gate as 1.3 — pending venue confirmation.

### 5.2 No embedded maps — **P1**
"Pala / Kottayam" means very little to someone unfamiliar with central Kerala. A small static Google Maps embed (or just a "View on Maps →" link) per city orients people.

> **Status: Deferred.** Pending venue confirmation — easier to embed a map of the venue itself than a generic city pin.

### 5.3 Travel-between-cities tip is weak — **P1**
You say "book early" and "2.5–3 hour flight." Better: name actual carriers that fly CCU–COK (IndiGo, Air India), typical price range, and whether direct or one-stop.

> **Status: Deferred.** Couple wants to revisit closer to launch when fare ranges are more accurate.

### 5.4 Visa info missing for international guests — **P1**
A short note: *"International guests — most nationalities need an e-Visa. Apply at indianvisaonline.gov.in at least 4 weeks before travel."*

> **Status: Scoped out.** Couple confirmed: no international guests expected. International-visa content is out of scope for this site and has been pruned from the doc.

### 5.5 Weather / packing tips — **P2**
July = monsoon. *"Expect humidity and rain; bring a light umbrella and comfortable shoes."* Useful and friendly.

> **Status: Done (2026-05-11).** New "Weather & What to Pack" note added under the existing Travel Between Cities block, tinted with the Kerala-green accent. Mentions monsoon, 28–34°C humid days, rain frequency (especially in Kerala), and concrete packing recs (light umbrella / rain jacket, breathable cottons, comfortable closed-toe shoes, power bank, water bottle).

### 5.6 No "Travel between cities" travel-day padding guidance — **P2**
You hint at it ("a few days' gap"). Make it concrete: "We recommend arriving July 5 in Kolkata, departing July 9, and arriving Kerala by July 17."

> **Status: Done (2026-05-11).** "Travel Between Cities" note updated: now reads *"…we suggest arriving in Kolkata by July 5, departing on July 9, and arriving in Kerala by July 17 — comfortable margins on both ends, with no same-day connections."* The three suggested dates are bolded so they read at a glance.

---

## 6. FAQ section

### 6.1 Only 5 FAQs — needs ~10 more — **P0**
Currently missing:
- Are kids welcome?
- Are plus-ones allowed? (Or "we've reserved seating only for invited guests")
- Gifts / registry? (mirrors 1.5)
- Will alcohol be served? (matters for Christian + Hindu families)
- What language will the ceremony be in?
- How do I dress for each ceremony in more detail? (e.g. should women cover heads, can men wear suits to mehendi)
- What if I can only make one of the two weddings?
- Will there be Wi-Fi at the venue?
- How do I get a hard-copy invitation?
- Who do I contact on the day of?

> **Status: Scoped out by couple.** The suggested list didn't match how this wedding is being run — most of these are handled implicitly (per-invite plus-ones, no alcohol policy needed, dress code in event cards, support contact in footer/FAQ). Couple will add specific FAQs themselves if real questions surface from guests. The gifts and livestream items already landed via 1.5 / 1.7.

### 6.2 "How will the food be served?" — **P1**
Phrasing is off. Rename to *"What food will be served?"* and surface this earlier (per 4.5).

> **Status: Done (2026-05-11).** FAQ entry renamed to *"What food will be served?"* and the answer slightly tightened. The veg/non-veg policy is also now surfaced inline under the dietary radio in the RSVP form (per 4.5), so guests see it at the moment they need it.

### 6.3 Commented-out CCU→COK FAQ — **P2**
Either uncomment it or delete the dead code. Right now it's a maintenance smell.

> **Status: Deferred.** Couple wants to keep it commented for now and re-enable (with the actual travel-between-cities phrasing) once venues are confirmed.

---

## 7. Gallery section

### 7.1 No real photos yet — **P0** (content issue)
Five `gallery-N.jpg` placeholders titled "Wedding moment" is fine *if* you're going to replace them — but rename the section to **"Before the wedding"** or **"Our story in pictures"** and fill with engagement / pre-wedding shoot photos. After the wedding, you can replace with actual day-of photos and rename.

> **Status: Done (2026-05-12).** Placeholders replaced with four real photos (college Onam, NYC Lego set, Puducherry dinner walk, auto-ride selfie). Section heading renamed *"Moments & Memories" → "Moments So Far"* — works pre-wedding and stays accurate after.

### 7.2 All `alt="Wedding moment"` — **P1** (accessibility)
Identical alt text on every image is worse than no alt for screen reader users. Make each one descriptive — *"Ankita and Akhil at Coorg, 2024"* etc.

> **Status: Done (2026-05-12).** Each photo now has a descriptive `alt` string written by the couple (e.g., *"Akhil and Ankita celebrating Onam in college"*).

### 7.3 No lightbox / zoom — **P1**
Clicking an image does nothing. Users expect to enlarge. Add a basic lightbox.

> **Status: Rejected (2026-05-12).** Briefly built (full-screen modal with Esc / ←→ / click-outside / position counter) but the couple didn't like the feel — the modal jarred the calm, scroll-driven flow of the rest of the page. Reverted. Thumbnails remain hover-only with the subtle gold-line scrim.

### 7.4 No captions — **P2**
A short caption per image (date, place) adds personality without much work.

> **Status: Rejected (2026-05-12).** Briefly rendered the `alt` strings as visible italic captions under each thumbnail; reverted alongside 7.3. The images are read clearly enough at the thumbnail sizes used; captions felt like noise. Alt text remains for screen readers (per 7.2).

### 7.5 Dead code: `gallery-6.jpg` commented out — **P2**
Either include or delete.

> **Status: Done (2026-05-12).** Commented-out gallery-5 / gallery-6 entries removed.

---

## 8. Navigation

### 8.1 Add "Our Story" once that section exists — **P1**
Insert between Events and RSVP, or between A&A and Events.

> **Status: Done (2026-05-11).** Nav order is now Story · Families · Events · RSVP · Travel · FAQ · Gallery. Worth eyeballing at ~768px since 7 items is tight; shrinkable to "Family" or `gap-5` if it wraps.

### 8.2 Mobile hamburger has 2 lines instead of 3 — **P2**
Visually minor but the 3-line "hamburger" is universally recognized. 2 lines reads as "equals sign" or unclear icon.

> **Status: Done (2026-05-12).** Third line added in `Navigation.tsx`; spacing tightened from `gap-1.5` to `gap-1` to keep the icon proportionate.

### 8.3 No active-section highlight as user scrolls — **P2**
Standard nav UX: highlight the section currently in view. Small win.

> **Status: Done (2026-05-12).** Scrollspy implemented via `IntersectionObserver` in `Navigation.tsx`. Each section is observed with a `rootMargin: '-50% 0px -40% 0px'` band — a 10%-tall trigger strip across the vertical middle of the viewport. As a section crosses that strip, its corresponding nav item gets the gold underline (`scale-x-100`), reusing the existing hover-underline pattern so visited / hovered / active all read consistently. `aria-current` set on the active item for screen readers. Test environments without `IntersectionObserver` short-circuit gracefully.

---

## 9. Footer

### 9.1 No social link for #AnkitaAndAkhil — **P1**
The hashtag exists; link it. Either a private Instagram for the wedding or your existing handles.

> **Status: Scoped out (2026-05-12).** Couple confirmed they don't want a social link. Verified no hidden / commented-out social code anywhere in `app/src` — clean. The hashtag stays as a styled text sentiment, not a link.

### 9.2 No privacy / data note — **P1**
You're collecting names, phones, emails, dietary info, travel dates into Supabase. Add one line: *"Your information is used only for wedding planning and will not be shared."* India's DPDP Act technically applies; even a sentence is fine.

> **Status: Done (2026-05-12).** One-line privacy note added above the copyright in `Footer.tsx`, in subdued tone — same text as recommended verbatim. Light enough not to disrupt the warm closing, but present for guests who look.

### 9.3 "© 2026" is fine but consider also showing "Last updated" — **P2**
Wedding sites change. A small "Updated [date]" reassures returning guests they're seeing current info.

> **Status: Done (2026-05-12).** Copyright line now reads *"© 2026 Ankita & Akhil · Updated May 12, 2026"*. Date is hardcoded for now — bump it when material content changes (venues, dates, RSVP deadline). If this becomes a chore, a 5-line Vite plugin can stamp the build date at compile time.

---

## 10. Cross-cutting issues

### 10.1 Color contrast on gold #C4A055 against cream #F5F1EB — **P1** (accessibility)
This combo is borderline at body-text sizes (likely fails WCAG AA 4.5:1). Section labels and footer links use this — verify with a contrast checker. Easy fix: darken the gold to ~`#A8841E` for small text, keep the lighter gold for large display use.

> **Status: Done (2026-05-12).** Introduced a new CSS variable `--muted-gold-text: #8B6914` (darker than the audit's suggested `#A8841E` for a safer AA margin against `#F5F1EB`). `.section-label` now uses it — passes WCAG AA at the 12px section-label size. The bright `--muted-gold` (`#C4A055`) is retained for decorative accents (gold lines, timeline dots, hover states) and for text on dark-brown backgrounds where it already passes AA. New `.section-label-light` class (paralleling the existing `.section-heading-light`) wraps the bright gold for use on dark backgrounds — applied to the section labels in RSVPSection, FAQSection, FamiliesSection, and RSVPEditPage. Hover-only gold accents on cream backgrounds were left bright (per WCAG, transient state isn't held to the same contrast bar).

### 10.2 No Open Graph / Twitter card image — **P0**
When someone shares `ankhil.club` on WhatsApp (and they *will*), there's no preview image. Add:
```html
<meta property="og:image" content="https://ankhil.club/og-image.jpg" />
<meta property="og:title" content="Ankita & Akhil — July 2026" />
<meta property="og:description" content="..." />
<meta name="twitter:card" content="summary_large_image" />
```
A simple 1200×630 image with both names, dates, and a photo. This is the highest-leverage 30-minute fix on the site.

> **Status: Done (2026-05-12).** Full Open Graph and Twitter card tags added to `app/index.html`. Title: *"Ankita & Akhil — July 2026"*. Description: the same Kolkata + Kerala summary already in the meta description. Image: `https://ankhil.club/images/story-couple-1.jpg` (per couple's preference). Note: that asset's aspect ratio isn't the OG-ideal 1.91:1 (1200×630), so social platforms will letterbox or center-crop. Acceptable trade-off — the photo is the right *content*, and an OG-optimized derivative (1200×630 export with text overlay) can be added later under `/images/og-2026.jpg` and swapped in without code changes. `twitter:card` set to `summary_large_image` so it gets a full-bleed preview on X.

### 10.3 Default favicon (vite.svg) — **P0**
Looks unprofessional in browser tabs. Replace with a simple A&A monogram favicon (the gold initials over cream would work directly).

> **Status: Done (2026-05-12).** Custom SVG favicon at `app/public/favicon.svg`: 32×32 rounded espresso square with "A&A" centered in muted gold (Georgia serif) and a short gold underline beneath — same gold-rule motif used throughout the site. SVG renders sharp at any zoom level. Referenced via `<link rel="icon" type="image/svg+xml">` and also as `apple-touch-icon` in `index.html`. The Vite default icon is no longer linked.

### 10.4 `/admin` route exists — **P0** (security check)
`AdminPage.tsx` is routed at `/admin`. Verify it requires auth before deploying — if it lists RSVPs unauthenticated, that's a data leak. Worth a quick re-read.

> **Status: Resolved (2026-05-12).** Couple confirmed `/admin` is password-protected. No further action.

### 10.5 No 404 page — **P2**
React Router renders nothing for unknown routes. Add a catch-all that lands users back on `/`.

> **Status: Done (2026-05-12).** New `NotFoundPage.tsx` rendered at `path="*"` catch-all in `App.tsx`. Page chrome matches the site: cream background, centered card layout. Decorative art is on-brand — a large italic Playfair ampersand in muted gold, flanked by the site's recurring horizontal gold-rule motif. Below: section-label "404", section-heading "Page Not Found", and a warm one-liner *"The page you were looking for has wandered off. Let's get you back to where the celebration is."* Primary CTA links back to `/`. Stays light/playful instead of stern, matching the wedding tone.

### 10.6 No bilingual touches — **P2**
A fusion wedding site that's entirely in English misses an opportunity. Even one word — *"Shubho Bibaho"* (Bengali) at the top of the Kolkata section, *"Mangalam"* at the top of the Kerala section — costs nothing and signals warmth to both families.

### 10.7 Domain `.club` — **P2**
Lower trust signal than `.com`. Not worth changing now (link is out), but if guests complain about it landing in spam folders, that's why.

---

## 11. Content "to fill later" — checklist

Things you can't write today but should leave scaffolded so they're easy to drop in:

- [ ] Hero photo (engagement portrait)
- [ ] Venue addresses (4 Kolkata + 1 Kerala) + map embeds
- [ ] Exact event times (replace "Morning", "Evening")
- [ ] Hotel block list (3–4 per city)
- [ ] Real gallery photos (engagement → wedding day)
- [ ] Registry / gifts decision
- [ ] Livestream link
- [ ] Day-of contact (often a friend or wedding coordinator, not you two)
- [ ] OG image (1200×630)
- [ ] Custom favicon
- [ ] Final RSVP deadline date

---

## 12. Recommended prioritization

If you can only do one weekend of work, do these in order:

1. **OG image + favicon** (30 min, biggest visible polish improvement when shared)
2. ~~**Add "Our Story" section**~~ — done 2026-05-11
3. **Compress "Venue TBD" to one banner** (15 min)
4. **Expand FAQ to ~12 entries** (1 hour) — partially done (gifts + livestream added); still need kids, plus-ones, alcohol, language, dress detail, single-leg-attendance, Wi-Fi, hard-copy invite, day-of contact
5. **Split RSVP form into 3 steps** (3 hours)
6. **Add hotel recommendations (use existing `HotelCard`)** (1 hour + 30 min of research per city) — deferred to venue confirmation
7. **Set & display RSVP deadline** (10 min)
8. **Fix gold-on-cream contrast for small text** (15 min)
9. **Replace placeholder gallery with engagement photos** (whenever shoot happens)
10. ~~**Add registry / gifts decision**~~ — done 2026-05-11 (presence-is-the-gift line)

Steps 1, 3, 4 (rest), 7, 8 are roughly a 3-hour pass that meaningfully changes how the site feels.

---

## 13. Change log

- **2026-05-11** — Audit written. Same day: implemented 1.1, 1.2, 1.5, 1.6, 1.7, 2.1 (Option 2), 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5 (muhurat 10:30 PM–12:30 AM), 3.6, 4.1 (alt approach), 4.2, 4.4, 4.5, 4.6 + 4.8 (transactional email + edit-RSVP shipped — Supabase Edge Function `notify-rsvp` + Resend + token-scoped RPCs + new `/rsvp/edit/:token` route; one-time external setup in `docs/email-edit-setup.md`), 4.7, 4.9, 5.5, 5.6, 6.2, 8.1. Email field re-added as optional after 4.6/4.8. `RSVPForm` extracted as a reusable component (used by both create and edit). Hero label contrast bumped to white with shadow. 3.3 calendar handoff switched from `.ics` download to a Google Calendar URL after feedback. `DateTimePicker` extended with a placeholder/`fallback` mode to support empty initial state. Accepted 2.2 (silhouette by design) and 4.10 (Indian phone only). Scoped out 5.4 (no international guests expected; international-visa content pruned from doc) and 6.1 (handled per-invite/elsewhere — couple will add real FAQs as questions surface). Deferred 1.3, 1.4, 5.1, 5.2, 5.3, 6.3 (venue-gated), 4.3 (deadline not picked).
- **2026-05-12** — Implemented 7.1, 7.2, 7.5: gallery placeholders replaced with four real photos (college Onam, NYC Lego, Puducherry dinner walk, auto-ride selfie), section heading renamed to *"Moments So Far"*, descriptive alt strings written by the couple. Dead commented-out gallery entries removed. Initially also built 7.3 (lightbox) and 7.4 (visible captions); both were rejected on review — the modal disrupted the page's calm scrolling feel, and visible captions felt like noise at thumbnail sizes. Reverted. Alt text retained for screen readers. Implemented 8.2 (third hamburger line), 8.3 (IntersectionObserver scrollspy with gold underline on active nav item, `aria-current` for a11y), 9.2 (privacy note in footer; couple also removed the `#AnkitaAndAkhil` hashtag separately), 9.3 (last-updated date stamped next to copyright). Scoped out 9.1 (no socials wanted; verified no hidden social code exists). Implemented 10.1 (new `--muted-gold-text: #8B6914` for small text on cream, `.section-label-light` for dark backgrounds), 10.2 (Open Graph + Twitter Card meta tags pointing at `/images/story-couple-1.jpg`), 10.3 (custom A&A monogram SVG favicon replacing the Vite default), 10.5 (themed 404 page at the catch-all route — giant gold-italic ampersand flanked by gold rules, warm copy, Back-to-Home CTA). Marked 10.4 resolved (couple confirmed `/admin` is password-protected). Also: post-RSVP success now smooth-scrolls the section to the top of the viewport so the "Thank You" confirmation never lands off-screen.
