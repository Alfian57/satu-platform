---
id: P22
title: 'Project commands and policies'
stage: 04-projects-matching-teams
depends_on: [P21]
gate: automatic
next: P23
---

# P22: Project commands and policies

## Outcome

Membuat draft-to-active lifecycle authorized dan auditable.

## Prerequisites

P21 selesai.

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

Implementasikan create/update/open/cancel/archive commands, Form Requests,
policies, route/controller boundary, audit, dan feature tests.

## Out of Scope

Menambahkan team membership atau UI.

## Verification

Owner/non-owner, verified membership requirements, invalid transition,
cross-tenant denial, Pest, Larastan, dan Pint.

## Exit Criteria

Project lifecycle dapat dikendalikan aman melalui named routes.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P23: Discovery query and URL contract](P23-discovery-query-and-url-contract.md)
