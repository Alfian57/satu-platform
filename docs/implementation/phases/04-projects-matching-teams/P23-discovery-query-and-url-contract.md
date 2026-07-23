---
id: P23
title: 'Discovery query and URL contract'
stage: 04-projects-matching-teams
depends_on: [P22]
gate: automatic
next: P24
---

# P23: Discovery query and URL contract

## Outcome

Menyediakan pencarian project yang deterministic, paginated, dan shareable.

## Prerequisites

P22 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [Information architecture](../../../ux/INFORMATION_ARCHITECTURE.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Architecture](../../../engineering/ARCHITECTURE.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Test strategy](../../TEST_STRATEGY.md)
- [Project discovery surface brief](../../../../.impeccable/surfaces/route-projects.md)
- Phase-specific context: Inertia version-specific docs.

## Deliverables

Buat query/filter/sort contract, explicit ordering, pagination, optional/deferred
props yang relevan, URL query serialization, indexes, dan tests.

## Out of Scope

Menghitung matching score atau membangun UI.

## Verification

Filter combinations, stable ordering, no N+1, tenant scope, pagination edge,
Pest, query inspection, Larastan, dan Pint.

## Exit Criteria

Discovery data contract stabil untuk frontend.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P24: Project discovery UI](P24-project-discovery-ui.md)
