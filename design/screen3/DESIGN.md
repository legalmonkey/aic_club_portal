---
name: Sovereign Portal
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444653'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#002e81'
  on-tertiary: '#ffffff'
  tertiary-container: '#0042b2'
  on-tertiary-container: '#a4b9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  metric-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.025em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-desktop: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-desktop: 2.5rem
  margin-tablet: 1.5rem
  margin-mobile: 1rem
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 2.5rem
  space-3xl: 3rem
---

## Brand & Style

The design system projects authority, high-trust precision, and curated prestige tailored for an enterprise club portal. The brand narrative reflects executive clarity: deep institutional navy communicates stability and rigor, while intentional touches of radiant amber and refined gold bring warmth, progression, and an elite membership atmosphere. 

The design aesthetic combines **Corporate / Modern** structure with bespoke, high-end editorial detailing:
- Clean, open spatial breathing room paired with ultra-structured architectural alignments.
- Subtle contrast dynamics: deep, confident slate typography set against pristine white cards and cool slate-gray foundational canvas.
- Purposeful golden accents to symbolize status, active progression, milestone achievements, and VIP actions.
- Restrained visual tactility: micro-interactions are subtle, snappy (150–200ms ease-out curves), avoiding frivolous transitions while maintaining executive polish.

## Colors

The palette balances clinical institutional utility with premium warmth through an intentional distribution model:

### Palette Architecture
- **Primary Base (`#1E40AF`) & Interactive Blue (`#2563EB`):** Anchors the core shell, navigation states, default primary actions, data visualizations, and corporate identity. Used selectively to guide directional workflow.
- **Warm Amber Accent (`#F59E0B`) & Rich Gold (`#D97706`):** Reserved for active badges, milestone progress indicators, VIP status tags, warning metrics, premium membership CTAs, and primary chart accents. Paired with soft amber tint washes (`#FEF3C7`) for contextual status containers.
- **Foundation Neutrals:**
  - Canvas / Shell Background: `#F8FAFC` (cool slate foundation).
  - Secondary Canvas / Sidebar: `#F1F5F9` (grounded separation tone).
  - Elevated Container / Card Surface: `#FFFFFF`.
  - Structural Hairlines & Borders: `#E2E8F0` (ultra-crisp structural boundaries).
  - Text Tokens: Headline & Key Data `#0F172A` (deep dark slate), Secondary Body `#475569`, Muted / Caption `#94A3B8`.
- **System Feedback:** 
  - Success: `#059669` / Surface `#ECFDF5`.
  - Error: `#DC2626` / Surface `#FEF2F2`.

### Application Rules
Maintain an 80-15-5 balance: 80% clean neutrals (`#F8FAFC`, `#FFFFFF`, `#0F172A`), 15% authoritative navy (`#1E40AF`, `#2563EB`), and 5% targeted rich gold/amber (`#F59E0B`, `#D97706`). Gold must never be used purely as a generic background fill for large areas; it acts as a laser-focused spotlight for high-value intelligence, tiers, and progression rings.

## Typography

The design system relies strictly on **Plus Jakarta Sans** across all typographic hierarchies, utilizing its modern geometric balance, open counter spaces, and crisp high-DPI legibility.

### Hierarchy & Style Rules
- **Display & Headings:** Rendered at weights `600` and `700` with subtle negative tracking (`-0.01em` to `-0.025em`) to consolidate visual density and present executive command.
- **Body Text:** Standard body text is maintained at `14px` (`body-md`) with relaxed `22px` line-height to maximize readability in dense, data-rich table views and portal dashboards.
- **Labels, Badges, & Metrics:** Uppercase styling is reserved strictly for `label-sm` when used in micro-status pills, status tags, and table header indicators, styled with `0.04em` positive tracking for clear visual scanability.
- **Tabular Figures:** For dashboard counter values, financial indices, and analytics cards, apply `font-variant-numeric: tabular-nums` to maintain precise vertical alignment.

## Layout & Spacing

The portal layout adheres to a **desktop-first fluid grid architecture** backed by an 8pt base spatial unit (`0.5rem` = 8px).

### Layout Geometry
- **Primary Shell:**
  - Persistent Desktop Left Sidebar: Fixed width `280px` (or `72px` collapsed state), full height (`100vh`), docking cleanly to the screen edge.
  - Global Header Bar: Height `68px`, sticky at the top, housing context switches, notification triggers, and user credential modules.
  - Main Canvas: Fills remaining viewport with maximum content constraint of `1600px` centered on ultrawide monitors.
- **Grid Architecture:** 12-column grid system with dynamic gutters (`gutter-desktop: 24px`, scaling to `16px` on smaller screens).
- **Responsive Adaptations:**
  - **Desktop (≥ 1200px):** Permanent `280px` sidebar, 12-column content grid, generous `2.5rem` page margins.
  - **Tablet / Small Desktop (768px – 1199px):** Sidebar converts to a collapsed `72px` icon-only rail; content wraps to 8 columns.
  - **Mobile (< 768px):** Sidebar transforms into an off-canvas slide drawer triggered via hamburger header; grid collapses to single or 2-column stacks with `1rem` outer canvas margins.

## Elevation & Depth

This system avoids heavy drop shadows and fuzzy photorealistic dimensionality. Instead, depth is achieved via **low-contrast architectural outlines and quiet ambient offsets**.

