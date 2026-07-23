# Implementation Workflow: SATU

Folder ini mengatur urutan eksekusi Increment 1. AI tidak membaca seluruh phase sekaligus.
Mulai dari [`PROGRESS.md`](PROGRESS.md), buka file phase aktif, lalu baca hanya sumber yang
tercantum pada `Read Before Work`.

## Structure

```text
implementation/
├── README.md
├── ROADMAP.md
├── PROGRESS.md
├── TEST_STRATEGY.md
└── phases/
    ├── 01-visual-authority/
    ├── 02-identity-tenancy/
    ├── 03-profile-skills/
    ├── 04-projects-matching-teams/
    ├── 05-realtime-workspace/
    ├── 06-contribution-portfolio/
    ├── 07-campus-inclusion/
    └── 08-production-readiness/
```

## Stage Index

| Stage | Phase   | Outcome                                                     |
| ----- | ------- | ----------------------------------------------------------- |
| 01    | P01–P07 | Visual direction, reference dashboard, dan design authority |
| 02    | P08–P16 | Identity, institution membership, tenancy, dan onboarding   |
| 03    | P17–P20 | Student profile, skills, availability, dan visibility       |
| 04    | P21–P31 | Projects, explainable matching, dan team formation          |
| 05    | P32–P40 | Database-first realtime workspace                           |
| 06    | P41–P50 | Contribution validation dan portfolio provenance            |
| 07    | P51–P59 | Campus operations dan governed inclusion review             |
| 08    | P60–P69 | Production readiness, recovery, release rehearsal, dan UAT  |

Rationale dan release gates berada di [`ROADMAP.md`](ROADMAP.md). Verification lintas
capability berada di [`TEST_STRATEGY.md`](TEST_STRATEGY.md).

## Phase File Contract

Setiap file phase memiliki metadata statis:

```yaml
---
id: P01
title: 'Shape dashboard mahasiswa'
stage: 01-visual-authority
depends_on: []
gate: human
next: P02
---
```

Allowed `gate` values:

- `automatic`: dapat ditutup setelah seluruh verification dan exit criteria lulus;
- `human`: memerlukan persetujuan eksplisit;
- `conditional`: memerlukan persetujuan hanya jika kondisi pada phase terjadi;
- `external`: memerlukan keputusan governance, institution, legal, atau operations.

Body setiap phase wajib memiliki:

1. `Outcome`
2. `Prerequisites`
3. `Read Before Work`
4. `Deliverables`
5. `Out of Scope`
6. `Verification`
7. `Exit Criteria`
8. `Gate and Next Phase`

Phase file tidak menyimpan status. [`PROGRESS.md`](PROGRESS.md) adalah satu-satunya sumber
status agar handoff lintas-agent tidak mengalami drift.

## Execution Rules

1. Satu sesi AI mengerjakan satu phase.
2. Ubah state menjadi `in_progress` ketika pekerjaan benar-benar dimulai.
3. Jangan melewati prerequisite atau mengerjakan next phase sebagai cleanup.
4. Jalankan verification yang tercantum sebelum mengubah state.
5. Pada human/external gate, gunakan `awaiting_approval` atau `blocked` dan berhenti.
6. Setelah phase automatic selesai, perbarui pointer ke next phase tetapi tetap akhiri sesi.
7. Detail histori berada di Git; jangan membuat jurnal pelaporan panjang.

## Progress State

Allowed states:

- `ready`
- `in_progress`
- `blocked`
- `awaiting_approval`
- `completed`

`completed_through` selalu sequential. Phase tidak boleh ditandai selesai secara lompat.
Ketika P69 selesai, `current_phase`, `current_phase_file`, dan `next_phase` menjadi `null`,
sedangkan `state` menjadi `completed`.

## Concise Report Contract

Laporan default kepada pengguna tepat empat baris:

```text
Phase: Pxx: completed|awaiting_approval|blocked
Outcome: satu kalimat hasil utama
Checks: pemeriksaan utama dan statusnya
Next: Pyy: judul phase | Blocker: satu kalimat
```

Jangan mencantumkan seluruh file, diff, atau raw test output kecuali dibutuhkan untuk
menjelaskan kegagalan atau pengguna memintanya.
