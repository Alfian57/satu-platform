# Information Architecture SATU

## Role Aktif

Sejak 17 Oktober 2026 hanya Mahasiswa (`student`) dan Admin Universitas UTY
(`campus_admin`). Tidak ada workspace, navigasi atau endpoint perekrut maupun
admin platform terpisah. Data organisasi lama pada hierarki hanya arsip, bukan
role aktif. Pending, verified dan suspended adalah status akses.

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

Arsip organisasi lama (bukan role atau akses aktif)
├── Verified memberships
├── Entitlement
├── Saved candidates
└── Contact requests
```

## Student Navigation

- Beranda
- Proyek (Peluang dan Proyek saya)
- Kontribusi
- Portofolio
- Fitur lanjutan: Peringkat
- Notifikasi
- Profil dan Pengaturan

## Navigasi Admin Universitas U05

- Ringkasan
- Mahasiswa (daftar afiliasi dan pintasan peninjauan)
- Roster mahasiswa
- Validasi kontribusi
- Bantuan kesempatan (tetap mengikuti izin dan gate)
- Pengaturan: Profil universitas, Semester, Katalog keahlian, Akun admin

Profil universitas menampilkan konfigurasi server tanpa pergantian institusi.
Semester mengikuti sumber roster; impor baru tidak mengubah semester riwayat.
Pengaturan akun pribadi berada pada menu akun, terpisah dari pengaturan universitas.
Jalur platform lama bukan ruang admin kedua. Modul lanjutan tetap terpisah.

## Campus Navigation Lama

- Ringkasan
- Roster dan Afiliasi
- Validasi Kontribusi
- Partisipasi
- Review Inklusi, hanya jika authorized dan feature aktif
- Pemetaan Kredit
- Sinkronisasi

## Platform Navigation Lama

U05 tidak menampilkan ruang platform kedua. GET platform/afiliasi lama
mengalihkan admin UTY setelah otorisasi; persetujuan institusi baru ditutup.
Katalog legacy tetap endpoint kompatibilitas, ditampilkan dalam Pengaturan.

- Operasi platform, dengan region Institusi, Undangan Campus Admin, Recruiter Organization, Entitlement, Provider Operations, dan Audit
- Afiliasi kampus
- Taksonomi skill

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
/campus/{institution}/overview
/campus/{institution}/affiliations
/campus/{institution}/contributions
/campus/{institution}/inclusion
/campus/{institution}/credit-mappings
/campus/{institution}/integrations
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
