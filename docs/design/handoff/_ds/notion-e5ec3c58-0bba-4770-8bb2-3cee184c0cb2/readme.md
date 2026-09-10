# Daylight Design System

A warm-paper, hairline-quiet product and marketing system: one structural blue, a playful sticker palette that decorates and never structures, and Korean-first type (SUITE for headings, SUIT for everything else).

**"Daylight"** is the working name used throughout this system. The brand described in the source brief is not named in these files and no logo was supplied — wherever a mark would go, the wordmark is rendered in plain SUITE display type (see `NavBar`, `Footer`, `AuthCard`, `thumbnail.html`). Do not draw or reconstruct a logo; ask the brand owner for the real asset.

## Sources given to me

| Source | What it contained |
|---|---|
| Written brand brief (pasted in chat) | The full token spec: colour hexes and their roles, an 11-step type scale with exact sizes/line-heights/tracking, the 8px spacing scale, radius scale, three-level elevation model, a component inventory (nav, buttons, cards, input, hero band, badge, footer, plus ten `ex-*` demonstration surfaces), and do/don't rules. |
| `uploads/SUIT.css` + 9 `SUIT-*.woff2` | SUIT body family, weights 100–900. Copied to `assets/fonts/`. |
| `uploads/SUITE.css` + 7 `SUITE-*.woff2` | SUITE display family, weights 300–900. Copied to `assets/fonts/`. |
| Chat instruction (Korean) | "제목은 SUITE, 나머지 텍스트들은 SUIT" — headings SUITE, all other text SUIT. This overrides the brief's own font recommendation. |

No codebase, Figma file, screenshots, decks, logos or illustrations were provided. Everything visual here is derived from the written token spec plus the two supplied font families. **The brief's own component inventory is the component list** — nothing beyond it was invented except an `Icon` wrapper (see *Intentional additions*).

## Content fundamentals

The voice is **plainly confident and low-adjective**. Short declaratives that state what a thing does, then stop.

- **Person**: second person for the reader ("your team", "you log off"), never "we" as a company narrator in product copy.
- **Casing**: sentence case everywhere — headlines, buttons, eyebrows, table headers in prose. The only ALL-CAPS is the data-table header row and the sidebar section label, both at eyebrow size.
- **Headlines**: 3–6 words, concrete, slightly evocative — "Meet the night shift", "Plans and features", "Start free. Grow into it." No colons, no "Introducing", no exclamation marks.
- **Sub-copy**: one sentence, one clause of qualification. "No credit card, no seat minimum. Bring the whole team when you are ready."
- **Buttons**: verb-first and specific — "Get started free", "Request a demo", "Select plan", "Send invites". Never "Learn more" alone, never "Submit".
- **Eyebrows**: a benefit fragment, not a category — "Essential for staying organized".
- **Numbers**: lining numerals (`lnum` is on), tabular in tables. Prices as "$10" with the cadence in caption grey beside them, never inside the big number.
- **Emoji**: not used. Ever — in UI, in copy, or as icons.
- **Empty states and errors** are matter-of-fact and give the next action: "No pages yet — create your first page to get started."
- **Korean copy** sets naturally in SUIT/SUITE; keep the same brevity. 존댓말 (polite form) for product copy: "본문은 SUIT 400으로 조판합니다."

## Visual foundations

**Canvas & figure/ground.** The page is warm paper `--canvas` `#f6f5f4`; cards and fields are pure white `--surface`. That inversion of the usual "white page, grey cards" is the single most identifying trait — never set a full page on clinical white.

**Colour.** Exactly one structural accent: `--primary` `#0075de`, used for the primary CTA, inline links, the active nav underline, the active sidebar row and focus rings. `--primary-active` `#005bab` is its pressed fill. `--secondary` `#213183` (deep indigo) appears once per site, as the dark hero band. The sticker palette (sky, purple, pink, orange, teal, green, brown) is **decoration only**: illustration bands atop cards, 56px icon tiles, constellation dots, and status *text* in tables. A sticker colour never fills a button, a nav, a section background or a border.

