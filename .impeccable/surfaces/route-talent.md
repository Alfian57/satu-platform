---
version: 2
slug: 'route-talent'
primary_target: 'route:/talent'
related_targets:
    [
        'route:/talent/candidates/{candidate}',
        'route:/talent/saved',
        'route:/talent/contacts',
    ]
---

# Talent Portal dan Student Contact Response

## Job and Audience

Verified recruiter ingin mencari kandidat dari verified evidence, menyimpan kandidat, dan meminta kontak. Student ingin mengendalikan discoverability dan setiap contact handoff. Mode: **Operate**.

## Outcome and Proof

Recruiter memahami organization state, entitlement, visibility boundary, provenance, dan contact status. Student dapat accept, decline, atau mencabut visibility tanpa inclusion atau private evidence bocor.

## Selected Direction

Verified folio index yang mewarisi **Buku Besar Kolaborasi**. Result memprioritaskan skill, contribution proof, verification source, dan availability context. Candidate detail memberi artifact ruang utama dengan compact provenance ledger.

## Scope and Boundaries

Organization verification, internal entitlement, search/filter, candidate detail, saved list, contact request, student response, visibility, expiration, dan revocation. Tidak mencakup billing, raw evidence privat, inclusion signal, private message, phone langsung sebelum acceptance, atau hidden score.

## States and Ranges

- Organization pending, rejected, verified, suspended.
- Entitlement inactive, scheduled, active, expired, revoked.
- Empty index, no filter result, large paginated result, visibility withdrawn.
- Contact pending, accepted, declined, expired, canceled.

## Interaction and Layout

Filter URL-addressable dan dapat dibagikan hanya kepada entitled member. Verification dan source terlihat. Save memberikan optimistic feedback dengan rollback. Contact panel menjelaskan data yang akan dibagikan dan bahwa student memilih respons. Withdrawn candidate hilang dari search baru dan detail berubah menjadi unavailable state.

## Accessibility

Result list memiliki table/list semantics, active filters dapat dihapus dengan keyboard, dan status contact diumumkan tanpa modal trap. Dense metadata tetap reflow pada mobile.

## Constraints and Gates

Recruiter verification, entitlement issuance, retention, dan contact policy memerlukan governance approval. Tidak ada price atau customer claim.

## Loading Contract

Loading mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md).
Search result, saved list, candidate detail, dan contact history memakai
geometry-preserving skeleton. Entitlement/visibility denial, withdrawn candidate,
empty result, dan retry ditampilkan sebagai state yang dapat ditindaklanjuti.
