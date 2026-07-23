---
id: P07
title: 'Approve and document the reference system'
stage: 01-visual-authority
depends_on: [P06]
gate: human
next: P08
---

# P07: Approve and document the reference system

## Outcome

Menetapkan dashboard sebagai visual quality bar seluruh aplikasi.

## Prerequisites

P06 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [UX strategy](../../../ux/UX_STRATEGY.md)
- [Screen inventory](../../../ux/SCREEN_INVENTORY.md)
- [Dashboard surface brief](../../../../.impeccable/surfaces/resources-js-pages-dashboard-tsx.md)
- Runtime context: `resources/js/pages/dashboard.tsx`, `resources/css/app.css`, app shell, navigation, and representative UI components.
- Phase-specific context: Impeccable critique, audit, polish, serta document guidance.

## Deliverables

Ambil screenshot desktop/mobile; jalankan scoped critique, audit, dan polish;
perbaiki gap material; setelah approval, scan implementation dan refresh `DESIGN.md`
beserta design sidecar dengan token/component yang benar-benar dipakai.

## Out of Scope

Menurunkan fidelity agar sesuai starter component atau menimpa seed design tanpa
membandingkan keputusan yang sudah dikonfirmasi.

## Verification

Screenshot inspection, accessibility audit, lint, typecheck, build,
dashboard/browser tests, dan design-context resolution.

## Exit Criteria

Pengguna menyetujui reference dashboard dan design authority tidak lagi
provisional untuk primitive yang telah dibangun.

## Gate and Next Phase

- **Gate:** Human approval wajib; status `awaiting_approval`.
- **Next:** [P08: Institution and approved-domain schema](../02-identity-tenancy/P08-institution-and-approved-domain-schema.md)
