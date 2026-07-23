---
id: P30
title: 'Team formation UI'
stage: 04-projects-matching-teams
depends_on: [P29]
gate: conditional
next: P31
---

# P30: Team formation UI

## Outcome

Membuat invitation/request decisions dapat dipahami dan dipulihkan.

## Prerequisites

P29 selesai.

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
- Phase-specific context: established design authority.

## Deliverables

Implementasikan candidate/request queue untuk owner, invitation view untuk
student, capacity state, safe decline/reject copy, permission/read-only states, dan
Wayfinder actions.

## Out of Scope

Menampilkan hidden connectivity reason atau memulai workspace.

## Verification

Keyboard, permission state, capacity-full transition, mobile layout,
browser flow, lint, typecheck, dan build.

## Exit Criteria

Student dapat bergabung ke team end-to-end.

## Gate and Next Phase

- **Gate:** Human bila pattern decision queue baru.
- **Next:** [P31: Project-to-team quality gate](P31-project-to-team-quality-gate.md)
