---
id: P52
title: 'Campus overview queries'
stage: 07-campus-inclusion
depends_on: [P51]
gate: automatic
next: P53
---

# P52: Campus overview queries

## Outcome

Menyediakan operational workload dan outcome data tanpa leaderboard.

## Prerequisites

P51 selesai.

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

## Deliverables

Buat scoped aggregate/query services untuk membership, project, contribution,
review turnaround, participation, date/program filters, pagination/drill-down, dan tests.

## Out of Scope

Membuat individual popularity rank atau inclusion signal.

## Verification

Tenant scope, aggregate correctness, empty range, no N+1, realistic volume,
index review, Pest, Larastan, dan Pint.

## Exit Criteria

Campus dashboard data contract stabil.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P53: Campus operations dashboard UI](P53-campus-operations-dashboard-ui.md)
