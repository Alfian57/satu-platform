---
id: P33
title: 'Task workspace UI'
stage: 05-realtime-workspace
depends_on: [P32]
gate: human
next: P34
---

# P33: Task workspace UI

## Outcome

Membuat task workflow dapat digunakan tanpa Reverb.

## Prerequisites

P32 selesai.

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

Implementasikan workspace shell, task list/detail/editor, assignment/status,
due date, permission states, mobile list alternative, dan Wayfinder actions.

## Out of Scope

Mengandalkan drag-and-drop sebagai satu-satunya kontrol atau menambah discussion.

## Verification

Refresh correctness, keyboard alternative, mobile, loading/empty/error,
feature/browser tests, lint, typecheck, build.

## Exit Criteria

Team dapat mengelola task end-to-end tanpa websocket.

## Gate and Next Phase

- **Gate:** Human karena workspace memperkenalkan major interaction pattern.
- **Next:** [P34: Discussion backend](P34-discussion-backend.md)
