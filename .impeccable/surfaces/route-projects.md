---
version: 1
slug: 'route-projects'
primary_target: 'route:/projects'
related_targets: ['route:/projects/{project}', 'route:/projects/create']
---

# Project Discovery and Matchmaking

## Job and Audience

Student mencari project atau anggota tim yang relevan dalam situasi deadline dan informasi yang tidak lengkap. Project owner mencari role fit tanpa mengakses sensitive signal. Mode: **Operate**.

## Outcome and Proof

Student dapat menemukan, membandingkan, memahami alasan match, dan mengambil tindakan. Owner dapat membuka role dan meninjau request tanpa ranking popularitas.

## Selected Direction

Mewarisi **Buku Besar Kolaborasi** sebagai opportunity register. Recommendation utama tampil sebagai open docket dengan requirement-to-profile alignment; list project menggunakan ruled rows dan indexed filters, bukan kumpulan card seragam.

## Scope and Boundaries

Mencakup search, filter, sort, recommendation, project detail, roles, join request, invitation, capacity, create project, dan feedback relevance. Tidak mengekspos connectivity score, inclusion reason, atau “best student” ranking.

## States and Ranges

- No projects, no filter results, insufficient profile.
- Open, forming, full, closed, cancelled.
- Invitation expiring, request pending/accepted/declined.
- 1–5 match reasons; 1–20 roles; large results paginated.

## Interaction and Layout

Filter state hidup di URL. Match explanation selalu mendahului action. Detail mempertahankan project identity, role availability, commitment, dan owner. Mobile memakai list/detail flow; dense comparison tidak memaksa horizontal card carousel.

## Constraints and Open Decisions

Recommendation menyimpan score version. Team capacity transition atomic. Decline copy aman dan actionable. Initial scoring weights tetap provisional sampai evaluation.
