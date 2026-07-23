---
id: P13
title: 'Membership request and domain verification'
stage: 02-identity-tenancy
depends_on: [P12]
gate: automatic
next: P14
---

# P13: Membership request and domain verification

## Outcome

Memungkinkan student meminta afiliasi dan diverifikasi lewat approved domain.

## Prerequisites

P12 selesai.

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

Buat request/action/form request/routes untuk memilih institution, request
membership, automatic domain match, pending fallback, audit, dan notifications boundary.

## Out of Scope

Memberi verified status dari free-text institution atau unverified account.

## Verification

Approved/unapproved domain, case normalization, repeated request, tenant
scope, audit, feature tests, Larastan, dan Pint.

## Exit Criteria

Safe automatic dan pending workflows bekerja.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P14: Campus membership review backend](P14-campus-membership-review-backend.md)
