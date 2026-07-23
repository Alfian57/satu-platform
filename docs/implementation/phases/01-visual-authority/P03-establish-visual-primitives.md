---
id: P03
title: 'Establish visual primitives'
stage: 01-visual-authority
depends_on: [P02]
gate: automatic
next: P04
---

# P03: Establish visual primitives

## Outcome

Membangun token nyata untuk warna, type, spacing, shape, focus, dan motion.

## Prerequisites

P02 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [UX strategy](../../../ux/UX_STRATEGY.md)
- [Screen inventory](../../../ux/SCREEN_INVENTORY.md)
- [Dashboard surface brief](../../../../.impeccable/surfaces/resources-js-pages-dashboard-tsx.md)
- Runtime context: `resources/js/pages/dashboard.tsx`, `resources/css/app.css`, app shell, navigation, and representative UI components.
- Phase-specific context: approved direction contract.

## Deliverables

Ganti starter-neutral tokens yang relevan; pilih dan integrasikan typefaces;
tetapkan semantic status colors, density scale, focus treatment, serta reduced-motion
behavior.

## Out of Scope

Membuat page content, menambah decorative gradients/glass, atau mengubah semua
component tanpa bukti kebutuhan.

## Verification

Contrast, font loading/fallback, dark-mode decision, focus visibility,
lint, typecheck, dan build.

## Exit Criteria

Primitive tokens dapat dipakai app shell tanpa placeholder values.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P04: Build SATU app shell](P04-build-satu-app-shell.md)