**Type.** SUITE (display) for every heading and number-as-headline; SUIT for body, buttons, captions, table cells, form labels. Headings are weight 700 with explicit negative tracking that grows with size (−2.125px at 64px, −1px at 40px, −0.25px at 22px); body is weight 400 at 1.5 line-height. Weight is the expressive lever — never set body copy above 400, and never use letter-spacing above 0 except the +0.125px eyebrow.

**Spacing & layout.** 8px base; tokens 4/8/12/16/24/28/32 plus 64/96 section steps. Cards pad at 24px, fields at 6px, utility buttons at 4px 14px. Content centres in a 1080px column (1300px wide variant) with 24–40px gutters. Sections are separated by 64–96px of whitespace — **never a horizontal rule**. Grids: 3-up feature cards, 4-up pricing, collapsing to 2-up at tablet and 1-up at ≤600px. The hero is the only full-bleed element; everything else respects the container.

**Backgrounds.** Flat colour only. No gradients, no photographic hero, no repeating pattern, no grain, no noise texture. The one exception to flatness is the sticker glow in the hero: small dots with `box-shadow: 0 0 12px <own colour>`. Illustration is the brand's depth cue, not shadow — colour-blocked bands and icon tiles carry it.

**Borders & elevation.** `--hairline` `#e6e6e6` 1px does most of the work; inputs use a slightly darker `#dddddd`. Elevation is three levels: 0 = hairline, no shadow (the default for cards); 1 = four near-transparent layers ending `rgba(0,0,0,.04) 0 4px 18px`; 2 = five layers ending `rgba(0,0,0,.05) 0 23px 52px`, reserved for modals and popovers. Never a single hard drop shadow.

**Radii.** 4px fields · 5px menu/list rows · 8px utility buttons and pricing columns · 12px cards and tiles · 16px image wells · pill for marketing CTAs and badges. The pill/8px contrast between marketing and utility buttons is intentional and load-bearing; pills never appear on form fields.

**Motion.** Restrained and short: 120ms for presses, 200ms for colour/position changes, easing `cubic-bezier(.2,0,.2,1)`. Marketing pills and circular controls press with `transform: scale(0.9)`. No bounces, no spring, no entrance animations on scroll, no parallax.

**Hover & press.** Hover is deliberately minimal (the source documents no hover states): a 4% black wash on app rows, an underline on text links. Press is where feedback lives — primary darkens to `--primary-active`, pills scale to 0.9, utility buttons take the warm `--surface-soft` fill. Focus is a 2px blue outline at 2px offset; focused inputs also gain the shadow-1 lift.

**Transparency & blur.** Almost none. `rgba(0,0,0,.05)` for translucent circular controls over dark or busy areas, `rgba(0,0,0,.4)` for the modal scrim (no backdrop blur), `rgba(255,255,255,.14)` for the inverse badge on the indigo band, 8% blue for the active sidebar wash. Never frosted glass.

**Imagery.** None supplied. Product screenshots belong in 12–16px-radius wells with a hairline edge, full-bleed inside their container, scaled not cropped. Colour vibe when real imagery arrives: bright, neutral-warm, daylight — no cool teal grade, no grain, no duotone. Placeholders in this system are honest flat colour blocks, never fake screenshots.

**Cards, summarised.** White fill, 12px radius, 1px `#e6e6e6` border, 24px padding, no shadow. Optionally a 64–116px colour band across the top. Raise to shadow-1 only when the card genuinely floats.

## Iconography

**No icon set was supplied** — no icon font, no sprite, no SVGs, no logo. Flagged substitution: the system uses **Lucide** (`lucide-static@0.451.0`, 2px round-join stroke), the closest open set to the light-stroke, geometric style the brief implies. The `Icon` component fetches the SVG from the CDN once per glyph and inlines it, so strokes inherit `currentColor` and can be tinted with any token (and survive image export).

