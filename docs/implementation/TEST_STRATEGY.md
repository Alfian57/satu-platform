# Test Strategy SATU

## 1. Objectives

Membuktikan correctness, tenant isolation, privacy projection, idempotency, accessibility, realtime recovery, provider degradation, dan truthful synthetic behavior. Setiap runtime issue menambah atau memperbarui programmatic test.

## 2. Layers

- Pest feature tests sebagai default untuk route, Action, Policy, Job, Notification, dan integration boundary.
- Unit tests untuk score, ranking, normalization, policy version, dan pure calculation.
- Browser tests untuk critical JavaScript flow, realtime/reconnect, keyboard, accessibility, dan responsive state.
- Architecture/static tests untuk forbidden dependencies, serialization boundary, dan tenant conventions.

Jalankan narrowest affected tests terlebih dahulu. PHP change diakhiri `vendor/bin/pint --dirty --format agent`. Frontend change menjalankan lint dan typecheck yang relevan. Production build pada CI atau saat pengguna memintanya. Local `npm run build` hanya jika diminta atau diperlukan untuk diagnosis Vite.

## 3. Test Data

- Factory memakai explicit institution and role state.
- Negative fixture selalu mencakup second tenant.
- Phone synthetic memakai nomor dokumentasi/non-delivery dan fake gateway.
- Fonnte dan academic providers difake pada automated test.
- Synthetic demo seed diberi provenance flag dan deterministic reset.
- Tidak ada real phone, NIM, private evidence, recruiter data, atau provider token pada fixture.

## 4. Critical Suites

### Identity, WhatsApp, dan Roster

OTP expiry, purpose binding, replay, attempt/resend/rate limit, concurrent consume, account enumeration, phone normalization, username privacy, recovery, invitation privilege, roster exact match, ambiguity, duplicate rows, import rollback, manual review, suspended membership, dan cross-tenant denial.

### Projects, Matching, dan Team

Lifecycle, capacity race, Policy denial, filter URL contract, four score dimensions, score version, explanation, stale recommendation, feedback, and atomic join/invite transition.

### Workspace dan Reverb

Task/discussion/evidence authorization, private storage, same-team subscription, other-team/tenant denial, after-commit event, duplicate/out-of-order delta, disconnect, reconnect, reconciliation, dan permission revocation.

### Contribution dan Portfolio

Immutable version, direct campus decision, reason requirement, revision, idempotent projection, visibility, withdrawal, public/recruiter allowlist, private evidence denial, dan notification provenance.

### Gamification

Verified-only XP, duplicate source prevention, reversal history, badge rule version, semester boundary, active-member denominator, cohort suppression under five, shared tie rank, individual opt-in/withdrawal, and proof that inclusion fields never affect ranking.

### Campus dan Inclusion

Queue scoping, participation denominator, feature disabled, synthetic-only, real-data gate, graph projection without message content, restricted serialization, human review history, fairness fixture, and student/recruiter denial.

### Talent

Organization verification, membership, entitlement active/expired/revoked, Scout safe projection, withdrawn candidate, saved uniqueness, contact lifecycle, consented phone handoff, cross-organization denial, and forbidden-field serialization.

### Academic Integration

Mapping version, duplicate mapping, sandbox scenarios, idempotent sync, retry/backoff, timeout, validation error, external duplicate, reconciliation, encrypted config, and cross-tenant job denial.

### Notification

Canonical in-app record, preference, mandatory security purpose, outbox idempotency, Fonnte fake, callback validation, masked log, failure/retry, and deep-link authorization.

## 5. Browser Scenarios

1. Register with OTP, roster exact match, profile minimum, dashboard.
2. OTP delivery failure and recovery.
3. Roster mismatch to campus manual review.
4. Recommendation to active team.
5. Two-client workspace with reconnect.
6. Contribution revision to approval and XP/badge update.
7. Leaderboard opt-in, tie, suppressed cohort, and reduced motion.
8. Campus inclusion feature-disabled and synthetic review.
9. Recruiter search/contact followed by student accept/decline.
10. Academic sandbox timeout, retry, and reconciliation.
11. Landing synthetic graph keyboard equivalent.

## 6. Accessibility

Automated axe through `@axe-core/playwright` supplements manual keyboard, screen reader, zoom/reflow, contrast, focus, reduced motion, table/chart alternative, and status announcement review. Automated pass does not replace human audit.

## 7. Performance dan Reliability

Measure realistic per-tenant volume, query count, N+1, pagination, search latency, leaderboard projection time, graph size, queue age, Reverb fan-out, roster memory, sync retry, and landing asset budget. Define threshold in owning issue before test implementation.

## 8. CI Order

1. dependency and environment validation;
2. formatting and static analysis;
3. frontend lint/typecheck;
4. focused unit/feature suites;
5. full Pest suite;
6. browser/accessibility suites where configured;
7. production build in CI;
8. documentation link and formatting checks.

Required branch check memakai actual GitHub Actions check name from `.github/workflows/tests.yml`.

`CLAUDE.md` hanya menunjuk ke file tersebut sebagai konteks legacy; `AGENTS.md` tetap menjadi sumber aturan agent.

## 9. Documentation-only Verification

- Prettier pada changed Markdown/YAML.
- Internal Markdown link review.
- Surface brief path resolution.
- Required issue-section audit.
- Search untuk Unicode em dash serta retired phase/progress references.
- `git diff --check`.
