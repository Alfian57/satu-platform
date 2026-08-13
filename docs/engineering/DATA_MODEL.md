# Data Model SATU

## 1. Principles

- MySQL adalah target production.
- Primary key internal tidak boleh menjadi authorization proof.
- Tenant-owned record membawa `institution_id` atau memiliki jalur relasi tenant yang tidak ambigu.
- Sensitive history untuk consent, validation, entitlement, inclusion review, dan sync bersifat append-only.
- Planned schema pada dokumen ini belum dianggap implemented sampai migration issue selesai.

## 2. Identity dan Institution

### `users`

Private `username`, password, display name, status, last authenticated timestamp, dan security metadata. Target schema tidak memakai email. Username dinormalisasi, unique, login-only, dan tidak masuk public/recruiter projection.

### `phone_numbers`

User, normalized E.164 number, masked display, verified-at, status, dan change history. Raw phone classified restricted.

### `otp_challenges`

Purpose, target hash/reference, OTP hash, expires-at, attempts, resend count, consumed-at, invalidated-at, request context, dan audit timestamps. OTP plaintext tidak disimpan.

### `institutions`, `institution_memberships`

Institution identity/status dan membership role/status/history. Role berasal dari membership relationship, bukan global user role.

### `institution_rosters`, `institution_roster_rows`

Import batch, effective semester, source filename metadata, checksum, normalized NIM, normalized phone hash/encrypted value, student display data minimum, active flag, validation outcome, dan row error. Import history immutable setelah committed.

### `affiliation_requests`, `affiliation_reviews`

Student, institution, NIM, roster match result, status, reviewer, reason code, note, timestamps, dan append-only transition history.

### `privileged_invitations`

Institution/recruiter organization, intended role, normalized phone, token hash, expiry, delivery status, accepted/revoked timestamps, issuer, dan audit reference.

## 3. Profile, Projects, dan Workspace

- `student_profiles`, `skills`, `profile_skills`, `availability_windows`
- `projects`, `project_roles`, `project_role_skills`, `team_memberships`, `team_invitations`, `team_join_requests`, `team_membership_events`
- `tasks`, `task_assignments`, `messages`, `attachments`

Project, team, task, message, dan attachment selalu memiliki institution ownership. Attachment memakai private storage path dan authorized download.

`team_memberships` menyimpan state peserta saat ini secara unik per project dan user. Invitation serta join request memakai state pending yang unik per pasangan project dan user, lalu transition history disimpan melalui audit append-only dan event membership. Perubahan yang memengaruhi capacity mengunci project row dalam transaction.

## 4. Matching

- `match_score_versions`: immutable weights, dimensions, activation time, author, notes.
- `match_runs`: version, normalized input snapshot, institution, actor, computed-at.
- `recommendations`: component score, total, explanation projection, expiry.
- `recommendation_feedback`: user outcome tanpa mengubah historical score.

Supported dimension hanya `skill_fit`, `project_need`, `availability`, dan `connectivity_opportunity`.

## 5. Contribution dan Portfolio

- `contributions`: owner, project/team, lifecycle, current version pointer.
- `contribution_versions`: immutable claim and summary.
- `contribution_evidence`: private source metadata dan storage reference.
- `contribution_reviews`: campus reviewer decision, required reason for non-approval, note, immutable policy version, and reviewed-at.
- `portfolio_entries`: approved source, visible fields, visibility level, published/withdrawn-at.

Team confirmation tidak menjadi state requirement. Approval campus reviewer adalah validation authority.

## 6. Gamification

### `xp_ledger_entries`

User, institution, semester, amount, reason, source type/id, policy version, awarded-at, reversal reference, dan unique idempotency key.

Setiap approved contribution menghasilkan tepat satu award dengan key
`{contribution_id}:{version}`. Reversal menyimpan amount positif pada row baru
dan mereferensikan row award melalui `reversal_reference_id`, sehingga net XP
dapat dihitung tanpa mengubah atau menghapus history. Row ledger append-only
dilindungi oleh model dan database trigger/check, serta seluruh mutasi award
dan reversal dicatat pada audit log.

### `badge_definitions`, `badge_rule_versions`, `badge_awards`, `badge_revocations`

`badge_definitions` menyimpan key taxonomy yang immutable, category, level, public
name, dan public description. Perubahan taxonomy membuat definition baru agar
public copy yang pernah dipakai tidak berubah diam-diam.

`badge_rule_versions` menyimpan definition, version integer, rule type, criteria
tervalidasi, policy version, author, dan active state. Hanya satu versi aktif
untuk satu definition. Rule lama tetap tersimpan ketika versi baru diaktifkan.

`badge_awards` menyimpan user, institution, definition, rule version, source
contribution dan version, safe source label, reason, idempotency key,
awarded-at, serta revoked-at. Automatic evaluation hanya membaca contribution
yang approved dan review approved. Source provenance tidak menyimpan atau
memuat private evidence, message, inclusion, atau connectivity fields.

