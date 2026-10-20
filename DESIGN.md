---
name: CleanKg prototype
description: A waste report paraded like a flagship device on a cool mineral ground, with one vermilion field, pill controls and 28px panels.
colors:
  paper: "#eef0ed"
  paper-high: "#f7f8f6"
  surface: "#ffffff"
  surface-sunken: "#e4e7e3"
  ink: "#121513"
  ink-soft: "#2a2f2b"
  ink-muted: "#525852"
  ink-inverse: "#f6f7f5"
  ink-inverse-muted: "#b7bdb6"
  line: "#d3d8d2"
  line-strong: "#868c86"
  line-inverse: "#3a403b"
  accent: "#e5402b"
  accent-deep: "#a8291a"
  accent-tint: "#fde7e2"
  accent-ink: "#2b0904"
  info: "#1b57a0"
  warning: "#855600"
  success: "#1a6a3b"
  focus: "#121513"
  selection: "#fbc9bf"
  status-submitted: "#56687a"
  status-submitted-tint: "#eaeff3"
  status-under-review: "#1b57a0"
  status-under-review-tint: "#e5edf7"
  status-in-progress: "#855600"
  status-in-progress-tint: "#fbefd6"
  status-resolved: "#1a6a3b"
  status-resolved-tint: "#e1f0e6"
  status-confirmed: "#0d5a4c"
  status-confirmed-tint: "#dcefe9"
  status-disputed: "#a8291a"
  status-disputed-tint: "#fde7e2"
  status-rejected: "#61665f"
  status-rejected-tint: "#ebece9"
typography:
  hero:
    fontFamily: "Onest, system-ui, Noto Sans, DejaVu Sans, sans-serif"
    fontSize: "clamp(54px, 5.6vw, 104px)"
    fontWeight: 600
    lineHeight: 0.94
    letterSpacing: "-0.045em"
  section:
    fontFamily: "Onest, system-ui, Noto Sans, DejaVu Sans, sans-serif"
    fontSize: "clamp(36px, 5.6vw, 88px)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.04em"
  statement:
    fontFamily: "Onest, system-ui, Noto Sans, DejaVu Sans, sans-serif"
    fontSize: "clamp(28px, 3.9vw, 60px)"
    fontWeight: 500
    lineHeight: 1.14
    letterSpacing: "-0.03em"
  lead:
    fontFamily: "Onest, system-ui, Noto Sans, DejaVu Sans, sans-serif"
    fontSize: "clamp(18px, 1.5vw, 22px)"
    fontWeight: 400
    lineHeight: 1.45
  fact:
    fontFamily: "Onest, system-ui, Noto Sans, DejaVu Sans, sans-serif"
    fontSize: "clamp(52px, 6vw, 100px)"
    fontWeight: 600
    lineHeight: 0.95
    letterSpacing: "-0.05em"
    fontFeature: "tnum"
  display:
    fontFamily: "Onest, system-ui, Noto Sans, DejaVu Sans, sans-serif"
    fontSize: "clamp(32px, 4vw, 48px)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  h1:
    fontFamily: "Onest, system-ui, Noto Sans, DejaVu Sans, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: "36px"
    letterSpacing: "-0.025em"
  h2:
    fontFamily: "Onest, system-ui, Noto Sans, DejaVu Sans, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.015em"
  h3:
    fontFamily: "Onest, system-ui, Noto Sans, DejaVu Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "24px"
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Onest, system-ui, Noto Sans, DejaVu Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "0"
    fontFeature: "ss01"
  body-small:
    fontFamily: "Onest, system-ui, Noto Sans, DejaVu Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  caption:
    fontFamily: "Onest, system-ui, Noto Sans, DejaVu Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "18px"
  label:
    fontFamily: "Onest, system-ui, Noto Sans, DejaVu Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
    letterSpacing: "0.04em"
  mono-data:
    fontFamily: "JetBrains Mono, Onest, ui-monospace, DejaVu Sans Mono, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "18px"
    fontFeature: "tnum"
  mono-figure:
    fontFamily: "JetBrains Mono, Onest, ui-monospace, DejaVu Sans Mono, monospace"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: "28px"
    fontFeature: "tnum"
