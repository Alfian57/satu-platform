---
id: P25
title: 'Project detail and editor UI'
stage: 04-projects-matching-teams
depends_on: [P24]
gate: automatic
next: P26
---

# P25: Project detail and editor UI

## Outcome

Menyelesaikan create/edit/detail experience untuk project lifecycle.

## Prerequisites

P24 selesai.

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

Implementasikan project editor dan detail dengan requirements, capacity,
status, owner actions, deadline, validation, destructive confirmation, dan read-only states.

## Out of Scope

Membuat team transitions atau workspace.

## Verification

Form authorization, invalid lifecycle UI, mobile layout, accessibility,
browser tests, lint, typecheck, dan build.

## Exit Criteria

Owner dapat membuat/open project dan student dapat memahami project detail.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P26: Versioned matching service](P26-versioned-matching-service.md)
