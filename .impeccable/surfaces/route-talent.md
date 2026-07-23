---
version: 1
slug: 'route-talent'
primary_target: 'route:/talent'
related_targets: ['route:/talent/candidates/{user}']
---

# Talent Portal

## Job and Audience

Verified recruiter mencari kandidat berdasarkan skill dan verified contribution, lalu meminta kontak dengan persetujuan student. Mode: **Operate**.

## Outcome and Proof

Recruiter menemukan kandidat relevan, memahami provenance, menyimpan kandidat, dan mengirim contact request tanpa memperoleh data sensitif.

## Selected Direction

Mewarisi **Buku Besar Kolaborasi** sebagai verified folio index. Search result menampilkan contribution proof dan verification source; candidate detail memberi artifact ruang utama dengan compact provenance ledger.

## Scope and Boundaries

Mencakup organization verification, search/filter, candidate detail, saved list, contact request, response status, dan entitlement. Tidak mencakup raw evidence privat, inclusion signal, private messages, alamat langsung, atau hidden scoring.

## States and Ranges

- Organization pending/rejected/verified.
- Subscription inactive/limited/active.
- No candidates, no filter results, candidate visibility withdrawn.
- Contact pending/accepted/declined/expired.
- Large candidate result paginated.

## Interaction and Layout

Filter state dapat dibagikan sesuai entitlement. Verification level dan evidence source terlihat. Contact action menjelaskan bahwa student memilih respons. Withdrawn visibility segera menghilangkan candidate dari search baru.

## Constraints and Open Decisions

Fase lanjutan. Pricing, entitlement, organization verification, dan data retention harus divalidasi. Tidak ada capability ini yang diklaim tersedia pada increment pertama.
