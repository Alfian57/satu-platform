---
version: 1
slug: 'route-campus-integrations'
primary_target: 'route:/campus/integrations'
related_targets:
    ['route:/campus/integrations/mappings', 'route:/campus/integrations/syncs']
---

# Academic Integration Operations

## Job and Audience

Campus operator ingin memetakan verified activity menjadi kredit dan mengawasi sync sandbox atau provider tanpa mengubah data secara tidak sengaja. Mode: **Operate**.

## Outcome and Proof

Operator memahami connection, mapping version, payload scope, sync status, failure reason, retry consequence, dan reconciliation result.

## Selected Direction

Operations ledger dengan mapping register, sync receipt, status timeline, dan failure docket. Sandbox diberi treatment jelas tetapi tidak terlihat seperti mainan.

## States and Ranges

Disconnected, sandbox, connected, degraded; draft/active/retired mapping; queued/sending/succeeded/failed/retrying/dead; duplicate, validation error, timeout, conflict, reconciled.

## Interaction and Accessibility

Mapping editor mencegah duplicate active mapping. Retry meminta confirmation dan idempotency explanation. Status timeline memiliki text description. Dense table reflow menjadi stacked records pada mobile.

## Constraints

Sandbox adalah baseline release. Real campus API membutuhkan external gate dan approved secret handling.

## Loading Contract

Loading mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md).
Mapping register, sync receipt, dan failure queue memakai skeleton per region.
Retry atau sync command mempertahankan receipt dan menampilkan inline progress.
