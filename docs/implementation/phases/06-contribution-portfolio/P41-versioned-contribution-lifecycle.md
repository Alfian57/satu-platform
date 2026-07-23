---
id: P41
title: 'Versioned contribution lifecycle'
stage: 06-contribution-portfolio
depends_on: [P40]
gate: automatic
next: P42
---

# P41: Versioned contribution lifecycle

## Outcome

Memodelkan contribution, versions, linked task, evidence, dan review status.

## Prerequisites

P40 selesai.

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

## Deliverables

Tambahkan contribution/version/evidence relation schema, lifecycle, immutable
approved history, factories, constraints, dan tests.

## Out of Scope

Membuat campus review command atau portfolio projection.

## Verification

Version append, approved-history protection, ownership, task provenance,
migration, Pest, Larastan, dan Pint.

## Exit Criteria

Contribution dapat direvisi tanpa menghapus provenance.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P42: Contribution submission backend](P42-contribution-submission-backend.md)
