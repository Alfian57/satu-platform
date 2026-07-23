---
id: P04
title: 'Build SATU app shell'
stage: 01-visual-authority
depends_on: [P03]
gate: automatic
next: P05
---

# P04: Build SATU app shell

## Outcome

Mengganti starter shell dengan navigasi dan layout SATU yang reusable.

## Prerequisites

P03 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [UX strategy](../../../ux/UX_STRATEGY.md)
- [Screen inventory](../../../ux/SCREEN_INVENTORY.md)
- [Dashboard surface brief](../../../../.impeccable/surfaces/resources-js-pages-dashboard-tsx.md)
- Runtime context: `resources/js/pages/dashboard.tsx`, `resources/css/app.css`, app shell, navigation, and representative UI components.
- Phase-specific context: information architecture, dan current layout components.

## Deliverables

Implementasikan desktop/mobile navigation, page context, user controls,
institution/membership status, content rail behavior, dan accessible active states.

## Out of Scope

Mengisi dashboard modules atau membuat role-specific identity baru.

## Verification

Keyboard navigation, small-laptop/mobile layout, Wayfinder links, typecheck,
build, dan relevant component tests.

## Exit Criteria

Semua current authenticated pages dapat dirender di shell baru tanpa regression.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P05: Build reference dashboard](P05-build-reference-dashboard.md)
