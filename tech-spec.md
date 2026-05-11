# Tech Spec — Ankita & Akhil Wedding Website

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.0.0 | UI framework |
| react-dom | ^19.0.0 | React DOM renderer |
| react-router-dom | ^7.0.0 | SPA routing (single page, hash anchors) |
| gsap | ^3.12.0 | Core animation engine — timelines, tweens, scroll-driven animations |
| lenis | ^1.2.0 | Smooth scroll with inertia |
| tailwindcss | ^4.0.0 | Utility-first CSS |
| @tailwindcss/vite | ^4.0.0 | Tailwind Vite integration |
| vite | ^6.0.0 | Build tool |
| @vitejs/plugin-react | ^4.0.0 | React Vite plugin |
| typescript | ^5.6.0 | Type safety |
| @types/react | ^19.0.0 | React type definitions |
| @types/react-dom | ^19.0.0 | ReactDOM type definitions |

Fonts loaded via Google Fonts `<link>` (Playfair Display 400, Cormorant Garamond 400/600). No npm font packages.

---

## Component Inventory

### Layout

| Component | Source | Reuse | Notes |
|-----------|--------|-------|-------|
| Navigation | Custom | Global | Fixed top bar. Desktop: inline links. Mobile: hamburger → full-screen overlay. Uses Lenis `scrollTo()` for anchor nav. |
| Footer | Custom | Global | Centered initials, contact line, social placeholder links, closing message, hashtag. |

### Sections (page-level, used once each)

| Component | Source | Notes |
|-----------|--------|-------|
| HeroSection | Custom | Full-viewport, layered entrance sequence (GSAP timeline), live countdown timers, CTA buttons. |
| OurStorySection | Custom | Asymmetric two-column layout with overlapping images. |
| EventsSection | Custom | Alternating left/right timeline cards, vertical timeline line with animated fill. |
| RSVPSection | Custom | Dark background, form card with controlled inputs, validation, submit state machine (idle / submitting / success). |
| TravelSection | Custom | Two-column city info cards, full-width transport notes bar. |
| FAQSection | Custom | Accordion list with expand/collapse using CSS max-height transition. |
| GallerySection | Custom | Masonry-style responsive grid with hover overlay effect. |

### Reusable Components

| Component | Source | Used By | Notes |
|-----------|--------|---------|-------|
| Button | Custom | HeroSection, RSVPSection | Two variants (primary, secondary) + text-link. Rectangular (`border-radius: 0`). |
| SectionLabel | Custom | All sections | "SECTION NAME" — uppercase, gold, spaced. Shared pattern extracted. |
| SectionHeading | Custom | All sections | H2 — Playfair Display, uppercase, espresso. Shared pattern extracted. |
| ScrollReveal | Custom | All sections | Wrapper component. Accepts children + optional config (direction, stagger, delay). Uses a single shared GSAP ScrollTrigger per element to avoid duplication. |
| CountdownTimer | Custom | HeroSection | Accepts `targetDate` prop. Returns interval-driven display (DD:HH:MM:SS). Auto-cleanup on unmount. |
| EventCard | Custom | EventsSection | Timeline card with dot connector. Props for alignment (left/right) and dot color (gold/green). |
| AccordionItem | Custom | FAQSection | Controlled open/close with CSS max-height transition. Manages own state. |
| HotelCard | Custom | TravelSection | Mini card within city card. Hotel name, area, link. |

### Hooks

| Hook | Purpose |
|------|---------|
| useCountdown | Shared by both countdown timers. Accepts target Date, returns `{days, hours, minutes, seconds, expired}`. Uses `setInterval(1000)` with cleanup. |

---

## Animation Implementation

