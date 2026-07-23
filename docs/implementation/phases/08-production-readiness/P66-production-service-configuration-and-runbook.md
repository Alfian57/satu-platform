---
id: P66
title: 'Production service configuration and runbook'
stage: 08-production-readiness
depends_on: [P65]
gate: conditional
next: P67
---

# P66: Production service configuration and runbook

## Outcome

Mendokumentasikan dan memvalidasi MySQL, queue, Reverb, storage, dan mail runtime.

## Prerequisites

P65 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [Architecture](../../../engineering/ARCHITECTURE.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Test strategy](../../TEST_STRATEGY.md)
- [Roadmap and release gates](../../ROADMAP.md)
- Runtime context: configuration, deployment, queue, broadcast, storage, mail, build, test, and environment files relevant to the phase.
- Phase-specific context: Laravel deployment docs.

## Deliverables

Tetapkan environment contract, worker/Reverb process topology, channel
authorization, private storage, mail, scheduler, secrets, health checks, startup ordering,
graceful restart, dan deployment runbook.

## Out of Scope

Commit secret atau memilih paid provider tanpa approval.

## Verification

Config cache, production build, queue/Reverb smoke, health checks, missing-env
failure, runbook walkthrough.

## Exit Criteria

Operator dapat deploy dan restart service tanpa implicit knowledge.

## Gate and Next Phase

- **Gate:** Human memilih/menyetujui production environment bila belum tersedia.
- **Next:** [P67: Backup, recovery, monitoring, and incident readiness](P67-backup-recovery-monitoring-and-incident-readiness.md)
