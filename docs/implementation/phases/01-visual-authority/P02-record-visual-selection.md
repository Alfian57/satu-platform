---
id: P02
title: 'Record visual selection'
stage: 01-visual-authority
depends_on: [P01]
gate: automatic
next: P03
---

# P02: Record visual selection

## Outcome

Mengubah pilihan pengguna menjadi kontrak implementasi yang tidak ambigu.

## Prerequisites

P01 disetujui dan satu comp dipilih.

## Read Before Work

- [PRODUCT.md](../../../../PRODUCT.md)
- [PRD.md](../../../product/PRD.md)
- [DECISIONS.md](../../../governance/DECISIONS.md)
- [DESIGN.md](../../../../DESIGN.md)
- [UX strategy](../../../ux/UX_STRATEGY.md)
- [Screen inventory](../../../ux/SCREEN_INVENTORY.md)
- [Dashboard surface brief](../../../../.impeccable/surfaces/resources-js-pages-dashboard-tsx.md)
- Runtime context: `resources/js/pages/dashboard.tsx`, `resources/css/app.css`, app shell, navigation, and representative UI components.
- Phase-specific context: comp terpilih, dan feedback pengguna.

## Deliverables

Catat thesis, first viewport, visual grammar, signature moment, responsive
consequence, dan anti-goals; perbarui dashboard surface brief dan directional part dari
`DESIGN.md`.

## Out of Scope

Menetapkan token final yang belum dibuktikan oleh code atau menggabungkan elemen
comp yang ditolak.

## Verification

Brief tidak menduplikasi PRD, tetap konsisten dengan “Buku Besar
Kolaborasi”, dan dapat diimplementasikan tanpa keputusan visual baru.

## Exit Criteria

Visual direction contract dan surface brief selaras dengan pilihan pengguna.

## Gate and Next Phase

- **Gate:** Automatic.
- **Next:** [P03: Establish visual primitives](P03-establish-visual-primitives.md)
