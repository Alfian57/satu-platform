---
version: 1
slug: 'route-leaderboards'
primary_target: 'route:/leaderboards'
related_targets: ['route:/dashboard', 'route:/campus']
---

# Hybrid Leaderboard

## Job and Audience

Student dan campus operator ingin melihat perkembangan verified activity tanpa mengubah ranking menjadi penilaian diri atau membuka cohort kecil. Mode: **Operate**.

## Outcome and Proof

Pengguna memahami periode, scope, denominator, minimum cohort, tie, data freshness, dan sumber XP. Student mengendalikan individual opt-in.

## Selected Direction

Supporting ledger dengan ranked rows, verified stamps, period tabs, dan explanation drawer. Celebration lembut hanya pada perubahan milik pengguna, bukan podium neon.

## States and Ranges

Program studi, team, individual opt-in; suppressed cohort; no verified XP; tied rank; stale projection; processing; withdrawn; top 10 sampai paginated long list.

## Interaction and Accessibility

Filter dapat dipakai keyboard dan tersimpan pada URL. Table semantics menjadi baseline. Motion reorder dinonaktifkan pada reduced motion. Opt-in menampilkan preview data dan consequence sebelum confirmation.

## Boundaries

Score kelompok adalah average verified XP per active member per semester, minimum cohort lima. Inclusion dan connectivity bukan input. Individual default off.

## Loading Contract

Loading mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md).
Ranked rows dan explanation drawer memakai skeleton yang mempertahankan period
filter. Processing opt-in atau withdrawal memakai inline status, bukan full-page
skeleton.
