# Security, Privacy, dan Responsible Matching SATU

## 1. Status dan Disclaimer

Dokumen ini adalah engineering dan product control plan, bukan legal opinion atau bukti kepatuhan.

Sumber regulasi utama:

- [Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi](https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022%20)
- [Peraturan Pemerintah Nomor 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik](https://peraturan.bpk.go.id/Details/122030/pp-no-71-tahun-2019)

UU PDP menyebut scoring, systematic monitoring, matching, teknologi baru, dan keputusan otomatis berdampak signifikan sebagai contoh pemrosesan berisiko tinggi. SATU membutuhkan Data Protection Impact Assessment sebelum inclusion signal dipakai pada data pengguna nyata.

## 2. Security Objectives

- Confidentiality: data hanya terlihat oleh audience dan role yang tepat.
- Integrity: contribution, validation, score version, dan audit tidak dapat diubah diam-diam.
- Availability: core work dapat pulih dari queue/Reverb failure.
- Tenant isolation: institution tidak dapat membaca atau memengaruhi institution lain.
- Explainability: recommendation dan restricted signal dapat ditelusuri.
- User agency: visibility dan consent memiliki control nyata.

## 3. Threat Model

| Threat              | Example                                      | Primary controls                                         |
| ------------------- | -------------------------------------------- | -------------------------------------------------------- |
| Cross-tenant access | Admin kampus A membuka project kampus B      | Institution scope, policies, indistinguishable not-found |
| Role escalation     | Student mengirim role `campus_admin`         | Server-owned role assignment, protected actions          |
| IDOR                | Mengganti contribution id di URL             | Route binding + policy + tenant match                    |
| Broadcast leakage   | Subscribe ke project lain                    | Private/presence channel authorization                   |
| File exposure       | Menebak storage path                         | Private disk, authorized short-lived download            |
| Mass assignment     | Mengubah verification/status                 | Fillable whitelist, validated action                     |
| Stored XSS          | Message/evidence description berisi script   | Escaped rendering, sanitization where rich text exists   |
| Abuse/spam          | Invitation atau message flood                | Rate limit, quotas, moderation/audit                     |
| Score manipulation  | Spam interaction untuk connectivity          | Event quality rules, anomaly review, versioning          |
| Insider misuse      | Admin membuka restricted signal tanpa alasan | Least privilege, access audit, monitoring                |
| Secret leakage      | Credential masuk log/repo                    | Config indirection, encryption, redaction                |

## 4. Authorization Model

### Roles

- `student`
- `campus_admin`
- `recruiter`
- `platform_admin`

Role selalu dievaluasi bersama resource relationship, institution, membership status, dan action. Role saja tidak cukup.

### Access matrix

| Data/action           | Student owner                | Team member  | Campus admin          | Recruiter                 | Platform admin             |
| --------------------- | ---------------------------- | ------------ | --------------------- | ------------------------- | -------------------------- |
| Own profile           | Manage                       | Limited view | Institution-safe view | Consent-based view        | Support-limited            |
| Project workspace     | If member                    | If member    | Oversight by policy   | No                        | Support-limited            |
| Contribution evidence | Own/manage                   | Project-safe | Review by policy      | Published projection only | Support-limited            |
| Inclusion signal      | No raw access                | No           | Restricted reviewer   | Never                     | Exceptional audited access |
| Audit log             | Own action subset if exposed | No           | Institution subset    | Organization subset       | Platform scope             |
| Recruiter contact     | Decide                       | No           | No                    | Create/view own           | Support-limited            |

Platform admin tidak otomatis berarti unrestricted UI. Break-glass access, bila diperlukan, harus memiliki reason dan audit.

## 5. Authentication dan Account Security

- Fortify session auth.
- Email verification sebelum collaboration.
- Rate limit login, recovery, invitation, contact, dan sensitive exports.
- Password hashing mengikuti Laravel configuration.
- Password confirmation untuk sensitive settings.
- 2FA/passkeys dapat ditambahkan berdasarkan risk dan readiness; tidak diklaim aktif hanya karena migration/vendor support tersedia.
- Session invalidation setelah password/security change.
- Campus admin dan recruiter provisioning membutuhkan controlled workflow.

## 6. Tenant Isolation

- Setiap tenant-owned resource memiliki institution ownership yang tidak ambigu.
- Policy memeriksa active/verified membership sesuai action.
- Request tidak menerima `institution_id` sebagai authority tanpa memeriksa object dan membership.
- Queue job menyimpan tenant identifier dan melakukan re-authorization/reload.
- Cache key, lock key, export path, dan storage path memasukkan tenant context.
- Reverb channel authorization melakukan query tenant-scoped.
- Automated test mencoba akses silang untuk setiap resource family.

## 7. Privacy by Purpose

| Purpose          | Data minimum                                         | Audience                        | Stop condition                   |
| ---------------- | ---------------------------------------------------- | ------------------------------- | -------------------------------- |
| Collaboration    | Profile, skill, availability, project activity       | Student/team/campus sesuai role | Account/project lifecycle        |
| Validation       | Task, contribution, evidence, reviewer decision      | Student dan reviewer            | Retention policy                 |
| Matching         | Skill, needs, availability, graph metadata           | Student dan matching operators  | Recommendation expiry/withdrawal |
| Inclusion review | Aggregated graph factors, recent opportunity context | Restricted campus reviewers     | Signal expiry/policy             |
| Talent discovery | Explicit portfolio projection                        | Verified recruiter              | Visibility withdrawal            |

Data yang dikumpulkan untuk inclusion tidak otomatis boleh dipakai recruiter atau marketing.

## 8. Responsible Matching

### Required controls

- Versioned formula/config.
- Documented input fields dan purpose.
- Minimum data threshold.
- Component score distribution monitoring.
- Human-readable explanation.
- Feedback dan correction path.
- Offline evaluation sebelum activation.
- Rollback ke version sebelumnya.

### Forbidden

- Mental-health diagnosis.
- Sentiment analysis message untuk risk scoring.
- Protected/sensitive attribute sebagai direct ranking factor tanpa lawful, reviewed purpose.
- Automatic rejection atau punishment berdasarkan connectivity.
- Recruiter access ke connectivity/inclusion score.
- Dark pattern yang memaksa student menerima recommendation.

## 9. Inclusion Signal Governance

Inclusion signal hanya aktif setelah:

1. DPIA disetujui.
2. Lawful basis dan notice ditetapkan.
3. Minimum sample dan data window disetujui.
4. Reviewer role serta training ditetapkan.
5. UI usability memastikan signal tidak ditafsirkan sebagai diagnosis.
6. Fairness dan false-positive evaluation lulus.
7. Retention dan deletion schedule ditetapkan.
8. Incident/escalation process tersedia.

Student menerima ordinary opportunity atau support, bukan risk label.

## 10. File dan Content Security

- Evidence private by default.
- Validate MIME, extension, size, checksum, and upload ownership.
- Generate storage name; jangan percaya filename client.
- Serve melalui authorized response atau expiring signed mechanism.
- Virus/content scanning menjadi gate sesuai file risk.
- Rich text, bila ditambahkan, memakai allowlist sanitizer.
- External links mendapat safe target behavior dan indication.

## 11. Reverb Security

- Allowed origins eksplisit.
- TLS/WSS pada production.
- Private/presence channel untuk non-public event.
- Channel authorization menggunakan policy-equivalent checks.
- Event payload minimal dan versioned.
- Connection/message metrics tidak mencatat content sensitif.
- Reverb secret tidak masuk frontend bundle atau log.
- Restart dan process manager memastikan long-running server diperbarui setelah deploy.

## 12. Logging dan Audit

### Application logs

- Correlation id, operation, safe actor/institution id, error class.
- Tidak mencatat password, token, consent payload penuh, message body, evidence content, atau sensitive score factors.

### Domain audit

Wajib untuk:

- Role/membership change.
- Verification decision.
- Project member removal.
- Contribution validation.
- Visibility/consent change.
- Inclusion review.
- Recruiter organization verification.
- Sensitive export/deletion.
- Integration sync decision.

Audit entry append-only dan memiliki actor, action, object, time, reason, serta safe context.

## 13. Data Subject Operations

Sebelum pilot tersedia process untuk:

- Access dan export.
- Correction.
- Consent withdrawal.
- Recruiter visibility withdrawal.
- Deletion/anonymization request.
- Complaint dan contact.
- Breach notification sesuai legal process.

Authentication ulang diperlukan untuk export atau deletion sensitif. Export link memiliki expiry dan tidak dikirim sebagai attachment email biasa.

## 14. Incident Readiness

- Severity dan owner.
- Detection source.
- Containment steps.
- Credential/session rotation.
- Tenant/user impact assessment.
- Evidence preservation.
- Notification decision dan timeline.
- Post-incident corrective action.

Backup dan restore diuji; backup tidak dianggap berhasil hanya karena file dibuat.

## 15. Security Release Gates

### Demo

- No real sensitive data.
- Synthetic label.
- Basic policies, private storage, authorized Reverb.

### Pilot

- Threat model reviewed.
- DPIA/open legal gates closed.
- Tenant isolation tests.
- Retention and data rights workflow.
- Monitoring and incident process.
- Security review of file upload, auth, broadcast, and admin access.

### Production

- Dependency audits.
- Recovery drill.
- Permission/access review.
- Reverb and queue capacity plan.
- External penetration/security assessment proportional to risk.
