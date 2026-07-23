---
id: P61
title: 'MySQL compatibility and indexes'
stage: 08-production-readiness
depends_on: [P60]
gate: automatic
next: P62
---

# P61: MySQL compatibility and indexes

## Outcome

Membuktikan schema/query utama aman pada target database production.

## Prerequisites

P60 selesai.

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
- Phase-specific context: all current migrations/query hotspots.

## Deliverables

Jalankan migration/tests pada MySQL-equivalent environment; perbaiki type,
constraint, transaction, locking, index, dan SQLite compatibility yang relevan.

## Out of Scope

Mengoptimalkan tanpa query evidence atau mengubah domain behavior.

## Verification

Fresh migration, seed, critical feature tests, query plans untuk hotspot,
unique/concurrency behavior, Pint, dan Larastan.

## Exit Criteria

Tidak ada behavior penting yang hanya lulus di SQLite.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P62: Performance and realistic volume](P62-performance-and-realistic-volume.md)
