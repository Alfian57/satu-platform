---
version: 1
slug: 'route-contributions'
primary_target: 'route:/contributions'
related_targets: ['route:/portfolio']
---

# Contributions, Validation, and Portfolio

## Job and Audience

Student ingin mengubah pekerjaan nyata menjadi contribution yang dapat dipercaya; reviewer ingin memutuskan dengan evidence dan policy yang cukup. Mode student management: **Operate**. Public portfolio kelak: **Experience**.

## Outcome and Proof

Student dapat submit, merespons revision, memahami validation level, dan memilih visibility. Reviewer dan viewer dapat melihat provenance tanpa data privat yang tidak relevan.

## Selected Direction

Mewarisi **Buku Besar Kolaborasi** sebagai contribution receipt dan validation docket. Perubahan status menambah jejak, bukan menimpa history. Portfolio menempatkan artifact terlebih dahulu, dengan provenance sebagai supporting proof.

## Scope and Boundaries

Mencakup task linkage, description, evidence, declaration, submit, review status, feedback, version, portfolio entry, dan visibility. Tidak menganggap badge sebagai verification dan tidak membuka private discussion kepada recruiter.

## States and Ranges

- Draft, pending, revision, approved, rejected, archived.
- Missing/invalid evidence, upload failure, reviewer unavailable.
- 0–20 evidence files; 0–100 portfolio entries.
- Self-reported, team-confirmed, institution-verified.

## Interaction and Layout

Submit review menunjukkan audience dan data yang akan tersimpan. Timeline memperlihatkan versions dan decisions. Revision kembali ke draft baru tanpa menghapus keputusan lama. Portfolio visibility diubah per item dan global recruiter discoverability.

## Constraints and Open Decisions

Evidence private by default. Download authorized. Validation authority dan retention adalah open gates kampus. Public portfolio tidak dibuat sampai visibility model diuji.

## Loading Contract

Loading mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md).
Contribution version, evidence list, review timeline, dan portfolio projection
memakai skeleton per region. Upload/review command mempertahankan evidence yang
ada dengan inline progress dan retry.
