---
id: P10
title: 'Tenant context and policy foundation'
stage: 02-identity-tenancy
depends_on: [P09]
gate: automatic
next: P11
---

# P10: Tenant context and policy foundation

## Outcome

Menjamin resource institution-scoped tidak bocor lintas tenant.

## Prerequisites

P09 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Onboarding surface brief](../../../../.impeccable/surfaces/route-onboarding.md)
- Runtime context: existing Fortify actions, auth pages, middleware, routes, migrations, and auth tests.
- Phase-specific context: architecture tenant rules.

## Deliverables

Tetapkan institution context resolution, reusable policy approach, privileged
role assignment boundary, query conventions, dan cross-tenant denial tests.

## Out of Scope

Memakai global scope yang menyembunyikan authorization ambiguity atau
mengimplementasikan feature domain lain.

## Verification

Same-tenant allow, cross-tenant deny, missing-context deny, platform-admin
audit boundary, Pest, Larastan, dan Pint.

## Exit Criteria

Resource baru memiliki pola tenant authorization yang dapat direuse.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P11: Audit and consent foundation](P11-audit-and-consent-foundation.md)
