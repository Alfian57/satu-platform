---
id: P37
title: 'Reverb channel authorization and events'
stage: 05-realtime-workspace
depends_on: [P36]
gate: automatic
next: P38
---

# P37: Reverb channel authorization and events

## Outcome

Mengirim delta setelah commit hanya ke team yang berwenang.

## Prerequisites

P36 selesai.

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
- Phase-specific context: Reverb version-specific docs.

## Deliverables

Konfigurasikan private/presence channels, authorization callbacks, minimal
event payloads, after-commit dispatch, queue behavior, dan fake broadcast tests.

## Out of Scope

Menjadikan broadcast source of truth atau mengirim sensitive/raw model payload.

## Verification

Same-team subscription, cross-team/tenant denial, after-commit ordering,
failed broadcast non-rollback, payload contract, Pest, Larastan, dan Pint.

## Exit Criteria

Authorized task/discussion deltas tersedia di server.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P38: Echo presence and live deltas](P38-echo-presence-and-live-deltas.md)
