---
version: 1
slug: 'route-p-publicidentifier'
primary_target: 'route:/p/{publicIdentifier}'
related_targets: ['route:/portfolio', 'route:/contributions']
---

# Public Portfolio Projection

## Job and Audience

Pengunjung yang menerima tautan portfolio ingin memahami karya mahasiswa dan
tingkat verifikasinya tanpa login. Mode surface: **Experience**. Pemilik
portfolio mengharapkan tautan yang dapat dibagikan dan dapat ditarik kembali.

## Outcome and Proof

Pengunjung dapat membaca display name, program studi, bio, dan entry yang
secara eksplisit publik. Setiap entry menampilkan judul, ringkasan, waktu
terbit, dan verification level. Sumber ditampilkan sebagai contribution yang
disetujui tanpa membuka source ID, evidence, review note, audit, atau data
recruiter.

## Selected Direction

**Public ledger:** identitas dan satu entry unggulan membentuk pembuka, lalu
entry publik berikutnya mengalir sebagai ruled ledger rows. Provenance menjadi
stamp tekstual yang selalu berdekatan dengan karya. Unavailable state memakai
ruled notice yang menjelaskan akibat opt-out tanpa menampilkan profil privat.

## Scope and Boundaries

Route `/p/{publicIdentifier}` hanya membaca profile dan institution aktif serta
entry yang approved-current, visibility `public`, dan belum withdrawn. Tidak
ada login shell, recruiter search, contact flow, raw evidence, username,
phone, NIM, inclusion signal, atau audit. Public profile memakai `index,follow`;
unavailable profile memakai `noindex,nofollow` dan status revoked.

## States and Ranges

- Published: 1 entry unggulan dan 0-99 entry tambahan.
- Unavailable: identifier tidak lagi aktif, profile opt-out, atau tidak ada
  entry publik.
- Verification: self-reported, team-confirmed, institution-verified.
- Long title, long summary, 320px reflow, keyboard focus, reduced motion, dan
  no horizontal overflow wajib diperiksa.

## Interaction and Layout

Desktop memakai identity rail ringan dan working ledger dominan. Mobile
menyusun identity, entry unggulan, lalu ledger dan provenance secara vertikal.
Tidak ada interaksi yang membutuhkan akun. Link home dan copy unavailable
memberi recovery yang aman. Head metadata dan `X-Robots-Tag` mengikuti state.

## Constraints and Open Decisions

Identifier acak stabil dibuat server-side dan tidak menjadi authorization proof.
Projection dibangun melalui serializer allowlist dan query tenant-scoped.
Public page tidak memakai shared authenticated props. Tidak ada open decision
yang boleh menunda issue ini; indexing aktif hanya setelah opt-in public.
