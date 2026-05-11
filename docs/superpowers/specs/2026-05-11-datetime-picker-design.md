# DateTimePicker Component — Design Spec

**Date:** 2026-05-11
**Status:** Approved

## Overview

Replace the four native `datetime-local` inputs in `RSVPSection.tsx` with a custom `DateTimePicker` component that matches the wedding site's visual theme (warm ivory, deep espresso, muted gold; Cormorant Garamond / Playfair Display typefaces).

## Interaction Model

Segmented inline editor. The component renders all date/time parts as individual clickable segments inside a single input-styled container — no calendar popup or overlay.

```
[ DD ] / [ MM ] / [ YYYY ]  |  [ HH ] : [ MM ] [ AM/PM ]
```

Clicking a segment activates it (gold highlight). The user can then type digits or use arrow keys to change the value. When a segment fills (e.g. two digits typed for month), focus auto-advances to the next segment.

## Segments

| Segment | Range     | Digit input        | Arrow keys     |
|---------|-----------|-------------------|----------------|
| Day     | 1–31      | 2 digits, auto-advance | ±1, wraps  |
| Month   | 1–12      | 2 digits, auto-advance | ±1, wraps  |
| Year    | 2025–2027 | 4 digits           | ±1             |
| Hour    | 1–12      | 1–2 digits, auto-advance | ±1, wraps |
| Minute  | 0–59      | 2 digits, auto-advance | ±1, wraps  |
| AM/PM   | AM / PM   | 'a' or 'p' key    | toggles        |

All segments are editable.

## Keyboard Navigation

- **Tab / Shift+Tab** — move forward/backward through segments
- **↑ / ↓** — increment / decrement active segment
- **0–9** — type value directly; auto-advances when segment is full
- **Escape** — deselect active segment

## Visual States

**Idle:** standard form input styling (`bg-white/80`, `border border-[rgba(59,47,47,0.15)]`, `rounded-[2px]`). Separators (`/`, `:`, `|`) rendered in muted espresso.

**Active segment:** highlighted with `bg-[#C4A055] text-white` on the active segment only; outer container border switches to `border-[#C4A055]` with a subtle gold ring (`ring-2 ring-[rgba(196,160,85,0.15)]`), matching the site's existing focus style.

**Disabled:** `opacity-50 cursor-not-allowed`, consistent with other form fields during submission.

## Component API

```tsx
interface DateTimePickerProps {
  value: string;       // "YYYY-MM-DDTHH:MM" — same format as datetime-local
  onChange: (val: string) => void;
  disabled?: boolean;
}
```

Drop-in replacement for `<input type="datetime-local">`. No changes to `RSVPSection` form state, validation logic, or Supabase payload.

## Internal Value Handling

The component stores and emits time in 24-hour format (`"YYYY-MM-DDTHH:MM"`) to match the existing form state and Supabase payload. Internally it converts to 12-hour for display:

- On parse: hour 0 → 12 AM, hours 1–11 → AM, hour 12 → 12 PM, hours 13–23 → (hour−12) PM
- On emit: AM 12 → 0, AM 1–11 → as-is, PM 12 → 12, PM 1–11 → (hour+12)

Segment wrapping is independent — incrementing minute past 59 wraps to 0 without carrying into hour.

## File Location

```
src/components/DateTimePicker.tsx
```

## Integration Points

Replace these four inputs in `RSVPSection.tsx`:

1. `kolkataArrival` (currently pre-filled `2026-07-05T18:00`)
2. `kolkataDeparture` (currently pre-filled `2026-07-09T10:00`)
3. `keralaArrival` (currently pre-filled `2026-07-18T12:00`)
4. `keralaDeparture` (currently pre-filled `2026-07-20T10:00`)

## Out of Scope

- No calendar popup / month grid
- No date range validation between arrival and departure (not in existing form)
- No mobile-specific adaptations beyond what works with touch tap-to-focus
