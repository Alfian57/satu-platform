---
id: P31
title: 'Project-to-team quality gate'
stage: 04-projects-matching-teams
depends_on: [P30]
gate: automatic
next: P32
---

# P31: Project-to-team quality gate

## Outcome

Membuktikan flow dari discovery hingga active team.

## Prerequisites

P30 selesai.

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
- Phase-specific context: test strategy.

## Deliverables

Tambahkan critical browser flow, concurrency regression, matching explanation
assertions, accessibility inspection, performance query review, dan scoped polish.

## Out of Scope

Memulai workspace task.

## Verification

Full project/team test set, Pint, Larastan, lint, typecheck, build, no
console errors.

## Exit Criteria

FR-03 sampai FR-05 dan related Increment acceptance lulus.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P32: Task domain and commands](../05-realtime-workspace/P32-task-domain-and-commands.md)
