---
id: P29
title: 'Atomic team transitions'
stage: 04-projects-matching-teams
depends_on: [P28]
gate: automatic
next: P30
---

# P29: Atomic team transitions

## Outcome

Membuat invitation, request, accept, reject, leave, dan removal aman.

## Prerequisites

P28 selesai.

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

Tambahkan team membership lifecycle, commands, transaction/locking or
constraint strategy, policies, reason/audit rules, factories, notifications, dan tests.

## Out of Scope

Membuat team UI atau Reverb workspace.

## Verification

Capacity race, duplicate request, expired invitation, invalid transition,
removal reason, cross-tenant denial, Pest, Larastan, dan Pint.

## Exit Criteria

Team tidak dapat melebihi capacity dan history tidak ambigu.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P30: Team formation UI](P30-team-formation-ui.md)
