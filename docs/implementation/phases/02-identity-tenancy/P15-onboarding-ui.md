---
id: P15
title: 'Onboarding UI'
stage: 02-identity-tenancy
depends_on: [P14]
gate: automatic
next: P16
---

# P15: Onboarding UI

## Outcome

Menghasilkan onboarding account-to-membership yang jelas dan dapat dilanjutkan.

## Prerequisites

P14 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Onboarding surface brief](../../../../.impeccable/surfaces/route-onboarding.md)
- Runtime context: existing Fortify actions, auth pages, middleware, routes, migrations, and auth tests.
- Phase-specific context: onboarding surface brief.

## Deliverables

Implementasikan institution selection, membership request, automatic/pending
outcomes, progress, consent explanation, visibility introduction, dan Wayfinder actions.

## Out of Scope

Menggabungkan full skill profile atau membiarkan pending verification menjadi
dead end.

## Verification

Typecheck, lint, build, feature props, keyboard, focus, error summary,
mobile/small-laptop inspection.

## Exit Criteria

Student memahami perbedaan account dan verified affiliation serta next action.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P16: Onboarding hardening](P16-onboarding-hardening.md)
