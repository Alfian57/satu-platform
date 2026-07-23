---
id: P55
title: 'Collaboration graph projection'
stage: 07-campus-inclusion
depends_on: [P54]
gate: automatic
next: P56
---

# P55: Collaboration graph projection

## Outcome

Membentuk graph metadata minimum dari aktivitas kolaborasi yang sah.

## Prerequisites

P54 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [UX strategy](../../../ux/UX_STRATEGY.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Architecture](../../../engineering/ARCHITECTURE.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Test strategy](../../TEST_STRATEGY.md)
- [Campus operations surface brief](../../../../.impeccable/surfaces/route-campus.md)
- [Inclusion review surface brief](../../../../.impeccable/surfaces/route-campus-inclusion.md)
- Phase-specific context: approved governance contract.

## Deliverables

Implementasikan versioned projection inputs, edge rules, data sufficiency,
institution/time-window scope, rebuild/idempotency, factories, dan tests.

## Out of Scope

Membaca message content, academic grades, external social graph, atau data di
luar approved minimum.

## Verification

Insufficient data, tenant/time boundaries, idempotent rebuild, deleted/expired
data behavior, Pest, Larastan, dan Pint.

## Exit Criteria

Graph projection dapat direproduksi dari approved metadata.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P56: Versioned inclusion-signal engine](P56-versioned-inclusion-signal-engine.md)
