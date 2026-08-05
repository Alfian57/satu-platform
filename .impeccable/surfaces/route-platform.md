---
version: 1
slug: 'route-platform'
primary_target: 'route:/platform'
related_targets: ['route:/platform/institutions', 'route:/platform/recruiters']
---

# Platform Provisioning Operations

## Job and Audience

Platform admin memverifikasi institution dan recruiter organization, mengundang privileged user, mengelola entitlement, dan menangani delivery failure. Mode: **Operate**.

## Outcome and Proof

Setiap privileged transition memiliki input, reason, actor, timestamp, outcome, dan recovery yang dapat diaudit.

## Selected Direction

Dense decision docket dan operations ledger. Queue mendahulukan blocked dan expiring item tanpa memakai warna sebagai satu-satunya prioritas.

## States and Ranges

Pending/approved/rejected/suspended institution; invitation queued/sent/failed/expired/accepted/revoked; recruiter review; entitlement scheduled/active/expired/revoked; provider degraded.

## Boundaries and Accessibility

Tidak ada privileged role melalui open registration. Destructive atau granting action meminta reason dan confirmation. Queue memakai table semantics, keyboard bulk selection, dan focus restoration.
