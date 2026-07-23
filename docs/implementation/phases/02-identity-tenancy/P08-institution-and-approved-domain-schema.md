---
id: P08
title: 'Institution and approved-domain schema'
stage: 02-identity-tenancy
depends_on: [P07]
gate: automatic
next: P09
---

# P08: Institution and approved-domain schema

## Outcome

Membuat sumber data institution dan domain verifikasi.

## Prerequisites

P07 disetujui.

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

Tambahkan institution dan approved email domain models, migrations, factories,
seed strategy, constraints, relations, dan feature tests.

## Out of Scope

Membuat membership, role assignment, SSO, atau admin UI.

## Verification

Migration fresh, factory behavior, unique/domain constraints, MySQL-compatible
schema, Pest tests, Larastan relevan, dan Pint.

## Exit Criteria

Institution/domain dapat dibuat dan tidak memiliki ambiguous ownership.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P09: Institution membership lifecycle](P09-institution-membership-lifecycle.md)
