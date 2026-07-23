# Test Strategy SATU

## 1. Objectives

Pengujian membuktikan:

- User dapat menyelesaikan critical job.
- Tenant dan permission boundary tidak bocor.
- Matching dapat direproduksi serta dijelaskan.
- Realtime memperbarui UI tanpa menjadi source of truth.
- Contribution provenance tidak dapat dipalsukan melalui request.
- Restricted inclusion data tidak masuk recruiter/student surface.
- UI memenuhi state, responsive, dan accessibility contract.

Project memakai Pest 4. Feature tests menjadi default; unit tests dipakai untuk pure domain calculation; browser tests untuk critical UI.

## 2. Test Layers

| Layer          | Purpose                                  | Examples                               |
| -------------- | ---------------------------------------- | -------------------------------------- |
| Unit           | Pure calculation/value behavior          | Matching components, status transition |
| Feature        | HTTP + database + policy                 | Project join, contribution review      |
| Integration    | Queue, storage, mail, broadcast contract | Recompute, private download            |
| Browser        | Real user flow dan JS behavior           | Onboarding, workspace, admin review    |
| Architecture   | Enforce boundaries/conventions           | Policies/actions/enums                 |
| Non-functional | Security, performance, accessibility     | Tenant leakage, query count            |

## 3. Test Data Strategy

- Gunakan factories untuk semua domain model.
- Factory states: unverified/verified membership, open/full project, active team, pending/approved contribution, restricted signal.
- Recycle shared institution agar test tenant relationship benar.
- Dataset untuk role, status transition, validation rule, dan scoring boundary.
- Synthetic names/content tidak menyerupai user nyata.
- Event fake dipanggil setelah factory setup bila factory bergantung pada events.

## 4. Critical Feature Suites

### Identity and tenancy

- Open registration tidak menerima privileged role.
- Email verification gate.
- Approved domain dan manual approval.
- Suspended/unverified membership restrictions.
- Cross-tenant read/write/update/delete denial untuk setiap resource family.
- Institution context tidak dapat dipalsukan dari request.

### Projects and teams

- Project lifecycle authorization.
- Required role/skill validation.
- Invitation/request transitions.
- Capacity race/atomicity.
- Removed member kehilangan workspace dan channel access.

### Matching

- Component normalization dan deterministic total.
- Score version tersimpan.
- Explanation sesuai strongest safe components.
- Insufficient data menghasilkan no/limited recommendation.
- No message content atau restricted field masuk input.
- Feedback tidak mengubah active weights otomatis.
- Dataset memeriksa boundary dan ordering.

### Workspace and Reverb

- Command persists before broadcast.
- Event channel dan payload benar.
- Unauthorized channel subscription ditolak.
- Broadcast failure tidak membatalkan database state.
- Duplicate/stale version diabaikan client.
- Reconnect partial reload menghasilkan canonical state.
- Attachment upload/download authorization.

### Contributions

- Student hanya submit untuk dirinya dan allowed task.
- Version immutable setelah submit.
- Reviewer role/institution policy.
- Approve/revision/reject append history.
- Verified portfolio tidak dapat dibuat dari unapproved contribution.
- Visibility projection hanya menampilkan allowed fields.

### Campus operations

- Queue scoped dan ordered.
- Filter/pagination stabil.
- Concurrent review menghasilkan safe conflict.
- Audit fields lengkap.
- Bulk action tidak tersedia untuk sensitive decision.

### Inclusion

- Feature disabled sebelum gate/config.
- Minimum sample.
- Versioned factors.
- Student/recruiter routes/props/serialization tidak memuat signal.
- Human outcome dan reason wajib.
- Expired/dismissed behavior.

### Recruiter: Later

- Organization verification dan entitlement.
- Search projection allowlist.
- Visibility withdrawal.
- Contact request state dan rate limit.
- No direct email exposure sebelum acceptance.

## 5. Browser Scenarios

### Student activation

1. Register.
2. Verify email.
3. Request institution.
4. Complete profile/skills.
5. Reach dashboard.

Assertions:

- No JavaScript errors atau unexpected console logs.
- Keyboard-only completion.
- Form errors associated.
- Pending affiliation copy benar.

### Match to team

1. Open recommendation.
2. Read explanation.
3. Request/accept role.
4. Enter workspace.

Assertions:

- Explanation visible.
- Sensitive reason absent.
- Capacity and status update.

### Two-client workspace

1. Client A dan B join authorized project.
2. A updates task.
3. B receives Reverb event.
4. Disconnect/reconnect B.

Assertions:

- No duplicate.
- Focus tetap.
- Canonical state setelah reconnect.

