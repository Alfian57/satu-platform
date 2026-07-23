---
id: P32
title: 'Task domain and commands'
stage: 05-realtime-workspace
depends_on: [P31]
gate: automatic
next: P33
---

# P32: Task domain and commands

## Outcome

Menyediakan task, assignment, status, priority, dan due-date source of truth.

## Prerequisites

P31 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Architecture](../../../engineering/ARCHITECTURE.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Test strategy](../../TEST_STRATEGY.md)
- [Workspace surface brief](../../../../.impeccable/surfaces/route-projects-workspace.md)

## Deliverables

Tambahkan task schema/lifecycle, commands, policies, ordering, factories,
project/team constraints, dan tests.

## Out of Scope

Membuat UI, discussion, atau broadcast.

## Verification

Assignee membership, invalid transition, due date, tenant/team denial,
ordering, Pest, Larastan, dan Pint.

## Exit Criteria

Task state benar tanpa realtime.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P33: Task workspace UI](P33-task-workspace-ui.md)
