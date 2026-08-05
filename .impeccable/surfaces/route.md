---
version: 2
slug: 'route'
primary_target: 'route:/'
related_targets: ['route:/register', 'route:/login']
---

# SATU Product Landing dan Synthetic Network Demo

## Job and Audience

Student, campus leader, recruiter, dan competition evaluator menilai apa itu SATU, bagaimana opportunity menjadi verified proof, serta batas privacy produk. Mode: **Persuade**.

## Outcome and Proof

Pengunjung dapat menjelaskan alur `opportunity -> team -> work -> validation -> portfolio`, mengetahui bahwa graph demo synthetic dan non-diagnostic, lalu memilih CTA yang sesuai.

## Selected Direction

Live record of opportunity-to-proof dalam visual world **Buku Besar Kolaborasi**. First viewport menunjukkan mekanisme nyata melalui ledger yang berkembang menjadi graph dan verified contribution, bukan generic hero dengan floating cards.

## Scope and Boundaries

Offer, mechanism, role value, interactive synthetic graph, privacy promise yang dapat dibuktikan, limitation copy, dan role-specific CTA. Tidak mencakup invented customer, price, testimonial, pilot statistic, impact result, atau partner logo.

## States and Ranges

- JavaScript ready, loading, reduced motion, dan no-JavaScript fallback.
- Demo idle, focus node, filter, reset, keyboard table alternative.
- CTA competition demo, student registration, campus discussion, atau recruiter interest sesuai release state.

## Interaction and Layout

First viewport memuat offer, mechanism cue, dan primary CTA. Scroll mengungkap evidence lifecycle. Demo memungkinkan memilih node dan filter collaboration type dengan table equivalent. Motion hanya menjelaskan hubungan dan hilang pada reduced motion.

## Accessibility and Performance

Canvas atau SVG memiliki text alternative dan equivalent list/table. Keyboard tidak dipaksa menavigasi setiap decorative edge. Target Core Web Vitals, lazy-load demo di bawah critical content, serta asset budget tercatat pada issue.

## Constraints and Gates

Semua demonstration record dilabeli `Data synthetic`. CTA dan claim mengikuti capability yang benar-benar tersedia saat release.

## Loading Contract

Loading mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md).
Interactive demo memakai deferred skeleton di bawah critical content dan
mempertahankan CTA. Reset, filter, dan network error memiliki inline progress
atau recovery state.
