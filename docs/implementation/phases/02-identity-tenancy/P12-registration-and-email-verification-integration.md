---
id: P12
title: 'Registration and email-verification integration'
stage: 02-identity-tenancy
depends_on: [P11]
gate: automatic
next: P13
---

# P12: Registration and email-verification integration

## Outcome

Menghubungkan open student registration dengan aturan institution-aware.

## Prerequisites

P11 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Onboarding surface brief](../../../../.impeccable/surfaces/route-onboarding.md)
- Runtime context: existing Fortify actions, auth pages, middleware, routes, migrations, and auth tests.
- Phase-specific context: Fortify version-specific docs.

## Deliverables

Pertahankan open registration; pastikan role normal; integrasikan verified-email
gate, safe redirect, shared auth state, dan tests.

## Out of Scope

Menambah campus/recruiter role selector atau meminta affiliation sebagai syarat
membuat account.

## Verification

Registration, duplicate email, verification, unverified access denial,
redirect, existing auth regression, Pest, Larastan, dan Pint.

## Exit Criteria

Account dan institution membership tetap lifecycle terpisah.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P13: Membership request and domain verification](P13-membership-request-and-domain-verification.md)