rounded:
  none: "0"
  small: "14px"
  medium: "20px"
  large: "28px"
  device: "36px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
  "8": "64px"
  "9": "96px"
  "10": "144px"
  section: "clamp(96px, 14vw, 200px)"
  gutter-narrow: "16px"
  gutter-wide: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.ink-soft}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
    height: "48px"
  button-secondary-hover:
    backgroundColor: "{colors.paper-high}"
  button-disabled:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.pill}"
  button-arrow-island:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink-inverse}"
    rounded: "{rounded.pill}"
    size: "40px"
  button-arrow-island-on-secondary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-inverse}"
    rounded: "{rounded.pill}"
    size: "40px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 12px 4px 8px"
  chip-status-under-review:
    backgroundColor: "{colors.status-under-review-tint}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 12px 4px 8px"
  demo-chip:
    backgroundColor: "{colors.paper-high}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 7px"
    height: "18px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.small}"
    padding: "8px 16px"
    height: "48px"
  nav-island:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "4px 8px 4px 16px"
    height: "60px"
  nav-link:
    textColor: "{colors.ink-muted}"
    typography: "{typography.body-small}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "48px"
  nav-link-current:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-inverse}"
    rounded: "{rounded.pill}"
  prototype-banner:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.label}"
    height: "36px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.large}"
    padding: "24px"
  photo-in-panel:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.medium}"
  account-rail:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-inverse}"
    typography: "{typography.mono-data}"
    rounded: "{rounded.large}"
    padding: "24px"
  device-frame:
    backgroundColor: "{colors.ink}"
    rounded: "{rounded.device}"
    padding: "8px"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.large}"
    padding: "32px"
    width: "34rem"
---

# Design System: CleanKg prototype

## Overview

**Creative North Star: "The Report on Parade"**

One civic object, the waste report, is presented the way a flagship device page presents a watch: large, ringed, lit and proved. The ground is a cool mineral wash (paper, near-white to pale grey), text is true ink, and a single committed vermilion owns whole regions rather than sprinkling accents: the giant map-pin field in the hero, the SDG field, the arrow islands inside buttons, the second line of the hero headline. Everything a person touches is a pill; everything that holds content is a soft 28px panel; the real app is framed in dark ink "device" panels.

The system has two densities sharing one token block. The landing (Persuade) runs a big Onest scale with tight negative tracking and section spacing of up to 200px. The app (Operate) runs a compact fixed scale (30/22/18/16/14/13/12) over white panels on paper, with JetBrains Mono as the data voice for ids, dates, coordinates, counts, the «Прототип» banner and the account rail.

Honesty is visual, not only verbal. A sticky ink «Прототип» strip sits above every screen and cannot be dismissed; every demo value carries an outlined «демо» chip after it; placeholder photos are hatched tiles labelled, never stock people; status is always label, icon and colour together. Motion is an addition: the static page is complete, natural-height and still, and the scroll choreography exists only where scroll timelines are supported and motion is wanted.

**Key Characteristics:**
- Cool mineral paper, true ink, one vermilion field that owns regions.
- Onest only for text; JetBrains Mono for data.
- Pills for controls and chips, 14 for inputs, 28 for panels, 20 for photos inside panels.
- Floating white island nav over the page, ink pill buttons with a nested circular arrow island.
- Soft ink-tinted shadows with negative spread; no hard offsets, no borders on panels.
- One breakpoint (48em).
- Static default complete; scroll-driven runways only under `@supports (animation-timeline: view())` and `prefers-reduced-motion: no-preference`.

## Colors

A cool, nearly colourless mineral world in which one vermilion and seven status pairs are the only saturated colour.

### Primary
- **Signal Vermilion** (accent): the field. Fills the hero pin, the SDG section field, the arrow island in primary buttons, map "new point" pins, the banner dot, the brand mark, the ring line, and underlines of text links. Also the second line of the hero headline at display size only.
- **Fired Vermilion** (accent-deep): vermilion as text and as a darker surface: error text, invalid input border, link hover, the "accent" category tile, "not offered to volunteers" icons.
- **Vermilion Wash** (accent-tint) and **Selection Blush** (selection): text selection and disputed tint; never a fill for large areas.
- **Pin Ink** (accent-ink): text set on the vermilion field (the curved arc phrase) and selected text.

