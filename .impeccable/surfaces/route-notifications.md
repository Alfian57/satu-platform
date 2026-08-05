---
version: 1
slug: 'route-notifications'
primary_target: 'route:/notifications'
related_targets: ['route:/settings/notifications']
---

# Notification Center dan Preferences

## Job and Audience

Authenticated user ingin mengetahui perubahan penting dan mengatur kapan WhatsApp dipakai. Mode: **Operate**.

## Outcome and Proof

In-app center menjadi canonical history. User dapat filter, mark read, membuka deep link, dan mengatur purpose-specific WhatsApp preference.

## Selected Direction

Chronological dispatch ledger dengan unread marker, purpose tab, compact provenance, dan quiet bulk actions.

## States and Ranges

Empty, loading, unread, read, deep-link unavailable, offline, stale, delivery queued/sent/failed, preference save success/error, 1 sampai 500 paginated records.

## Boundaries

Auth dan mandatory security notice tidak dapat dimatikan jika diperlukan untuk keamanan. Raw provider payload, phone penuh, inclusion detail, dan private evidence tidak ditampilkan.

## Accessibility

New notifications memakai polite announcement dan tidak mencuri focus. Bulk action memiliki selection summary. Status provider tidak bergantung pada icon atau warna.
