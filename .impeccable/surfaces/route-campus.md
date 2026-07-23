---
version: 1
slug: 'route-campus'
primary_target: 'route:/campus'
related_targets: ['route:/campus/memberships', 'route:/campus/validations']
---

# Campus Operations, Membership, and Validation

## Job and Audience

Campus admin menangani membership dan contribution queues dengan volume tinggi serta tuntutan audit. Mode: **Operate**.

## Outcome and Proof

Admin mengetahui workload, priority reason, SLA risk, dan next review. Keputusan dapat diselesaikan dengan context cukup dan meninggalkan audit trail.

## Selected Direction

Mewarisi **Buku Besar Kolaborasi** sebagai registrar docket modern. Dense queue memakai ruled table/list, indexed filter, sticky context, dan validation mark. Metric hanya mendukung workload decision.

## Scope and Boundaries

Mencakup overview, membership verification, project oversight, contribution validation, filter, review detail, reason, audit, dan report entry point. Tidak mencakup platform-wide tenant management atau recruiter analytics.

## States and Ranges

- Empty queue, 20–100 typical, 10,000 paginated.
- Missing evidence, duplicate membership, conflicting domain.
- Reviewer permission loss, stale item, concurrent decision.
- Bulk selection hanya untuk safe reversible operations.

## Interaction and Layout

Queue dapat dipakai keyboard, memiliki saved URL filter, dan membuka docket tanpa kehilangan position. Decision memerlukan explicit confirmation bila irreversible. Mobile mendukung review satu per satu; bulk operation dioptimalkan untuk desktop.

## Constraints and Open Decisions

Semua query institution-scoped dan policy-authorized. Reviewer identity, reason, timestamp, dan policy version disimpan. Validation authority tetap open gate.
