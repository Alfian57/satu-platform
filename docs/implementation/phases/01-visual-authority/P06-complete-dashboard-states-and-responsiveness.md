---
id: P06
title: 'Complete dashboard states and responsiveness'
stage: 01-visual-authority
depends_on: [P05]
gate: automatic
next: P07
---

# P06: Complete dashboard states and responsiveness

## Outcome

Membuat reference dashboard tahan terhadap content dan device nyata.

## Prerequisites

P05 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [UX strategy](../../../ux/UX_STRATEGY.md)
- [Screen inventory](../../../ux/SCREEN_INVENTORY.md)
- [Dashboard surface brief](../../../../.impeccable/surfaces/resources-js-pages-dashboard-tsx.md)
- Runtime context: `resources/js/pages/dashboard.tsx`, `resources/css/app.css`, app shell, navigation, and representative UI components.
- Phase-specific context: accessibility/content guidelines.

## Deliverables

Tambahkan first-run, empty, loading, long-content, partial-permission, error,
stale, serta mobile/tablet states; pastikan hierarchy dan action order tetap utuh.

## Out of Scope

Menyembunyikan state dengan placeholder permanen atau mengandalkan hover/color.

## Verification

Keyboard, screen-reader semantics, reduced motion, 320px mobile, tablet,
small laptop, desktop, longest-content, lint, typecheck, dan build.

## Exit Criteria

State matrix dan responsive acceptance dashboard lulus.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P07: Approve and document the reference system](P07-approve-and-document-the-reference-system.md)
