---
id: P21
title: 'Project schema and lifecycle'
stage: 04-projects-matching-teams
depends_on: [P20]
gate: automatic
next: P22
---

# P21: Project schema and lifecycle

## Outcome

Memodelkan project, required roles/skills, capacity, dan statuses.

## Prerequisites

P20 selesai.

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

## Deliverables

Tambahkan project, requirements, lifecycle enum, relations, constraints,
factories, realistic states, dan migrations.

## Out of Scope

Membuat discovery UI, matching, atau workspace task.

## Verification

Status transitions, capacity constraints, institution ownership, deadline,
migration, Pest, Larastan, dan Pint.

## Exit Criteria

Schema memenuhi FR-03.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P22: Project commands and policies](P22-project-commands-and-policies.md)