### Contribution review

1. Student submits evidence.
2. Admin requests revision.
3. Student resubmits.
4. Admin approves.
5. Student publishes portfolio entry.

Assertions:

- History retained.
- Provenance visible.
- Unauthorized user cannot download evidence.

### Campus queue

- Filter, open review, keyboard decision, next item, and audit.
- Mobile single-item review.

### Reference dashboard harness

- Preview state P06 memakai query client-only `?state=`; nilai valid:
  `revision`, `first-run`, `empty`, `loading`, `long-content`,
  `partial-permission`, `error`, dan `stale`.
- Browser suite berada di `tests/Browser/DashboardStatesBrowserTest.php` dan
  berjalan di Chromium melalui `php artisan test --compact
tests/Browser/DashboardStatesBrowserTest.php`.
- Suite mengunci no-overflow pada 320×800, 768×1024, 1366×768, dan 1672×941;
  mobile reading order; small-laptop first viewport; keyboard activation; dark
  mode; state recovery; JavaScript/console cleanliness; dan serious
  accessibility issues.
- Screenshot browser hanya artefak inspeksi P06 dan di-ignore. Screenshot
  approval yang durable dimiliki P07.

## 6. Accessibility Tests

Automated tests membantu tetapi tidak menggantikan manual review.

- Semantic roles/names.
- Contrast where tooling supports.
- Keyboard focus sequence.
- Dialog focus trap/return.
- Error association.
- Target size.
- Reduced motion.
- 200% zoom.
- Realtime live-region noise.
- Drag alternative.

Browser smoke menguji desktop dan representative mobile viewport.

## 7. Performance and Query Tests

- Query-count assertions untuk index/detail/dashboard yang berisiko N+1.
- Large admin queue menggunakan pagination.
- Explain query plan pada high-volume filters sebelum pilot.
- Matching job duration pada realistic dataset.
- Reverb payload size dan message rate.
- File upload size/time limits.

Performance budget exact ditetapkan setelah representative data tersedia; jangan mengarang angka produksi.

## 8. Security Tests

- IDOR dan route binding.
- Mass assignment protected fields.
- CSRF/session behavior.
- Auth/login/contact/upload rate limits.
- File MIME/extension/size.
- Stored XSS payload rendering.
- Cache/lock key tenant context.
- Export authorization dan expiry.
- Broadcast origin/channel authorization.
- Recruiter serialization snapshot/allowlist.

Run dependency audit pada release workflow setelah package set berubah.

## 9. Architecture Tests

Pest architecture rules dapat menegakkan:

- Controllers berakhir dengan `Controller`.
- Policies berada pada namespace yang sesuai.
- Domain status menggunakan enum, bukan string tersebar.
- Actions tidak bergantung pada React/HTTP concerns.
- Jobs yang mengakses tenant data memiliki tenant identifier contract.
- Restricted inclusion namespace tidak dipakai Talent Portal.

Rules hanya ditambahkan untuk boundary yang nyata, bukan style preference spekulatif.

## 10. CI Order

1. Formatting/lint/static analysis.
2. Unit and feature tests.
3. Architecture tests.
4. Frontend type/lint checks.
5. Browser smoke/critical flows.
6. Production build pada CI atau saat pengguna memintanya secara eksplisit.

Narrow relevant test dijalankan selama development; lint, typecheck yang relevan,
dan test terdampak cukup untuk pekerjaan biasa. Full suite dan build menjadi
release gate.

## 11. Requirement Traceability

| Requirement group | Primary tests                                          |
| ----------------- | ------------------------------------------------------ |
| FR-01/02          | Auth, membership, profile feature + onboarding browser |
| FR-03/05          | Project/team policy and capacity tests                 |
| FR-04             | Matching unit/dataset/feature tests                    |
| FR-06             | Workspace feature, Reverb, two-client browser          |
| FR-07/08          | Contribution/portfolio feature + browser               |
| FR-09             | Campus queue feature/browser/performance               |
| FR-10             | Restricted inclusion policy/serialization/fairness     |
| FR-11             | Recruiter entitlement/projection/contact               |
| FR-12             | Adapter contract, retry, idempotency                   |

## 12. Documentation-Only Change Verification

Untuk paket dokumentasi ini:

- Prettier check seluruh Markdown.
- Internal link target check.
- Mermaid fence/diagram review.
- Surface brief list dan target resolution.
- `AGENTS.md` tetap authoritative dan `CLAUDE.md` hanya menunjuk ke file tersebut.
- `git diff --check`.
- Existing `php artisan test --compact` sebagai baseline.
