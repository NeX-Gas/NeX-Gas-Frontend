# NEX-GAS — Design Contract

## Thesis

A **field instrument panel**, not a SaaS dashboard. The operator reads this in a
barn office and on a phone in daylight, next to real pressure gauges. The
language is a technical manual: hairline rules, tabular numerals, status stated
in words, and one accent reserved for "healthy".

Palette is unchanged. What changes is *how* it is spent: almost no filled
surfaces, no decorative shadows, no pill-shaped status backgrounds.

## Typography

| Role | Family | Size | Weight | Notes |
|---|---|---|---|---|
| Body / UI | IBM Plex Sans | 13–14 | 400/500 | `--font-plex` |
| Section label | IBM Plex Sans | 11 | 500 | uppercase, tracking `.09em`, muted |
| Panel title | IBM Plex Sans | 15 | 600 | tracking `-0.01em` |
| Page title | IBM Plex Sans | 20 | 600 | tracking `-0.015em` |
| Data readout | IBM Plex Mono | 13–40 | 500/600 | tabular by nature |
| Micro data | IBM Plex Mono | 11–12 | 500 | thresholds, units, ids |

Rationale: every important number in this product is a measurement (kPa, ppm,
°C, L). Mono is not decoration here, it stops columns of numbers from jittering
as they update.

## Color roles

Values are the existing palette. Usage rules are new.

| Token | Value | Allowed use |
|---|---|---|
| `canvas` | `#f9f9ff` | page background only |
| `surface` | `#ffffff` | panels, inputs |
| `ink` | `#141b2b` | primary text, data values |
| `ink-2` | `#3c4a42` | secondary text |
| `muted` | `#555f6d` | labels, metadata |
| `brand` | `#006c49` | healthy state, primary action, active nav |
| `brand-400` | `#10b981` | meters, live dot |
| `info-50/100` | `#f1f3ff` / `#e9edff` | **inset data blocks only** |
| `info-200/300` | `#e1e8fd` / `#dce2f7` | meter tracks, control tracks |
| `danger*` | red scale | **real alarms only** |
| `line` | `#bbcabf` | panel borders |
| `line-soft` | `#dfe5e1` | internal dividers (tint of `line`) |

Rule: a red surface means something is actually wrong. Warning-level values get
red *text*, not a red block, so the page does not look alarmed when it isn't.

## Shape

- Panel radius: **6px**
- Field / control radius: **4px**
- Modal radius: **10px**
- Chips: **3px** — never `rounded-full`
- Pills: **not used** for status. Status = 6px square dot + text.

## Depth

- Panels are flat, `1px` `line/50` border, **no shadow**.
- Shadow exists only on the modal and toasts.
- Hierarchy comes from surface tier (canvas → surface → info-50 inset), not from elevation.

## Grid

- Sidebar: 240px fixed.
- Content: `max-width: 1152px`, 32px page padding, 16px gutters.
- 12-column grid desktop; single column below `lg`; two columns for data cells on mobile.

## Signature elements

1. **Pressure columns** — vertical instrument bars for digester and collector
   with ticks at the real firmware thresholds (0.3 / 1.0 / 2.0 kPa).
2. **Readout block** — mono value + small-caps unit on a shared baseline.
3. **Rule label** — uppercase micro label with a hairline running to the panel edge.

## Anti-patterns (blocked)

- Card shadow on every surface
- `rounded-xl` on everything
- Status pills with coloured backgrounds
- Icon tile in the corner of every card
- Donut gauge showing a percentage that is not the measurement
- Five equal cards in a row
- Decorative colour on icons
- Dead vertical space inside a panel
- Hardcoded "Unit #01 Online" contradicting demo mode
