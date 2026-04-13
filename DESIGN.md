# VibeFlow Design System — Love Theme Production Edition

## Visual Direction
Premium social video platform combining TikTok, Instagram, and Tinder paradigms. Dark immersive experience with rose-pink energy and gold luxury accents. iOS mobile-first, desktop responsive. Real backend functionality throughout.

## Color Palette

| Token | OKLCH | Purpose |
|-------|-------|---------|
| Primary | `0.65 0.22 10` | Rose-pink — action buttons, active states, highlights |
| Secondary | `0.55 0.2 340` | Purple — depth, secondary actions |
| Accent | `0.78 0.14 75` | Gold — premium features, tips, upgrades |
| Background | `0.1 0.012 15` | Near-black — immersive dark canvas |
| Foreground | `0.94 0.008 60` | White text — high contrast, accessibility |
| Card | `0.15 0.018 15` | Elevated surfaces — slightly lighter than bg |
| Muted | `0.22 0.015 15` | Disabled states, secondary text |
| Destructive | `0.6 0.22 25` | Red — delete, unfavorable actions |

## Typography

| Layer | Font | Usage |
|-------|------|-------|
| Display | Playfair Display (serif) | Headings, profile names, premium badges |
| Body | Figtree (sans) | Copy, UI text, inputs |
| Mono | System (monospace) | Code, timestamps, technical text |

## Spacing & Density
Mobile-first: 4px grid base. Dense cards (sm spacing between elements), loose sections (lg gaps between zones).

## Elevation & Depth

| Level | Shadow | Use Case |
|-------|--------|----------|
| Base | None | Cards, popover backgrounds |
| iOS-SM | Soft 1–3px | Form inputs, small badges |
| iOS-MD | Medium 3–6px | Cards, modals, elevated surfaces |
| iOS-LG | Strong 10–20px | Floating action buttons, full-screen overlays |

## Structural Zones

| Zone | Background | Border | Use |
|------|-----------|--------|-----|
| Header | `transparent` gradient overlay | None | Home/Explore/Profile top (floats above content) |
| Video Feed | Background | None | Vertical snap-scroll fullscreen |
| Chat Bubbles (Sent) | Gradient (pink→purple) | None | WhatsApp-style message bubbles |
| Chat Bubbles (Received) | Card (`0.22 0.018 15`) | Subtle border | Incoming messages, contrast |
| Settings Section | Card | Subtle border (`0.22 0.018 15`) | iOS-style collapsible sections |
| Action Rail | `transparent` background | None | 3-dot, like, comment, share, save icons (right edge, vertical) |

## Component Patterns
- **Buttons:** Primary (gradient bg, white text), Secondary (card bg, primary text), Outline (transparent, primary border)
- **Inputs:** Card background, subtle border, 16px font size (iOS safe), no focus ring (use primary glow)
- **Toggles:** iOS switch style (51×31px, smooth animation, primary when enabled)
- **Badges:** Inline notification badge (rose-pink bg, white text, 20px height)
- **Cards:** Card background + iOS-MD shadow, 12px radius, padded content zones
- **Modals:** Full-screen or half-sheet, dark scrim, card background interior

## Motion & Transitions
- Default smooth transition: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`
- Fast interaction: `all 0.15s cubic-bezier(0.4, 0, 0.2, 1)`
- Signature animations: heartbeat (likes), float-up (reactions), ring-rotate (loading), pulse-ring (incoming calls)

## Responsive Breakpoints
- **Mobile:** Default (320px+), tap targets ≥44px
- **Tablet:** `md:` (768px+), 2-column layouts, relaxed spacing
- **Desktop:** `lg:` (1024px+), 3+ column grids, preserved mobile UX as default

## Accessibility & Dark Mode
- Color contrast: AA+ standard (foreground on all backgrounds tested)
- Dark mode only (color-scheme: dark)
- Focus indicators: Primary glow ring on inputs/buttons
- Input font: 16px+ (iOS auto-zoom prevention)

## Signature Details
- **Playfair Display headers:** Premium serif used sparingly (profile names, premium badges)
- **Love gradient:** Pink→purple used only on sent chat bubbles, primary buttons, action highlights
- **Gold accents:** Tip buttons, upgrade rows, premium tier indicators
- **Transparent header:** Floats above video content with gradient fade-to-dark (never obscures video)
- **Chat bubbles:** WhatsApp-style curvature (18px radius with corner cut), gradient sent / dark received
- **iOS settings:** Collapsible sections with subtle chevrons, toggle switches, no form labels above inputs
- **Backend-driven:** All settings, profiles, media persist to backend; no stale UI state

## Constraints
- No neon glows or oversaturated effects
- No full-page background gradients (only targeted zone gradients)
- No animation spam (max 1–2 concurrent animations per screen)
- Settings/chat/video load from backend on mount (no stale cache display)
- Session logout fully clears; no auto-login on reload
- Notification badges auto-clear after action