### Tiers of Depth
- **Level 0 (Floor Canvas):** Flat `#F8FAFC` base page background.
- **Level 1 (Default Containers & Cards):** Flat `#FFFFFF` fill with a crisp `1px solid #E2E8F0` hairline border and a featherweight ambient shadow:
  - `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Interactive Hover / Segment Selectors):** Elevates on mouse hover for interactive cards, dropdown panels, and context menus:
  - `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`.
  - Subtle border accent shift to `#CBD5E1`.
- **Level 3 (Overlays, Flyout Drawers, Modals):**
  - Backdrop dimming: `rgba(15, 23, 42, 0.45)` with `backdrop-filter: blur(4px)`.
  - Container shadow: `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)`.
  - Enclosed in `1px solid #E2E8F0`.

### Gold Elevation Signature
When an element represents an active executive status or active highlight (e.g., active membership tier or focused gold progression card), use an ambient warm glow:
- `box-shadow: 0 4px 14px 0 rgba(245, 158, 11, 0.15)`.

## Shapes

The geometric identity is calibrated to a tailored **10px primary border-radius** (`0.625rem`), providing a sophisticated bridge between utilitarian enterprise rigidity and modern approachable elegance.

### Corner Radius Scale
- **Cards, Modals, Panels, Tables:** Fixed at `10px` (`rounded-lg`).
- **Inputs, Buttons, Dropdown Selectors:** Synchronized at `8px` (`rounded-md`) for snug nested proportion inside cards.
- **Badges, Tags, Pills, Avatars:** `9999px` (Full pill / circular profile) for maximum functional contrast against rectangular content blocks.
- **Micro UI (Checkboxes, Toggles):** `4px` to `6px` radius.

## Components

### Buttons
- **Primary Navy:** Fill `#1E40AF`, text `#FFFFFF`, border `transparent`. Hover: `#1D4ED8`. Active: `#1E3A8A`.
- **VIP / Milestone Gold:** Fill `#F59E0B`, text `#FFFFFF`, font-weight `600`. Hover: `#D97706`. Focus ring: `3px solid rgba(245, 158, 11, 0.35)`.
- **Secondary / Outline:** Background `#FFFFFF`, text `#0F172A`, border `1px solid #E2E8F0`. Hover: `#F8FAFC` and border `#CBD5E1`.
- **Ghost:** Background `transparent`, text `#475569`. Hover: `#F1F5F9`, text `#0F172A`.
- **Geometry:** Height `40px` (standard desktop), internal padding `0.75rem 1.25rem`, border-radius `8px`.

### Badges & Chips
- **Status / Tier Badges:** Pill-shaped (`rounded-full`), height `24px`, padding `0.25rem 0.75rem`, typography `label-sm`.
  - *Active VIP / Amber Tier:* Background `#FEF3C7`, text `#B45309`, border `1px solid #FDE68A`.
  - *Institutional Blue:* Background `#EFF6FF`, text `#1E40AF`, border `1px solid #BFDBFE`.
  - *Neutral Slate:* Background `#F1F5F9`, text `#475569`, border `1px solid #E2E8F0`.

### Cards & Container Panels
- **Standard Card:** Background `#FFFFFF`, border `1px solid #E2E8F0`, border-radius `10px`, padding `1.5rem`.
- **Highlighted / Featured Card:** White background with a subtle top accent rule (`3px solid #F59E0B`) or a left border highlight (`4px solid #1E40AF`).
- **Header Structure:** Clear separation with optional bottom divider (`1px solid #F1F5F9`) and consistent title/action button alignment.

### Metric Indicators & Progress Rings
- **Progress Rings:** SVG circular indicators with track `#E2E8F0` (stroke width `6px`) and active indicator stroke `#F59E0B` or gradient transition into `#D97706`. Metric percentage rendered at center using `headline-sm`.
- **KPI Metric Block:** Vertical layout with `label-md` uppercase caption in `#64748B`, followed by `metric-display` in `#0F172A`, accompanied by a trend pill (e.g., `+14.2%` with `#059669` green or active amber status).

### Input Fields & Controls
- **Text Inputs:** Height `40px`, border-radius `8px`, background `#FFFFFF`, border `1px solid #CBD5E1`, text `#0F172A`, placeholder `#94A3B8`.
- **Input Focus State:** Border color `#2563EB`, box-shadow `0 0 0 3px rgba(37, 99, 235, 0.15)`.
- **Checkboxes & Radios:** Size `18px`, border `1.5px solid #CBD5E1`. Checked state: background `#1E40AF`, white checkmark or center pip. Focus ring in soft navy blur.

### Navigation Sidebar (Persistent Desktop)
- **Container:** Width `280px`, background `#FFFFFF`, right border `1px solid #E2E8F0`.
- **Item State:** Height `44px`, horizontal padding `1rem`, border-radius `8px`.
  - *Default:* Text `#475569`, icon `#64748B`.
  - *Hover:* Background `#F8FAFC`, text `#0F172A`.
  - *Active:* Background `#EFF6FF`, text `#1E40AF`, icon `#1E40AF`, right edge or left edge vertical indicator bar `3px solid #1E40AF`.
  - *Special Club / VIP Section:* Accent micro-dot or badge in `#F59E0B`.