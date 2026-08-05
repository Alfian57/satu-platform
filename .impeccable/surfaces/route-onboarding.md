---
version: 2
slug: 'route-onboarding'
primary_target: 'route:/onboarding'
related_targets: ['route:/register', 'route:/notifications']
---

# Student Onboarding, Affiliation, Profile, and Skills

## Job and Audience

Student baru ingin mengaktifkan account, membuktikan afiliasi kampus, dan memberi cukup informasi untuk recommendation tanpa merasa dinilai secara psikologis. Mode: **Operate**.

## Outcome and Proof

Student memahami perbedaan phone verified, account active, dan affiliation verified. Mereka menyelesaikan institution, NIM, profile minimum, skills, availability, consent, notification preference, dan portfolio visibility.

## Selected Direction

Enrollment ledger progresif dalam visual world **Buku Besar Kolaborasi**. Setiap section memiliki status, akibat, dan next action. Bukan decorative wizard dan tidak memakai progress palsu.

## Scope and Boundaries

Mencakup handoff setelah phone verification, roster match, manual review recovery, profile, skills, availability, consent, notification preference, dan visibility. Tidak meminta email, mental-health questionnaire, popularity, atau recruiter data yang belum diperlukan.

## States and Ranges

- Roster: exact match, pending review, ambiguous, roster unavailable, revision, reject, verified.
- Profile: empty, partial, valid, duplicate skill, custom skill proposal.
- Save: idle, processing, saved, network error, stale session, forbidden after affiliation permission loss.
- 0 sampai 30 skills dan 0 sampai 5 evidence items per skill.

## Interaction and Layout

Section index dapat diklik untuk item yang tersedia dan menunjukkan blocker. Data tersimpan per section. Privacy explanation berada dekat toggle. Mobile single column, desktop boleh menampilkan summary rail. Primary action selalu menyebut akibat berikutnya.

## Recovery and Accessibility

Status roster tidak bergantung pada warna. Focus dipindah ke section error setelah submit, termasuk ketika validation gagal berulang kali. Jika permission afiliasi berubah, halaman menampilkan recovery state yang dapat difokuskan dan menjelaskan bahwa request tidak diproses. Pending result memakai status semantics tanpa polling noise. Semua informasi phone dimasking setelah verification.

## Constraints and Gates

Roster format, active-member definition, dan manual-review SLA ditentukan melalui governance issue. Campus admin/recruiter role tidak tersedia melalui registrasi publik.

## Loading Contract

Loading mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md).
Gunakan section-level skeleton tanpa menghapus progress atau next action yang
sudah tersedia. Save dan affiliation submit mempertahankan content dengan inline
processing status.