### Neutral
- **Mineral Paper** (paper): page ground on every screen.
- **Paper High** (paper-high): table header, row hover, secondary-button hover, the hero radial lift, the «демо» chip fill.
- **White Surface** (surface): panels, cards, inputs, islands (at 84% with blur), dialog, popups.
- **Sunken Stone** (surface-sunken): disabled controls, photo tile base, skeleton, nav-link hover, ring track, map ground.
- **True Ink** (ink): body text, primary buttons, current nav pill, banner, account rail, device frames, closing section.
- **Soft Ink** (ink-soft): primary hover, the honest list inside the closing section, inner tab strip of the device, ky banner line.
- **Muted Ink** (ink-muted): secondary text, placeholders, help text, nav links at rest, table labels.
- **Inverse Ink** and **Inverse Muted** (ink-inverse, ink-inverse-muted): text on ink surfaces.
- **Hairline**, **Control Line**, **Inverse Line** (line, line-strong, line-inverse): section dividers and table rows; input and photo-tile frames; dividers on ink.

### Status pairs
Seven pairs, each a deep colour plus a pale tint (submitted slate, under review blue, in progress ochre, resolved green, confirmed teal, disputed vermilion-deep, rejected grey). The tint fills the chip or marker; the deep colour is the 1px inset ring and the icon. Text on a status chip stays ink. `info`, `warning` and `success` reuse the under-review, in-progress and resolved values for non-status messages (attribution links, demo notes, success toast).

### Named Rules
**The One Field Rule.** Vermilion is a field or a point, never a wash of small decorations. It fills a whole region (pin, SDG section, arrow island) or marks one thing (dot, pin, underline). It is never body text on paper.

**The Never Colour Alone Rule.** A status always ships as label + fixed icon + colour pair. The map marker, chip, ring chip and timeline all use the same `data-status` hook; no surface may show a status by colour only.

**The Receding Map Rule.** Map tiles are filtered towards the mineral palette (`grayscale(0.85) contrast(0.92) brightness(1.05)`) so the status markers carry the colour.

## Typography

**Display Font:** Onest (with system-ui, Noto Sans, DejaVu Sans)
**Body Font:** Onest
**Label/Mono Font:** JetBrains Mono (with Onest per glyph for Kyrgyz Ңң, ui-monospace)

**Character:** One grotesque carries everything from a 104px hero to a 12px label; size, weight 500 to 600 and tight negative tracking do the work a second face would. Mono is the data voice and reads as "this is a record".

### Hierarchy
- **Hero** (600, clamp 54 to 104px, 0.94, -0.045em): the two-line landing headline only; line two in vermilion.
- **Section** (600, clamp 36 to 88px, 1, -0.04em): landing section titles and the closing title.
- **Statement** (500, clamp 28 to 60px, 1.14, -0.03em): the mechanism sentence with inline objects and the SDG quote.
- **Fact** (600, clamp 52 to 100px, 0.95, -0.05em, tabular): sourced figures in the facts section.
- **Lead** (400, clamp 18 to 22px, 1.45): sublines under landing titles, max 52ch.
- **Display** (600, clamp 32 to 48px, 1.05): app page titles.
- **H1 / H2 / H3** (600; 30/36, 22/28, 18/24): app headings, card category, state titles.
- **Body** (400, 16/24, `ss01` on): everything else; prose capped at 66ch.
- **Body small / Caption** (400; 14/20, 13/18): help text, nav links, definition-list terms, captions.
- **Label** (600, 12/16, 0.04em, uppercase): form labels, chip text, table headers, «демо» chip, compare tags.
- **Mono data / Mono figure** (400 13/18; 500 24/28; tabular): ids, dates, coordinates, counts, cluster numbers, banner, account rail.

### Named Rules
**The Two Scales Rule.** Landing tokens (hero, section, statement, fact, lead) never appear in the app; app tokens (display, h1 to h3) never set a landing headline. Both share body, label and mono.

**The Mono Is Data Rule.** JetBrains Mono sets records: numbers, ids, dates, coordinates and the system strips (banner, account rail). Headings and prose are never mono.

## Layout

One token block, one breakpoint: `48em`. Below it the layout is a single column with a 16px gutter; at and above it the gutter becomes 32px and the table, hero, ring, proof, facts and closing grids open up. Every width change is a token swap inside the single `@media (min-width: 48em)` block in `tokens.css` (the landing shell uses its mirror `max-width: 47.99em`). Containers: 1240px for app content, 1440px for landing and the header, 46rem for narrow forms, 66ch prose measure.

