---
id: P51
title: 'Membership verification queue UI'
stage: 07-campus-inclusion
depends_on: [P50]
gate: automatic
next: P52
---

# P51: Membership verification queue UI

## Outcome

Menyelesaikan frontend manual membership review dari P14.

## Prerequisites

P50 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [UX strategy](../../../ux/UX_STRATEGY.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Architecture](../../../engineering/ARCHITECTURE.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Test strategy](../../TEST_STRATEGY.md)
- [Campus operations surface brief](../../../../.impeccable/surfaces/route-campus.md)
- [Inclusion review surface brief](../../../../.impeccable/surfaces/route-campus-inclusion.md)
- Phase-specific context: P14 contracts.

## Deliverables

Implementasikan queue/filter/detail, affiliation evidence, approve/reject
actions, reason, audit context, empty/loading/stale/forbidden states, dan keyboard flow.

## Out of Scope

Bulk approval atau inclusion data.

## Verification

Cross-tenant props, stale decision, keyboard-only flow, long queue, browser
tests, lint, typecheck, build.

## Exit Criteria

Campus dapat menyelesaikan pending membership.

## Gate and Next Phase

- **Gate:** Automatic bila mewarisi decision queue P45.
- **Next:** [P52: Campus overview queries](P52-campus-overview-queries.md)
