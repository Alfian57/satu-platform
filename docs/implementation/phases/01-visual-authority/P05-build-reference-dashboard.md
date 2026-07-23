---
id: P05
title: 'Build reference dashboard'
stage: 01-visual-authority
depends_on: [P04]
gate: automatic
next: P06
---

# P05: Build reference dashboard

## Outcome

Mengimplementasikan approved dashboard composition dengan data sintetis.

## Prerequisites

P04 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [UX strategy](../../../ux/UX_STRATEGY.md)
- [Screen inventory](../../../ux/SCREEN_INVENTORY.md)
- [Dashboard surface brief](../../../../.impeccable/surfaces/resources-js-pages-dashboard-tsx.md)
- Runtime context: `resources/js/pages/dashboard.tsx`, `resources/css/app.css`, app shell, navigation, and representative UI components.
- Phase-specific context: approved comp.

## Deliverables

Bangun next-action focus, project recommendation beserta alasan, active work,
deadline/review queue, serta provenance/status details dengan fixture yang jelas berlabel
synthetic.

## Out of Scope

Membuat backend feature palsu, hardcoded URL, generic three-card grid, atau
metric tanpa product meaning.

## Verification

Visual comparison terhadap comp, semantic markup, no console error,
typecheck, build, dan dashboard test.

## Exit Criteria

Desktop reference dashboard memiliki fidelity yang sama dengan arah terpilih.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P06: Complete dashboard states and responsiveness](P06-complete-dashboard-states-and-responsiveness.md)
