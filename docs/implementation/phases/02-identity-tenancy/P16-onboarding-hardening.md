---
id: P16
title: 'Onboarding hardening'
stage: 02-identity-tenancy
depends_on: [P15]
gate: automatic
next: P17
---

# P16: Onboarding hardening

## Outcome

Menutup failure, accessibility, dan security gaps pada identity flow.

## Prerequisites

P15 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Onboarding surface brief](../../../../.impeccable/surfaces/route-onboarding.md)
- Runtime context: existing Fortify actions, auth pages, middleware, routes, migrations, and auth tests.
- Phase-specific context: test strategy.

## Deliverables

Tambahkan browser coverage untuk happy/pending/rejected/retry flows; harden
loading, network error, duplicate submission, expired session, partial permission, dan
copy.

## Out of Scope

Memulai profile taxonomy atau project work.

## Verification

Focus/keyboard, browser flows, cross-tenant tests, no console errors, Pint,
lint, typecheck, dan build.

## Exit Criteria

FR-01 memenuhi acceptance dan onboarding production-quality.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P17: Skill taxonomy and profile schema](../03-profile-skills/P17-skill-taxonomy-and-profile-schema.md)