Spacing is a ten-step scale (4, 8, 12, 16, 24, 32, 48, 64, 96, 144). App pages stack sections at 24px with a hairline top rule; forms at 32px. Landing sections breathe at `clamp(96px, 14vw, 200px)`. Grids use `auto-fit` with `minmax(min(100%, 20rem), 1fr)` (9rem for tight cells) so columns collapse without extra breakpoints. Operator screens put the main column (min 62rem) beside a 17rem rail and wrap the rail above when space runs out. Queue tables become labelled stacked blocks below 48em by swapping `display` tokens.

The header is two detached islands sticky under the banner; the landing pulls its hero up under them. Touch targets are 48px minimum (56px thumb).

**The One Breakpoint Rule.** There is exactly one breakpoint, 48em. New layouts adapt with `auto-fit`, `clamp()` and flex-wrap, or with a token override inside the existing block; never a new media width.

## Elevation & Depth

Depth is soft, ink-tinted and lifted: shadows use the ink colour at low alpha with a large blur and a negative spread, so a panel floats without an outline. Panels carry no border; tonal steps (paper, paper-high, surface, sunken) and these shadows do the separation. The islands add a frosted fill (white at 84%, `saturate(160%) blur(18px)`) with an inner top highlight. The dialog backdrop is ink at 46% with a 4px blur.

### Shadow Vocabulary
- **Raised** (`0 1px 2px rgba(18,21,19,0.05), 0 10px 28px -14px rgba(18,21,19,0.16)`): app panels, tables, filters, counts, comments, markers, submit bar.
- **Island** (`inset 0 1px 0 rgba(255,255,255,0.9), 0 14px 40px -16px rgba(18,21,19,0.24)`): header islands and map zoom pill.
- **Card** (`0 2px 4px rgba(18,21,19,0.06), 0 30px 60px -24px rgba(18,21,19,0.35)`): the map, the account rail, landing parade cards, device frame, compare frame.
- **Overlay** (`0 28px 72px -18px rgba(18,21,19,0.34)`): dialog, map popup, map overlay messages.

### Named Rules
**The Soft Lift Rule.** Shadows are always blurred with negative spread and ink-tinted. No hard offset shadows, no coloured glows.

## Shapes

**The Shape Rule.** One system: every control and chip is a pill (999px): buttons, nav links, selects in the locale island, chips, «демо» chips, tabs, round arrows, markers, compare tags. Inputs, selects and textareas are 14px. Cards, panels, map, table, rail, toast, popup and dialog are 28px. Photos and photo tiles inside panels are 20px. The landing's large ink and vermilion fields (device frame, SDG section, closing section) are 36px, with the device screen inset at 28px (36 minus the 8px frame). Full-bleed skeletons inside a map are square.

Recurring silhouettes: the map pin (hero field, brand mark, new-point marker), the circle (arrow island, markers, the lifecycle ring), and the diagonal 45-degree hatch on photo placeholders.

## Components

### Buttons
Ink pills with a nested vermilion arrow.
- **Shape:** pill (999px), 48px min height, 8px 24px padding, 1px ink border, weight 500 body size.
- **Primary:** ink fill, inverse text; hover softens to ink-soft. Press scales to 0.97.
- **Secondary:** white fill, hairline border, ink text; hover gets the strong line and paper-high fill.
- **Arrow island:** an optional trailing 40px circle inside the pill (button-in-button) with an up-right arrow; vermilion on primary, ink on secondary. On hover it nudges `translate(2px,-1px) scale(1.06)`. The end padding drops to 4px so the circle sits inside the pill's curve.
- **Disabled:** sunken fill, muted text, not-allowed cursor.
- **Text link:** ink text, 2px vermilion underline, hover turns accent-deep.

### Chips
- **Status chip:** status tint fill, 1px inset ring in the status colour, status icon (Phosphor Light) in the status colour, uppercase ink label. Never without the label.
- **Neutral chip:** white, hairline border, uppercase label; categories.
- **«демо» chip:** 18px outlined pill, 1px ink border on paper-high, uppercase label; placed after the value, never instead of it.

