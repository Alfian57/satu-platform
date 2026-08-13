# Security, Privacy, dan Responsible Matching SATU

## 1. Security Objectives

- Mencegah account takeover, OTP abuse, dan privileged self-registration.
- Menjamin tenant isolation dan least privilege.
- Mencegah exposure phone, NIM, evidence, inclusion, audit, dan provider secret.
- Menjaga integrity validation, XP, badge, leaderboard, entitlement, dan sync.
- Menyediakan recovery, traceability, dan data-right operations.

## 2. Authentication

- Private username dan password melalui customized Laravel Fortify.
- Registration dan recovery memerlukan verified WhatsApp phone.
- OTP dibuat SATU, di-hash, single-use, purpose-bound, memiliki short expiry, resend cooldown, attempt cap, per-target/IP/device throttling, dan invalidation.
- Fonnte hanya delivery provider. Callback tidak menjadi bukti authentication.
- Error tidak mengungkap apakah username atau phone terdaftar.
- Phone change, recovery, invitation acceptance, dan privileged action memerlukan recent authentication atau step-up yang sesuai.

## 3. Authorization

Native Laravel Policies dan Gates memakai institution membership, recruiter organization membership, entitlement, resource ownership, dan active tenant context. Frontend visibility tidak pernah menjadi authorization control.

Open registration hanya student. Campus admin dan recruiter diprovisikan melalui invitation serta review. Platform admin tidak dapat dibuat dari public flow.

## 4. Tenant Isolation

Setiap protected feature memiliki positive dan negative test untuk same tenant, other tenant, missing tenant, suspended membership, stale context, queued job, cached result, storage path, export, dan Reverb channel. Platform operations memakai explicit audited scope.

## 5. Privacy by Purpose

- Phone: auth, invitation, approved important notification, dan consented contact handoff.
- NIM: roster matching dan campus operation.
- Collaboration metadata: matching dan governed inclusion calculation.
- Portfolio: student-controlled public atau recruiter projection.
- Recruiter data: organization verification, entitlement, saved candidate, dan contact.

Data tidak boleh digunakan ulang untuk purpose baru tanpa owning document, notice, lawful basis, dan consent/governance update.

## 6. Responsible Matching dan Inclusion

Matching versioned, explainable, and auditable. Connectivity opportunity boleh membantu membuka peluang, tetapi tidak boleh mengungkapkan inclusion status.

Forbidden:

- menganalisis message content untuk sentiment, mental state, atau diagnosis;
- menampilkan inclusion signal kepada student, teammate, atau recruiter;
- memakai inclusion atau connectivity sebagai leaderboard input;
- membuat adverse decision atau counseling escalation otomatis;
- menyatakan correlation sebagai diagnosis.

Real-data inclusion activation membutuhkan DPIA, lawful basis, retention, notice, access control review, fairness test, feature flag approval, dan human review procedure. Synthetic demo tidak melewati gate menjadi real processing.

## 7. Gamification Integrity

XP hanya dari approved contribution dengan idempotent source. Reversal tidak menghapus ledger history. Badge rule version disimpan dan perubahan rule tidak menulis ulang award history. Badge evaluation hanya memakai approved contribution dan approved review, tidak membaca message, private evidence, inclusion signal, atau connectivity opportunity. Award memiliki idempotency key per user, institution, definition, dan rule version. Source explanation hanya memuat reference contribution, version, dan safe label.

Badge taxonomy dikelola melalui definition immutable dan rule version yang hanya dapat dibuat oleh platform admin. Automatic issuance memakai active rule, sedangkan manual issuance dan revocation memerlukan campus reviewer pada institution yang sama dengan reason yang diaudit. Revocation memiliki history append-only dan tidak menghapus award.

Cohort di bawah lima disuppress. Individual ranking default off. Anti-abuse review mencakup duplicate evidence, repeated submission, collusion, inactive member manipulation, dan unauthorized reviewer.

XP award memverifikasi status contribution, approved review, dan konsistensi
institution dengan project sebelum menulis ledger. Unique idempotency key
mencegah retry atau concurrent event menggandakan award. Consumer approval
berjalan setelah commit dan retryable melalui queue. Ledger update/delete
ditolak pada model serta database layer, sementara reversal memakai row baru
dan audit reason code.

Leaderboard projection hanya mengagregasi verified XP dari approved contribution
source dalam institution dan semester yang sama. Active member harus memiliki
verified membership, active roster row, dan verified contribution. Program dan
team projection disuppress saat cohort kurang dari lima. Individual projection
default off dan hanya membaca preference opt-in student pada tenant yang sama.
Snapshot digest, unique job key, dan append-only projection rows menjaga rebuild
tetap deterministic dan idempotent. Evaluasi tidak membaca message, evidence
privat, inclusion signal, atau connectivity opportunity.

## 8. Talent Boundary

Recruiter membutuhkan verified organization, membership, dan active entitlement. Search membaca allowlisted projection. Username, NIM, phone, private evidence, discussion, raw audit, matching input, dan inclusion data dilarang.

Contact request tidak langsung membuka phone. Student accept menjadi explicit consented handoff. Visibility withdrawal menghentikan projection baru. Entitlement expiration menolak search/action baru.

## 9. Provider dan File Security

Fonnte dan academic provider token disimpan sebagai server secret. HTTP request memakai timeout, safe retry, TLS, redacted log, idempotency, dan validated callback. No unofficial package mendapat token tanpa review.

Private attachment memakai non-public storage, randomized path, authorized download, MIME/size validation, malware strategy sebelum production, dan retention. Filename tidak dipercaya sebagai content type.

## 10. Realtime Security

Channel authorization memeriksa active membership dan resource relationship. Event payload allowlisted. Broadcast dilakukan after commit. Permission revocation, reconnect, duplicate, and stale subscription harus diuji.

## 11. Audit dan Observability

Catat privileged invitation, affiliation decision, contribution review, XP/badge mutation, leaderboard publication, inclusion review, entitlement, contact handoff, mapping, sync retry, consent, export, dan data-right outcome.

Jangan log OTP, password, token, full phone, full NIM, message content, private evidence URL, inclusion detail, atau provider raw payload. Gunakan correlation ID dan sanitized reason code.

## 12. Data Rights dan Retention

Access, correction, consent withdrawal, visibility withdrawal, restriction, dan deletion memiliki verified request flow. Append-only records dipertahankan hanya sesuai approved lawful purpose dan period. Retention matrix, WhatsApp privacy notice, DPIA, serta escalation owner adalah human governance gate.

## 13. Release Gates

### Synthetic demo

Tenant isolation, fake provider, no real phone dataset, synthetic label, secret scan, accessibility, dan truth review.

### Pilot

DPIA/lawful basis, roster agreement, retention, incident owner, Fonnte notice, backup/restore, reviewer training, dan support process.

### Production

Threat model review, penetration test plan, provider SLA/recovery, MySQL/load test, data-right drill, cross-tenant regression, and final human approval.

## 14. Repository Governance

Pull request ke `main` wajib memakai **Squash and merge**, required CI, dan resolved conversations.
Contributor non-owner memerlukan minimal satu approval. Repository owner dapat melakukan self-review dan memakai admin bypass tanpa approval reviewer tambahan setelah bukti CI dan penyelesaian conversation tercatat.
Admin bypass hanya mengubah aturan approval. Branch protection tetap melarang force push dan branch deletion, serta required checks tetap berlaku.
