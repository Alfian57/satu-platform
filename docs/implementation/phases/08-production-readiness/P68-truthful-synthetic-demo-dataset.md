---
id: P68
title: 'Truthful synthetic demo dataset'
stage: 08-production-readiness
depends_on: [P67]
gate: automatic
next: P69
---

# P68: Truthful synthetic demo dataset

## Outcome

Menyediakan data demo realistis tanpa klaim pilot palsu.

## Prerequisites

P67 disetujui.

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
- Phase-specific context: product evidence rules, dan all factories.

## Deliverables

Buat deterministic seed untuk minimum/typical/maximum state, cross-program
project, matching reasons, workspace history, contribution review, portfolio, campus queue,
dan gated inclusion scenario; label seluruh synthetic evidence.

## Out of Scope

Mengarang customer, institution partnership, impact metric, testimonial, atau
production result.

## Verification

Fresh seed, repeatability, no sensitive real data, all critical screens,
reasonable volume, tests/build.

## Exit Criteria

Demo dan UAT dapat dijalankan konsisten.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P69: Release rehearsal and final UAT](P69-release-rehearsal-and-final-uat.md)
