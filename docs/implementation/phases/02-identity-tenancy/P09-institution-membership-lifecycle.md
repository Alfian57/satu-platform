---
id: P09
title: 'Institution membership lifecycle'
stage: 02-identity-tenancy
depends_on: [P08]
gate: automatic
next: P10
---

# P09: Institution membership lifecycle

## Outcome

Memodelkan afiliasi user-institution secara terpisah dari account.

## Prerequisites

P08 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Onboarding surface brief](../../../../.impeccable/surfaces/route-onboarding.md)
- Runtime context: existing Fortify actions, auth pages, middleware, routes, migrations, and auth tests.

## Deliverables

Tambahkan membership statuses, verification source, requested/reviewed
metadata, constraints, relations, factories, dan transition tests.

## Out of Scope

Mengizinkan role sensitif dipilih saat registrasi atau membuat UI.

## Verification

Invalid transition, duplicate active membership, provenance, factory states,
migration, Pest, Larastan, dan Pint.

## Exit Criteria

Membership lifecycle sesuai FR-01 dan data model.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P10: Tenant context and policy foundation](P10-tenant-context-and-policy-foundation.md)
