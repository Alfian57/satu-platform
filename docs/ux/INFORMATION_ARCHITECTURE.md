# Information Architecture SATU

## Object Hierarchy

```text
Account
├── Phone verification dan security
├── Institution membership
├── Student profile dan skills
└── Notification preferences

Institution
├── Roster dan affiliation reviews
├── Projects dan teams
├── Contribution reviews
├── Gamification projections
├── Inclusion reviews
└── Academic integrations

Recruiter organization
├── Verified memberships
├── Entitlement
├── Saved candidates
└── Contact requests
```

## Student Navigation

- Beranda
- Temukan Proyek
- Proyek Saya
- Kontribusi
- Portfolio
- Peringkat
- Notifikasi
- Profil dan Pengaturan

## Campus Navigation

- Ringkasan
- Roster dan Afiliasi
- Validasi Kontribusi
- Partisipasi
- Review Inklusi, hanya jika authorized dan feature aktif
- Pemetaan Kredit
- Sinkronisasi

## Platform Navigation

- Institution
- Undangan Campus Admin
- Recruiter Organization
- Entitlement
- Provider Operations
- Audit

## Recruiter Navigation

- Cari Talenta
- Kandidat Tersimpan
- Permintaan Kontak
- Organization dan Entitlement

## Conceptual Route Map

```text
/
/register
/login
/recover
/onboarding
/notifications
/dashboard
/projects
/projects/{project}
/projects/{project}/workspace
/contributions
/portfolio
/leaderboards
/campus
/campus/affiliations
/campus/contributions
/campus/inclusion
/campus/integrations
/platform
/talent
/talent/candidates/{candidate}
/talent/saved
/talent/contacts
```

Route aktual harus named Laravel routes dan dipakai frontend melalui Wayfinder. Navigation item tersembunyi tidak menggantikan server-side authorization.

## Composition

- Dashboard: satu next action utama, status strip, dan supporting ledger.
- Index: filter URL-addressable, result count, table/list yang responsif, empty state yang dapat dipulihkan.
- Detail: identity, provenance, primary action, history.
- Queue: dense scan, explicit selection, reasoned command, preserved context.
- Operations: status, lag, failure, retry, audit.

Pada mobile, task dan primary status mendahului metadata. Pada desktop, rail tambahan boleh menampilkan provenance atau queue summary. Tidak ada critical action yang hanya tersedia melalui hover atau drag.
