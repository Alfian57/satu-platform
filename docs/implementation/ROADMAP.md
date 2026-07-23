# Delivery Roadmap: SATU

## Strategy

SATU dibangun melalui **design-led vertical slices**. Risiko visual diselesaikan lebih awal
dengan satu reference dashboard, kemudian setiap capability dibangun end-to-end melalui
domain, authorization, backend, frontend, tests, dan quality gate.

Roadmap ini hanya menunjukkan milestone. Kontrak pekerjaan berada dalam
[`phases/`](phases/), status aktif berada di [`PROGRESS.md`](PROGRESS.md), dan entry AI
berada di [`START_HERE.md`](../../START_HERE.md).

## Increment 1 Milestones

| Milestone | Phase     | Outcome                                                       |
| --------- | --------- | ------------------------------------------------------------- |
| M0        | completed | Product, UX, engineering, governance, dan AI context tersedia |
| M1        | P01–P07   | Reference dashboard dan design authority disetujui            |
| M2        | P08–P16   | Identity, institution membership, tenancy, audit, onboarding  |
| M3        | P17–P20   | Student profile, skill, availability, consent, visibility     |
| M4        | P21–P31   | Project discovery, explainable matching, dan team formation   |
| M5        | P32–P40   | Database-first realtime workspace                             |
| M6        | P41–P50   | Contribution validation dan portfolio provenance              |
| M7        | P51–P59   | Campus operations dan governed inclusion review               |
| M8        | P60–P69   | Production readiness, recovery, release rehearsal, final UAT  |

## Delivery Order Rationale

1. **Design risk first:** dashboard menjadi visual quality bar sebelum starter defaults
   menyebar ke seluruh fitur.
2. **Identity before collaboration:** tenant, membership, consent, dan audit menjadi boundary
   untuk semua resource berikutnya.
3. **Vertical capability order:** profile memasok matching; project/team memasok workspace;
   workspace memasok contribution; contribution memasok portfolio dan campus review.
4. **Inclusion after governance:** tidak ada signal dari real data sebelum DPIA, minimum data,
   retention, reviewer authority, dan fairness process disetujui.
5. **Production readiness last, not optional:** deployment, backup, recovery, accessibility,
   security, dan UAT merupakan bagian definisi selesai.

## Increment 1 Definition

Increment 1 mencakup:

- verified institution membership;
- profile, skill, interest, availability, consent, dan visibility;
- project discovery, explainable matching, dan team formation;
- realtime task, discussion, serta evidence workspace;
- versioned contribution validation dan portfolio;
- campus membership/contribution queues dan operational dashboard;
- restricted inclusion review setelah governance gate;
- tenant isolation, audit, accessibility, privacy, reliability, dan production operations.

Target ini tidak mencakup:

- paid recruiter subscription dan recruiter organization operations;
- production academic-credit sync atau campus SSO;
- cross-institution project;
- automatic-learning/ML matching;
- native mobile application.

Public-safe portfolio projection boleh tersedia dalam Increment 1, tetapi bukan Talent Portal.

## Release Gates

| Gate               | Required evidence                                                       |
| ------------------ | ----------------------------------------------------------------------- |
| Phase ready        | Prerequisite, `Read Before Work`, dan active pointer benar              |
| Feature ready      | Acceptance tests, authorization, failure states, docs updated           |
| UI ready           | Approved brief, responsive/a11y inspection, no console error            |
| Inclusion ready    | Governance approval, data sufficiency, fairness, restricted access      |
| Demo ready         | Stable synthetic seed, truthful label, no fabricated evidence           |
| Production ready   | MySQL, queue/Reverb, storage, monitoring, backup/restore, security      |
| Increment complete | Full regression, release rehearsal, documented residual risk, final UAT |

## Human Gates

AI wajib berhenti untuk persetujuan pada:

- visual direction dashboard;
- implemented reference dashboard;
- first surface yang memperkenalkan major interaction pattern;
- contribution/campus reviewer authority bila belum ditentukan;
- inclusion governance dan activation;
- production environment/operations decisions;
- final user acceptance.

## Production-Vision Backlog

Setelah Increment 1 disetujui, backlog berikut diprioritaskan melalui decision baru, bukan
dijalankan otomatis:

1. recruiter organization verification dan Talent Portal;
2. subscription, entitlement, dan billing;
3. academic adapter serta idempotent activity-credit sync;
4. institution SSO;
5. second-institution onboarding dan cross-institution operating model;
6. horizontal Reverb/queue scaling dan expanded support operations.

## Risks and Responses

| Risk                                  | Response                                                             |
| ------------------------------------- | -------------------------------------------------------------------- |
| UI kembali menjadi generic AI output  | Reference comp, approval gate, shared design authority, visual audit |
| AI menerima scope terlalu besar       | Satu phase atomik per sesi dan explicit “Jangan” boundary            |
| Backend dan frontend tidak selaras    | Contract-first vertical slices, bukan layer-wide implementation      |
| Tenant/privacy terlambat              | Identity, policy, audit, dan consent mendahului domain lain          |
| Reverb menambah fragility             | Database-first state, authorized deltas, reconnect/reconciliation    |
| Inclusion menimbulkan stigma          | Governance gate, minimum data, safe language, human-only review      |
| “Selesai” hanya berarti demo berjalan | Production gates, recovery evidence, full tests, dan final UAT       |
