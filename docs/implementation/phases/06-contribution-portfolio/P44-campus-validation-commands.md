---
id: P44
title: 'Campus validation commands'
stage: 06-contribution-portfolio
depends_on: [P43]
gate: external
next: P45
---

# P44: Campus validation commands

## Outcome

Membuat approve, request revision, dan reject decisions auditable.

## Prerequisites

P43 selesai dan reviewer authority pada OPEN-002 telah ditentukan.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Test strategy](../../TEST_STRATEGY.md)
- [Contribution surface brief](../../../../.impeccable/surfaces/route-contributions.md)
- Phase-specific context: governance decision.

## Deliverables

Implementasikan authorized review commands, required reason/policy version,
append-only decision, audit, notification, portfolio trigger boundary, dan tests.

## Out of Scope

Menebak reviewer role atau melakukan bulk sensitive decision.

## Verification

Reviewer authority, cross-tenant denial, repeat/stale decision, reason,
history, Pest, Larastan, dan Pint.

## Exit Criteria

Review decision contract memenuhi FR-07.

## Gate and Next Phase

- **Gate:** Blocked bila OPEN-002 belum ditutup; selain itu automatic.
- **Next:** [P45: Validation queue and review UI](P45-validation-queue-and-review-ui.md)
