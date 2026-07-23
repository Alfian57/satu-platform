---
id: P14
title: 'Campus membership review backend'
stage: 02-identity-tenancy
depends_on: [P13]
gate: automatic
next: P15
---

# P14: Campus membership review backend

## Outcome

Menyediakan keputusan manual membership yang authorized dan auditable.

## Prerequisites

P13 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Onboarding surface brief](../../../../.impeccable/surfaces/route-onboarding.md)
- Runtime context: existing Fortify actions, auth pages, middleware, routes, migrations, and auth tests.
- Phase-specific context: campus authorization rules.

## Deliverables

Buat queue query, approve/reject commands, required reason rules, policy,
audit, notification event, dan feature tests.

## Out of Scope

Membuat campus UI atau bulk approval.

## Verification

Authorized reviewer, cross-tenant denial, repeat decision, reason validation,
audit, Pest, Larastan, dan Pint.

## Exit Criteria

Backend review contract siap dipakai onboarding/admin UI.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P15: Onboarding UI](P15-onboarding-ui.md)