`badge_revocations` adalah history append-only yang menyimpan award, actor,
reason, dan revoked-at. Revoke mengubah hanya revoked-at pada award dan tidak
menghapus atau menulis ulang award maupun rule history.

### `leaderboard_periods`, `leaderboard_preferences`, `leaderboard_projections`

Semester, scope type/id, rank, shared-rank group, score, verified XP total, active-member denominator, cohort size, suppressed flag, rule version, computed-at. Individual preference default off. Inclusion fields dilarang.

Leaderboard rebuild memakai snapshot digest yang deterministic. \`leaderboard_periods\`
menyimpan digest dan waktu komputasi terbaru agar snapshot kosong setelah withdrawal
tetap dapat dibedakan dari snapshot sebelumnya. Row pada \`leaderboard_projections\`
append-only dan retry dengan input yang sama tidak menggandakan row.

Scope \`program\` memakai program studi dari active roster row, scope \`team\` memakai
project team dengan active membership dan approved contribution, sedangkan scope
\`individual\` hanya dibuat untuk student dengan preference opt-in aktif. Score group
adalah average verified XP per active-member denominator. Cohort di bawah lima
disimpan sebagai suppressed tanpa rank, dan tie memakai shared competition rank.
Projection dapat dikenali stale dari \`computed_at\` dan threshold 24 jam.

Rebuild dijalankan melalui queued job \`RebuildLeaderboardProjections\` dengan unique
key per institution dan semester. Command \`gamification:rebuild-leaderboards\`
mengambil active roster dan dijalankan scheduler secara berkala.

## 7. Notifications dan WhatsApp

- Laravel database notifications atau equivalent canonical in-app records.
- `notification_preferences`: purpose dan channel preference.
- `message_outbox`: purpose, recipient reference, template/version, payload hash/encrypted data, status, attempts, next attempt.
- `message_deliveries`: provider, external ID, status history, callback timestamp, sanitized error.

Provider token, plaintext OTP, dan full message payload tidak disimpan pada log.

## 8. Inclusion

- `collaboration_events`: metadata aktivitas yang diizinkan, bukan message content.
- `inclusion_signal_versions`: metric/rule/version/governance status.
- `inclusion_signals`: institution, subject, period, restricted feature state, evidence summary.
- `inclusion_reviews`: reviewer, human conclusion, support action, reason, timestamps.

Real and synthetic records memiliki provenance flag yang eksplisit.

## 9. Talent

- `recruiter_organizations`, `recruiter_memberships`, `recruiter_verification_reviews`
- `talent_entitlements` dan append-only entitlement events
- `talent_profile_projections` sebagai recruiter-safe allowlisted view
- `saved_candidates`
- `contact_requests` dan status history

Projection tidak memuat username, phone sebelum consent handoff, NIM, inclusion, private evidence, messages, raw audit, atau hidden matching input.

## 10. Academic Integration

- `integration_connections`: institution, provider key, mode sandbox/real, encrypted config reference, status.
- `credit_mappings` dan immutable mapping versions.
- `integration_syncs`: source, mapping version, idempotency key, payload digest, status, external reference, attempt timestamps.
- `integration_sync_events`: append-only status/retry/reconcile history.
- `integration_sync_metrics`: institution-scoped aggregate health per connection (total syncs, succeeded, reconciled, dead-letter, retry volume, queue age). Alert threshold dievaluasi lewat scheduled command `integration:alert-sync-anomalies`.

## 11. Consent dan Audit

`consent_records` menyimpan purpose, notice version, decision, source, dan timestamp. `audit_logs` menyimpan actor, tenant context, action, target, outcome, request correlation, serta safe metadata. Audit tidak menjadi tempat menyalin sensitive payload.

## 12. Classification dan Retention

| Class        | Contoh                                          | Default access                     |
| ------------ | ----------------------------------------------- | ---------------------------------- |
| Public       | visible portfolio projection                    | explicit public/recruiter audience |
| Internal     | project metadata, task title                    | authorized team/campus             |
| Confidential | NIM, phone, private evidence                    | subject dan authorized operator    |
| Restricted   | OTP data, inclusion, provider secret, raw audit | narrow service/reviewer role       |

Retention period adalah governance gate. Deletion tidak boleh merusak required append-only proof. Subject-facing projection dapat ditarik sambil mempertahankan minimal lawful audit record.

## 13. Migration Review

Saat mengubah tabel yang sudah memiliki migration asal, edit migration asal tabel tersebut secara langsung sesuai project rule. Jangan membuat migration tambahan dengan pola `add_*_column_*` untuk perubahan kolom. Test wajib mencakup unique constraint, foreign key, tenant index, idempotency, cross-tenant denial, restricted serialization, dan MySQL compatibility.
