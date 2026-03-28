---
name: liquid-glass-ui
description: >
  Design system for Clínica Colinas. ALL UI work in this project MUST follow
  the Liquid Glass aesthetic (iOS 26 / Apple visionOS-inspired). This skill
  must be applied to every new component, page, panel, form, modal, sidebar,
  card, table, and button — no exceptions. Never use flat, opaque, or
  border-heavy designs. Read this file fully before writing any JSX/TSX.
---

# Liquid Glass Design System — Clínica Colinas

> **MANDATORY**: Every component, form, modal, card, sidebar, table and button
> in this project must use the tokens and patterns defined below. No opaque
> white, no flat greys, no heavy borders. When in doubt, refer to the
> "Quick Reference" table at the bottom.

---

## 1. Core Philosophy

Liquid Glass simulates frosted glass surfaces that are:
- **Semi-transparent** (you can faintly see what's behind).
- **Blurred** (content behind is beautifully defocused).
- **Luminous** (borders are white/light, not dark).
- **Layered** (panels stack with increasing blur and opacity).
- **Soft-shadowed** (shadows are diffused, colored, never harsh black).

---

## 2. Color Tokens

```
Background overlay:   bg-slate-900/30   (page-level modal scrim)
Panel (deep):         bg-white/70  backdrop-blur-2xl  backdrop-saturate-[1.2]
Panel (shallow):      bg-white/40  backdrop-blur-md
Card / Section:       bg-white/40  backdrop-blur-md
Input / Field:        bg-white/50  border-white/60
Input focus:          bg-white/80  ring-2 ring-[accent]/50
Header strip:         bg-white/30  backdrop-blur-md
Footer strip:         bg-white/30  backdrop-blur-md
Dividers:             border-white/40
```

### Accent Colors (selected / active / primary)
| Semantic     | Classes                                                          |
|-------------|------------------------------------------------------------------|
| Primary CTA  | `bg-red-500/95  border-red-400/50  shadow-[0_8px_20px_rgba(239,68,68,0.3)]` |
| Selected btn | `border-lime-500/80  bg-lime-50/80  text-lime-700  shadow-[0_4px_12px_rgba(132,204,22,0.2)]  ring-2 ring-lime-400/20` |
| Urgency: Critical | `border-red-600  text-red-700  shadow-md shadow-red-200  ring-2 ring-red-100` |
| Urgency: Urgent   | `border-orange-600  text-orange-700  shadow-md shadow-orange-200  ring-2 ring-orange-100` |
| Urgency: Medium   | `border-yellow-500  text-yellow-700  shadow-md shadow-yellow-200  ring-2 ring-yellow-100` |
| Urgency: Low      | `border-green-600  text-green-700  shadow-md shadow-green-200  ring-2 ring-green-100` |
| Success badge | `bg-green-50/50  border-green-400/30` |
| Info badge    | `bg-blue-100/70  border-blue-200/60  text-blue-800` |

---

## 3. Border Radius Scale

Everything should feel organic and pill-like. No sharp corners.

| Element          | Radius              |
|-----------------|---------------------|
| Modal / Panel    | `rounded-[2.5rem]` (top only on mobile: `rounded-t-[2.5rem]`) |
| Section card     | `rounded-3xl`       |
| Input / Textarea | `rounded-2xl`       |
| Button (choice)  | `rounded-2xl`       |
| Button (CTA)     | `rounded-2xl`       |
| Avatar / Icon bg | `rounded-full`      |
| Badge / Pill     | `rounded-full`      |
| Dropdown list    | `rounded-2xl`       |

---

## 4. Shadows

Use colored, diffused shadows — not pure black box-shadows.

```
Panel:          shadow-[0_8px_32px_0_rgba(0,0,0,0.12)]
Section card:   shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]
CTA button:     shadow-[0_8px_20px_rgba(239,68,68,0.3)]
Selected btn:   shadow-[0_4px_12px_rgba(132,204,22,0.2)]
Colored shadow: shadow-md  shadow-[color]-200
```

---

## 5. Typography Conventions

| Role             | Classes                                              |
|-----------------|------------------------------------------------------|
| Modal title      | `font-bold  text-gray-900  text-lg  tracking-tight`  |
| Section title    | `font-bold  text-gray-800  text-base`                |
| Label / Caption  | `text-xs  font-bold  text-gray-500/80  uppercase  tracking-wider` |
| Input text       | `text-sm  font-medium`                               |
| Placeholder      | `placeholder:text-gray-400`                          |
| Step number      | `w-7 h-7  rounded-full  bg-gray-900/90  text-white  text-xs  font-black  shadow-md` |

---

## 6. Component Patterns

### 6.1 Modal / Overlay
```tsx
// Backdrop scrim
<div className="fixed inset-0 bg-slate-900/30 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md transition-all">
  {/* Glass panel */}
  <div className="bg-white/70 backdrop-blur-2xl backdrop-saturate-[1.2] w-full sm:max-w-2xl
                  rounded-t-[2.5rem] sm:rounded-[2.5rem]
                  shadow-[0_8px_32px_0_rgba(0,0,0,0.12)]
                  border border-white/60 max-h-[90vh] flex flex-col overflow-hidden">
    {/* Header */}
    <div className="p-6 border-b border-white/40 flex justify-between items-center shrink-0 bg-white/30">
      ...
    </div>
    {/* Scrollable body */}
    <div className="overflow-y-auto flex-1 p-6 space-y-6">
      ...
    </div>
    {/* Footer */}
    <div className="p-6 border-t border-white/40 flex gap-3 shrink-0 bg-white/30 backdrop-blur-md">
      ...
    </div>
  </div>
</div>
```

### 6.2 Section / Card (inside modal or page)
```tsx
<section className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-5 shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
  ...
</section>
```

### 6.3 Input / Textarea
```tsx
<input className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60
                  focus:bg-white/80 focus:ring-2 focus:ring-[accent]/50 outline-none
                  text-sm font-medium shadow-inner transition-all placeholder:text-gray-400" />
```

### 6.4 Choice Button (unselected / selected)
```tsx
// Unselected
"border-white/60 bg-white/40 text-gray-500 opacity-80 hover:opacity-100 hover:bg-white/60 shadow-sm"

// Selected (lime = default for non-urgency)
"border-lime-500/80 bg-lime-50 text-lime-700 shadow-[0_4px_12px_rgba(132,204,22,0.2)] ring-2 ring-lime-400/20 scale-[1.02]"
```

### 6.5 CTA / Primary Button
```tsx
<button className="flex-1 py-3.5 rounded-2xl bg-red-500/95 hover:bg-red-500 text-white font-bold
                   shadow-[0_8px_20px_rgba(239,68,68,0.3)] backdrop-blur-md border border-red-400/50
                   outline-none focus:ring-2 focus:ring-red-300 transition-colors">
```

### 6.6 Cancel / Secondary Button
```tsx
<button className="flex-1 py-3.5 rounded-2xl bg-white/50 border border-white/60 text-gray-700 font-bold
                   hover:bg-white/80 transition-colors text-sm shadow-sm backdrop-blur-sm
                   outline-none focus:ring-2 focus:ring-gray-300">
```

### 6.7 Page / Dashboard Background
```
bg-gradient-to-br from-slate-100 via-green-50/30 to-lime-50/30
```
Give the main page a light gradient background so that the glass panels
look spectacular against it. Without a gradient behind, the glass effect
is invisible.

### 6.8 Sidebar (navigation panel)
```tsx
<aside className="bg-white/60 backdrop-blur-xl border-r border-white/50 shadow-[2px_0_16px_0_rgba(0,0,0,0.06)]">
```

### 6.9 Table / List Row
```tsx
// Container
<div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl overflow-hidden shadow-[0_4px_16px_0_rgba(0,0,0,0.02)]">
// Header row
<div className="bg-white/30 border-b border-white/40 text-xs font-bold text-gray-500/80 uppercase tracking-wider">
// Data row
<div className="hover:bg-white/60 transition-colors border-b border-white/30">
```

### 6.10 Badge / Pill
```tsx
<span className="inline-flex items-center gap-1 text-xs font-bold
                 bg-[color]/20 text-[color]-800 border border-[color]-200/50
                 rounded-full px-2.5 py-1 shadow-sm">
```

---

## 7. Quick Reference

| Context                 | DO ✅                                | DON'T ❌                        |
|------------------------|--------------------------------------|--------------------------------|
| Form background         | `bg-white/70 backdrop-blur-2xl`      | `bg-white`                     |
| Card / section          | `bg-white/40 backdrop-blur-md`       | `bg-gray-50` / `bg-white`     |
| Input field             | `bg-white/50 border-white/60`        | `border-gray-300 bg-white`    |
| Borders                 | `border-white/50` or `border-white/40` | `border-gray-200`             |
| Dividers                | `border-white/40`                    | `border-gray-100`             |
| Radius (modals)         | `rounded-[2.5rem]`                   | `rounded-xl` or `rounded-2xl` |
| Radius (cards)          | `rounded-3xl`                        | `rounded-xl`                  |
| Shadows                 | colored diffuse shadow               | `shadow-sm`, `shadow-md` alone |
| Button active           | lime/accent border + scale-[1.02]    | Filled solid color only        |
| Section numbers         | `bg-gray-900/90` w/ `shadow-md`      | `bg-gray-900`                  |

---

## 8. Page Background Rule (MANDATORY)

Every page that contains glass panels MUST have a gradient background to
make the frosting effect visible. Add this to the top-level page container:

```tsx
<main className="min-h-screen bg-gradient-to-br from-slate-100 via-green-50/30 to-lime-50/30">
```

Without this, the glass panels will render as almost-flat white panels.

---

## 9. Migration Checklist

When migrating an existing component to Liquid Glass:
- [ ] Replace `bg-white` panel → `bg-white/70 backdrop-blur-2xl`
- [ ] Replace `bg-gray-50` / `bg-white` sections → `bg-white/40 backdrop-blur-md`
- [ ] Replace `border-gray-200` borders → `border-white/50`
- [ ] Replace `border-gray-100` dividers → `border-white/40`
- [ ] Replace `rounded-xl` / `rounded-2xl` on modals → `rounded-[2.5rem]`
- [ ] Replace `rounded-xl` on cards → `rounded-3xl`
- [ ] Replace `border border-gray-300` on inputs → `bg-white/50 border border-white/60`
- [ ] Add `backdrop-blur-md` to sidebars
- [ ] Update page `<main>` with gradient background
- [ ] Update table containers to glass card pattern