- Sizes: 16px in dense app rows and inside fields, 18–20px in buttons and toasts, 20–24px in feature lists, 26px inside a 56px illustration tile.
- Colour: `currentColor` by default; `--ink-muted` for decorative row icons, `--primary` when the row is active, `--accent-green` for affirmative ticks, `--accent-orange` for warnings.
- **Emoji are never used** as icons or in copy. Unicode is used only for the em-dash placeholder "—" in comparison tables.
- Icons never carry meaning alone in marketing; they sit beside a label.

If the brand has its own glyph set, drop the SVGs into `assets/icons/` and repoint `components/core/Icon.jsx` at them — that is the only file to change.

### Intentional additions
- **`Icon`** — the brief lists no icon primitive, but buttons, rows, tables and empty states all need glyphs. Wrapping the substituted Lucide set in one component keeps the substitution in a single swappable place.

## Index

**Root**
- `styles.css` — the only file consumers link. `@import` list, nothing else.
- `base.css` — element resets, heading/link defaults.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `shape.css`, `elevation.css`.
- `assets/fonts/` — SUIT (9 weights) + SUITE (7 weights), woff2.
- `thumbnail.html` — homepage tile.
- `SKILL.md` — Agent-Skills wrapper.

**Components** (`components/<group>/<Name>.jsx` + `.d.ts` + `.prompt.md`)
- `core/` — **Icon**
- `buttons/` — **Button** (primary · secondary · primary-pressed · utility), **IconButton**
- `forms/` — **TextInput**
- `cards/` — **Card**, **PricingCard**, **SummaryCard**, **LineItemList**, **AuthCard**
- `navigation/` — **NavBar**, **Footer**, **SidebarRow**
- `data/` — **DataTable**
- `feedback/` — **Modal**, **Toast**, **EmptyState**

Mapping to the brief's inventory: `button-primary/-pressed/-secondary/-utility` → `Button`; `button-icon-circular` → `IconButton`; `feature-card` + `feature-card-elevated` → `Card` (`elevation`); `pricing-plan-card` + `-featured` → `PricingCard` (`featured`); `text-input` → `TextInput`; `nav-bar`/`footer` → `NavBar`/`Footer`; `hero-band` → `HeroBand`; `badge-pill` → `BadgePill`; `ex-app-shell-row` → `SidebarRow`; `ex-data-table-cell` → `DataTable`; `ex-auth-form-card` → `AuthCard`; `ex-modal-card` → `Modal`; `ex-toast` → `Toast`; `ex-empty-state-card` → `EmptyState`; `ex-product-selector` → `SummaryCard`; `ex-cart-drawer` → `LineItemList`.

**UI kits**
- `ui_kits/marketing/` — home, product/AI, pricing; nav + footer chrome, sign-up modal. See its README.
- `ui_kits/workspace/` — login, sidebar shell, doc page, home, settings; invite modal + toast. See its README.

**Guidelines** — `guidelines/*.card.html`: 13 specimen cards across Colors, Type, Spacing, Shape and Brand, rendered in the Design System tab.

## Do / Don't

**Do** keep the page on warm paper with white cards · reserve blue for actions, links and active state · set headlines heavy with their negative tracking applied explicitly · use the pill/8px button contrast · define surfaces with hairlines · use the indigo night band exactly once.

**Don't** paint a CTA or structural fill in a sticker colour · introduce a second structural accent · round form fields to pills · use a single hard drop shadow · set body copy above weight 400 · put a full page on clinical white · use emoji.

## Open questions for the brand owner
1. No logo or wordmark asset — the system renders the name in SUITE type as a stand-in.
2. No illustrations, stickers or product screenshots were supplied; colour blocks stand in for all of them.
3. Icon set substituted with Lucide — replace if a house set exists.
4. No dark theme, no semantic error/success ramp is defined in the source; status currently borrows `--accent-green` / `--accent-orange` as *text* colours only.
