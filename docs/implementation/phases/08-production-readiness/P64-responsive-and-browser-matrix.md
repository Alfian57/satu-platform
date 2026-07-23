---
id: P64
title: 'Responsive and browser matrix'
stage: 08-production-readiness
depends_on: [P63]
gate: automatic
next: P65
---

# P64: Responsive and browser matrix

## Outcome

Memastikan semua critical flow tetap usable pada supported viewport/browser.

## Prerequisites

P63 selesai.

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
- Phase-specific context: UX responsive rules.

## Deliverables

Uji 320px mobile, tablet, small laptop, desktop, zoom/text scaling, long
Indonesian copy, supported browsers, touch/keyboard; perbaiki overflow dan order.

## Out of Scope

Menyembunyikan critical action pada mobile atau memaksa horizontal board.

## Verification

Screenshot/browser matrix, no horizontal document overflow, no console
errors, lint, typecheck, build.

## Exit Criteria

Critical flows memenuhi responsive acceptance.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P65: Security, privacy, and tenant regression](P65-security-privacy-and-tenant-regression.md)
