---
id: P45
title: 'Validation queue and review UI'
stage: 06-contribution-portfolio
depends_on: [P44]
gate: human
next: P46
---

# P45: Validation queue and review UI

## Outcome

Membuat campus reviewer menyelesaikan queue secara efisien dan aman.

## Prerequisites

P44 selesai.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [User flows](../../../ux/USER_FLOWS.md)
- [Data model](../../../engineering/DATA_MODEL.md)
- [Security and privacy](../../../engineering/SECURITY_PRIVACY.md)
- [Test strategy](../../TEST_STRATEGY.md)
- [Contribution surface brief](../../../../.impeccable/surfaces/route-contributions.md)
- Phase-specific context: campus surface brief.

## Deliverables

Implementasikan queue filters/order, review detail, evidence access, provenance,
approve/revision/reject actions, reason input, keyboard flow, dan audit context.

## Out of Scope

Menggunakan unexplained priority atau bulk decision.

## Verification

Keyboard-only review, forbidden evidence, stale decision, long queue,
responsive behavior, browser tests, lint, typecheck, build.

## Exit Criteria

Reviewer dapat menyelesaikan contribution review end-to-end.

## Gate and Next Phase

- **Gate:** Human karena decision queue merupakan major pattern.
- **Next:** [P46: Portfolio projection and visibility backend](P46-portfolio-projection-and-visibility-backend.md)
