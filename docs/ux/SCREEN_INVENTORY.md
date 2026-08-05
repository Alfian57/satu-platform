# Screen Inventory SATU

## Inventory

| Surface                   | Audience          | Mode     | Surface brief                                       | Status target                                     |
| ------------------------- | ----------------- | -------- | --------------------------------------------------- | ------------------------------------------------- |
| Landing                   | Public            | Persuade | `.impeccable/surfaces/route.md`                     | Release                                           |
| Register, login, recovery | Student           | Operate  | `.impeccable/surfaces/route-login.md`               | Release                                           |
| Onboarding                | Student           | Operate  | `.impeccable/surfaces/route-onboarding.md`          | Release                                           |
| Notification center       | Authenticated     | Operate  | `.impeccable/surfaces/route-notifications.md`       | Release                                           |
| Dashboard                 | Role-aware        | Operate  | dashboard brief dan LOADING_STATES.md               | Reference tersedia, role/data integration planned |
| Project discovery/detail  | Student           | Operate  | `.impeccable/surfaces/route-projects.md`            | Release                                           |
| Workspace                 | Team              | Operate  | `.impeccable/surfaces/route-projects-workspace.md`  | Release                                           |
| Contribution/portfolio    | Student           | Operate  | `.impeccable/surfaces/route-contributions.md`       | Release                                           |
| Leaderboard               | Student/campus    | Operate  | `.impeccable/surfaces/route-leaderboards.md`        | Release                                           |
| Campus operations         | Campus            | Operate  | `.impeccable/surfaces/route-campus.md`              | Release                                           |
| Inclusion review          | Authorized campus | Operate  | `.impeccable/surfaces/route-campus-inclusion.md`    | Gated                                             |
| Academic operations       | Campus            | Operate  | `.impeccable/surfaces/route-campus-integrations.md` | Sandbox release                                   |
| Platform operations       | Platform admin    | Operate  | `.impeccable/surfaces/route-platform.md`            | Release                                           |
| Talent Portal             | Recruiter/student | Operate  | `.impeccable/surfaces/route-talent.md`              | Release                                           |

## Shared State Matrix

Setiap surface harus memilih state yang relevan dari: empty, loading, processing, success, validation error, network error, unauthorized, forbidden, stale, reconnecting, offline, partial data, overflow, destructive confirmation, expired, withdrawn, dan synthetic.

Untuk state loading, surface memakai skeleton per region sesuai
[LOADING_STATES.md](./LOADING_STATES.md). Full-page skeleton hanya boleh
digunakan bila struktur page belum diketahui dan tidak ada primary action yang
siap digunakan.

## Surface Acceptance

- Auth: OTP tidak membocorkan account existence; timer, resend, lockout, dan recovery accessible.
- Onboarding: affiliation outcome dan manual-review recovery dipahami.
- Project: filter, explanation, capacity, dan permission state jelas.
- Workspace: keyboard-equivalent commands dan reconnect reconciliation tersedia.
- Contribution: version, evidence, reviewer reason, dan provenance terbaca.
- Leaderboard: period, denominator, cohort rule, opt-in, tie, dan calculation explanation terlihat.
- Campus/platform: queue dapat dipindai dan action memiliki reason serta audit consequence.
- Inclusion: restricted, non-diagnostic, human review, feature disabled, dan synthetic state terlihat.
- Talent: entitlement dan visibility boundary terlihat sebelum search/contact.
- Landing: synthetic demo berlabel, motion dapat dikurangi, dan tidak ada invented evidence.

## Build Priority

Urutan delivery ditentukan milestone GitHub M0 sampai M9. UI issue tidak boleh dimulai sebelum surface brief dan backend contract yang menjadi dependency tersedia.
