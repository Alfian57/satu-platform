---
id: P38
title: 'Echo presence and live deltas'
stage: 05-realtime-workspace
depends_on: [P37]
gate: automatic
next: P39
---

# P38: Echo presence and live deltas

## Outcome

Menghubungkan workspace client ke authorized realtime events.

## Prerequisites

P37 selesai.

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
- Phase-specific context: Inertia/Echo docs.

## Deliverables

Integrasikan presence, event subscriptions, task/discussion delta application,
duplicate protection, teardown, visible connection state, dan prop/type contracts.

## Out of Scope

Menghapus HTTP fallback atau menyimpan domain state hanya di client.

## Verification

Two-client task/discussion update, duplicate event, navigation cleanup,
typecheck, lint, build, dan browser console.

## Exit Criteria

Realtime mempercepat UI tanpa mengubah database authority.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P39: Reconnect and reconciliation](P39-reconnect-and-reconciliation.md)