### Cards / Containers
- **Corner Style:** 28px.
- **Background:** white on paper; ink for the account rail and device frames.
- **Shadow Strategy:** Raised for app panels; Card for the map, rail and landing objects.
- **Border:** none; tables use hairlines between rows only.
- **Internal Padding:** 16 to 24px (dialog body 32px).

### Inputs / Fields
- **Style:** white, 1px strong line, 14px radius, 48px min height, 8px 16px padding; label above in the uppercase label style.
- **Selects:** native appearance removed, an ink chevron drawn as a background image at 16px; in the locale island the select becomes a borderless sunken pill.
- **Focus:** ink border plus a 4px sunken halo, and the global 2px ink outline at offset.
- **Error:** accent-deep border and accent-deep help text. Mono variant for coordinates.

### Navigation
- **Prototype banner:** 36px sticky ink strip at the very top, mono label type, a vermilion dot, an extra segment «Аккаунт · демо» on operator screens, a ky demo line under it in Kyrgyz.
- **Island header:** two floating frosted pills sticky 12px under the banner: brand plus links in one (it shrinks and scrolls horizontally), language plus, on wide landing only, the primary arrow pill in the other.
- **Links:** 48px pills in muted ink; hover sunken; current page is a solid ink pill.

### Map
28px clipped panel with the Card shadow, filtered tiles, a pill zoom control with the Island shadow, and status markers as 34px tinted discs with a 2px white ring and an outer status ring inside a 48px hit area; clusters are ink discs with a mono count and a «демо» chip below.

### Queue table and account rail
A 28px white table with paper-high uppercase headers and hairline rows that stacks into labelled blocks below 48em. The account rail is an ink 28px band of mono facts (uppercase inverse-muted terms) above the queue.

### Landing signatures
- **Pin field:** a giant vermilion map-pin shape that owns the lower right of the hero, with the four verbs set once on a 120-degree arc in pin ink.
- **Parade cards:** five white 28px cards (photo or hatched demo tile at 20px, category, status chip, «демо»), one per lifecycle status in order, hanging on the pin's rim on wide screens and an upright snap row on phones.
- **Lifecycle ring:** a 3px vermilion circle over a sunken track with five status chips on it and a big centre figure.
- **Inline objects in type:** pill-shaped photo, pin, status chip and check objects set inside the statement sentence.
- **Device panel:** an ink frame (36px, 8px padding) with a pill tab strip, holding real prototype screenshots.

### Motion
Exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`) at 160 / 320 / 720ms for state changes only, from an already-visible default. Scroll choreography (the wheel turning, the ring drawing, words and objects rising) and the pinned runways themselves exist only inside `@supports (animation-timeline: view())` plus `prefers-reduced-motion: no-preference`; the wheel runway also needs 48em. Reduced motion sets every duration to 0 and the press scale to 1.

## Do's and Don'ts

### Do:
- **Do** take every value from `tokens.css`; add a token there before using a new value.
- **Do** keep the shape rule: pills for controls and chips, 14px inputs, 28px panels, 20px photos inside panels, 36px only for landing-scale ink or vermilion fields.
- **Do** show status as label + fixed Phosphor icon + colour pair through the `data-status` hook.
- **Do** put the «демо» chip after every demo value and keep the «Прототип» banner on every screen.
- **Do** use hatched, labelled photo tiles where no real, provenance-tracked photo exists.
- **Do** use JetBrains Mono for ids, dates, coordinates, counts and the system strips.
- **Do** make every layout complete and still by default; add scroll motion only inside the `@supports` plus `no-preference` guard.
- **Do** keep touch targets at 48px or more and the 2px ink focus outline (inverse on ink surfaces).

### Don't:
- **Don't** add a second breakpoint; adapt with `auto-fit`, `clamp()` or a token override in the 48em block.
- **Don't** use vermilion for body text on paper or for decorative sprinkles; it is a field or a single point.
- **Don't** show a status by colour alone, or set a status chip's label in the status colour.
- **Don't** add borders around panels or hard offset shadows; depth is the soft ink-tinted lift.
- **Don't** introduce a second text family or set headings in mono.
- **Don't** create pinned or scroll-length runways outside the motion guard; the static page has no dead space.
- **Don't** show partner logos or "connected" states; an unconnected organisation reads «не подключена».
