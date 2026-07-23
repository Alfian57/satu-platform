---
id: P11
title: 'Audit and consent foundation'
stage: 02-identity-tenancy
depends_on: [P10]
gate: automatic
next: P12
---

# P11: Audit and consent foundation

## Outcome

Menyediakan append-only provenance untuk tindakan sensitif dan consent.

## Prerequisites

P10 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Onboarding surface brief](../../../../.impeccable/surfaces/route-onboarding.md)
- Runtime context: existing Fortify actions, auth pages, middleware, routes, migrations, and auth tests.
- Phase-specific context: security/privacy audit requirements.

## Deliverables

Tambahkan audit entry dan consent record schema, actor/context metadata,
append-only services, factories, redaction rules, serta tests.

## Out of Scope

Menyimpan message content, secret, raw sensitive payload, atau retention policy
yang belum disetujui.

## Verification

Immutability behavior, sensitive-field exclusion, tenant scope, Pest,
Larastan, dan Pint.

## Exit Criteria

Membership dan phase berikutnya dapat menulis auditable decision.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P12: Registration and email-verification integration](P12-registration-and-email-verification-integration.md)
