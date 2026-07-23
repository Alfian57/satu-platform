---
id: P28
title: 'Recommendation UI and real dashboard props'
stage: 04-projects-matching-teams
depends_on: [P27]
gate: automatic
next: P29
---

# P28: Recommendation UI and real dashboard props

## Outcome

Mengganti dashboard fixture dengan real prioritized actions dan recommendation.

## Prerequisites

P27 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [UX strategy](../../../ux/UX_STRATEGY.md)
- [Screen inventory](../../../ux/SCREEN_INVENTORY.md)
- [Dashboard surface brief](../../../../.impeccable/surfaces/resources-js-pages-dashboard-tsx.md)
- Runtime context: `resources/js/pages/dashboard.tsx`, `resources/css/app.css`, app shell, navigation, and representative UI components.
- Phase-specific context: RP-PROJECT.

## Deliverables

Wire dashboard props, explanation, hide/not-relevant actions, profile repair
link, loading/empty/stale states, dan project discovery recommendation treatment.

## Out of Scope

Mengubah approved composition tanpa reason atau menampilkan sensitive factor.

## Verification

Fixture removal, prop types, explanation copy, keyboard, mobile, feature dan
browser tests, lint, typecheck, build.

## Exit Criteria

Reference dashboard bekerja dengan application data sebenarnya.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P29: Atomic team transitions](P29-atomic-team-transitions.md)
