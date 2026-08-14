# UI/UX Playbook SATU

## Urutan Baca

Sebelum UI work, baca `PRODUCT.md`, `docs/product/PRD.md`, `DESIGN.md`, `docs/ux/SCREEN_INVENTORY.md`, `docs/ux/CONTENT_ACCESSIBILITY.md`, lalu matching surface brief di `.impeccable/surfaces/`.

Jika brief belum ada, jalankan Impeccable `shape`, konfirmasi direction, dan simpan brief sebelum implementasi. Untuk route yang sudah memiliki brief, update brief saat behavior route berubah.

## Lifecycle

1. Shape: job, audience, mode, outcome, boundaries, states, ranges, interaction, dan open gate.
2. Build: gunakan token dan primitive Buku Besar Kolaborasi.
3. Audit: hierarchy, accessibility, responsive behavior, performance, dan product truth.
4. Harden: error, overflow, offline, stale, permission, empty, destructive, dan synthetic state.
5. Polish: motion, copy, alignment, density, dan final interaction.

## Definition of Ready

- Issue memiliki acceptance criteria, references, dependencies, owner role, dan package decision.
- Surface brief tersedia dan tidak konflik dengan DESIGN.
- Backend route, Policy, projection, dan state contract diketahui.
- Minimum, typical, maximum content serta error/recovery state didefinisikan.

## Definition of Done

- UI konsisten dengan selected direction dan reusable primitives.
- Wayfinder dipakai untuk backend route.
- WCAG 2.2 AA, keyboard, focus, reduced motion, responsive, dan semantic state diperiksa.
- UI issue menyertakan screenshot atau rekaman state penting.
- Impeccable audit, harden, dan polish dilakukan sebelum release gate.

## Asset Gambar

Gunakan asset hanya bila memberi informasi atau atmosfer yang tidak efektif melalui semantic UI. AI agent boleh membuat gambar sendiri dengan image generation jika belum ada asset yang disetujui. Simpan source, alt purpose, license atau generation provenance, dan optimized output. Jangan mengganti chart, graph, status, atau interactive control dengan gambar statis.

## Ownership

Global visual change dimiliki `DESIGN.md`. Route behavior dimiliki surface brief. Canonical copy dan accessibility dimiliki `CONTENT_ACCESSIBILITY.md`. Task status dimiliki GitHub issue, bukan dokumen UX.
