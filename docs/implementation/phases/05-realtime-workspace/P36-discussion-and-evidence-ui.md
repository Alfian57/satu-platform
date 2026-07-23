---
id: P36
title: 'Discussion and evidence UI'
stage: 05-realtime-workspace
depends_on: [P35]
gate: automatic
next: P37
---

# P36: Discussion and evidence UI

## Outcome

Menggabungkan discussion serta upload evidence ke workspace.

## Prerequisites

P35 selesai.

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

Implementasikan discussion timeline, composer, upload progress/failure/retry,
attachment preview/download, provenance metadata, pagination, dan mobile behavior.

## Out of Scope

Menggunakan optimistic success untuk upload yang belum tersimpan.

## Verification

Keyboard, focus return, upload states, long discussion, forbidden file,
browser tests, lint, typecheck, build.

## Exit Criteria

Workspace HTTP flow lengkap sebelum realtime.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P37: Reverb channel authorization and events](P37-reverb-channel-authorization-and-events.md)