| Animation | Library | Implementation Approach | Complexity |
|-----------|---------|------------------------|------------|
| Hero page-load sequence (bg fade → label → names → line → dates → countdown → CTAs) | GSAP timeline | Single `gsap.timeline()` with sequential `.to()` calls and calculated delays. Runs once on mount. | **High** 🔒 |
| Hero background fade-in | GSAP | Timeline step 1: `opacity: 0 → 1` over 1.2s. | Low |
| Hero content stagger reveal | GSAP | Timeline steps 2–7: each element `opacity + translateY` with staggered delays. Names use `power2.out`. Decorative line uses animated `width: 0 → 80px`. | Medium |
| Scroll-triggered fade-in (all sections) | GSAP + ScrollTrigger | `ScrollReveal` component wraps content. On viewport entry (80% from top), plays one-shot `opacity + translateY` tween. Configurable direction/stagger. | Medium |
| Stagger pattern (cards, gallery, accordion, form fields) | GSAP + ScrollTrigger | Parent container triggers `gsap.to(children, { stagger: 0.15, ... })` on scroll entry. | Low |
| Event card slide-in (alternating directions) | GSAP + ScrollTrigger | Left cards: `translateX(-30px → 0)`. Right cards: `translateX(30px → 0)`. `stagger: 0.2s`. Timeline line height animates in sync. | Medium |
| Timeline line draw | GSAP + ScrollTrigger | Animate `height: 0 → 100%` (via scaleY) tied to scroll position as cards enter viewport. | Medium |
| Countdown timer | React state + setInterval | `useCountdown` hook. No animation library — pure state updates every second. "Expired" state swaps display text. | Low |
| Gallery image stagger | GSAP + ScrollTrigger | Grid items stagger in: `opacity + translateY(30px → 0)`, `stagger: 0.12s`, `duration: 0.7s`. | Low |
| Navigation gold underline hover | CSS | `::after` pseudo-element, `transform: scaleX(0 → 1)`, `transform-origin: left`. Pure CSS transition. | Low |
| Button hover fill | CSS | `transition: background-color 0.3s ease`. Pure CSS. | Low |
| Card hover lift | CSS | `transition: transform 0.3s ease, box-shadow 0.3s ease`. `translateY(-2px)` + shadow on hover. | Low |
| Image hover overlay | CSS | `transition: filter 0.4s ease, opacity 0.4s ease`. Overlay div with `opacity: 0 → 1`. | Low |
| Accordion expand/collapse | CSS | `max-height: 0 → [large value]` transition with `overflow: hidden`. Toggle via React state class. No JS animation needed. | Low |
| Footer elements fade-in | GSAP + ScrollTrigger | Standard scroll-triggered fade-in on footer container. | Low |
| RSVP form field stagger | GSAP + ScrollTrigger | Form fields stagger in: `stagger: 0.08s` on scroll entry. | Low |
| Success message reveal | GSAP | On submit success: `gsap.to()` fade-in + `translateY(20px → 0)`, 0.6s. Replaces form card. | Low |

**Total animations: 18**

**🔒 High complexity — requires architectural attention:**
Hero page-load sequence is the site's signature moment. A single GSAP timeline must coordinate 7 sequential steps with precise timing. The timeline must be created in a `useEffect` and killed on unmount. It must not re-fire on React re-renders (use a ref flag).

---

## State & Logic Plan

### RSVP Form State Machine

Three states: `idle` → `submitting` → `success`.

- **idle**: Form editable. Submit button shows "Submit RSVP". Validate on submit attempt (required fields: name, email, kolkata events checkbox, kerala attendance radio). Display inline errors in Maroon.
- **submitting**: Button text → "Submitting...", opacity `0.7`. Form inputs disabled. Simulate async delay (`setTimeout 1500ms`) to mimic backend call.
- **success**: Form card replaced by success message (GSAP fade-in). Data stored as JSON in `localStorage` under key `rsvp-data` for future backend integration. No actual API call.

### Accordion State (FAQ)

Each `AccordionItem` manages its own `isOpen` boolean. Single-item-open behavior is **not** required (multiple items can be open simultaneously). No lift-up state needed.

### Countdown Logic

`useCountdown(targetDate: Date)` hook:
- On mount: calculate remaining time immediately (avoid 1-second flash of default values).
- `setInterval(1000)` updates derived `{days, hours, minutes, seconds}`.
- Auto-cleans interval on unmount.
- Returns `expired: boolean` — when true, display swaps to static celebratory text.
- Two independent instances in HeroSection (Kolkata target: `2026-07-06T00:00:00+05:30`, Kerala target: `2026-07-18T18:00:00+05:30`).

### Lenis ↔ GSAP ScrollTrigger Integration

Lenis must drive ScrollTrigger's scroll position. On Lenis initialization, connect via `lenis.on('scroll', ScrollTrigger.update)` and configure `gsap.ticker.add((time) => lenis.raf(time * 1000))` with `gsap.ticker.lagSmoothing(0)`. This ensures all GSAP scroll animations use Lenis-smoothed scroll position. Pause Lenis when modals/overlays are active (mobile nav overlay).

### Navigation Scroll Offset

Lenis `scrollTo('#section-id', { offset: -48 })` where `48px` is the nav height. This accounts for the fixed nav covering section tops.

---

## Other Key Decisions

### Single Page Architecture

No routing needed beyond hash anchors. `react-router-dom` is listed as a dependency for potential future multi-page expansion, but the initial build uses a single page with Lenis-driven anchor scrolling. All section content lives in one file tree.

### Image Strategy

10 total images (1 hero, 2 story, 7 gallery). All are AI-generated assets specified in design. Stored as static files in `public/images/`. No CDN, no image optimization pipeline beyond Vite's built-in asset handling. All images use `loading="lazy"` except the hero background.

### Form Data Storage

RSVP submissions stored in `localStorage` as a JSON array. Each submission gets a `timestamp` and `id` (timestamp-based). This enables future backend integration without changing the form structure — simply replace the `localStorage` write with a `fetch()` call.

### No Lightbox for Gallery

Gallery images are display-only (no click-to-expand lightbox). This keeps bundle size down and avoids additional dependencies. If needed later, a lightweight lightbox can be added without structural changes.
