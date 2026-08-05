# SATU: AI Entry Point

Baca file ini segera setelah `AGENTS.md` atau instruksi agent lain pada repository.

## Mulai

1. Pilih satu GitHub issue yang berstatus `ready` dan tidak memiliki dependency terbuka.
2. Baca seluruh body issue, termasuk acceptance criteria, out of scope, library, referensi, gate, dan handoff.
3. Baca hanya dokumentasi yang ditautkan oleh issue tersebut.
4. Periksa implementasi yang benar-benar tersedia. Planned capability tidak boleh dilaporkan sebagai implemented capability.
5. Buat branch `<type>/<issue-number>-<slug>` dari `main` terbaru.

GitHub issues dan milestones adalah sumber kebenaran execution. Dokumen Markdown adalah sumber kebenaran product, UX, engineering, security, dan delivery contract. Jangan membuat file progress atau phase plan baru.

## Selama Pengerjaan

- Kerjakan scope satu issue. Perubahan pendukung boleh masuk hanya jika diperlukan oleh acceptance criteria.
- Gunakan library mature yang kompatibel bila lebih aman daripada implementasi dari nol. Ikuti keputusan package pada bagian `Library/Package` issue.
- Jangan mengubah dependency tanpa persetujuan jika package belum disetujui di issue.
- Catat temuan yang mengubah scope atau kontrak sebagai komentar issue dan perbarui owning document melalui pull request.
- Berhenti pada human, external, atau conditional gate sampai bukti dan keputusan tercatat.

## Pull Request

- Satu issue, satu branch, satu pull request.
- Gunakan Conventional Commit dan cantumkan `Closes #<issue>` pada body pull request.
- Sertakan hasil test, screenshot untuk UI, perubahan data/security, rollback, dan dokumentasi yang relevan.
- Pull request dibuka sebagai draft sampai acceptance criteria dan verifikasi selesai.
- `main` hanya menerima **Squash and merge** setelah required CI lulus dan seluruh conversation selesai.
- Contributor non-owner memerlukan minimal satu approval.
- Repository owner boleh melakukan self-review dan merge sebagai admin tanpa approval reviewer tambahan, tetapi tetap wajib memenuhi required CI serta conversation resolution.

## Urutan Sumber Kebenaran

1. `PRODUCT.md`
2. `docs/product/PRD.md`
3. `DESIGN.md`
4. `docs/ux/` dan surface brief terkait di `.impeccable/surfaces/`
5. `docs/engineering/`
6. GitHub issue, `docs/implementation/ROADMAP.md`, dan `docs/implementation/TEST_STRATEGY.md`
7. `docs/governance/DECISIONS.md`
8. `docs/reference/proposal_lomba.md` sebagai input historis

Jika terjadi konflik, sumber yang lebih tinggi menang. Perbarui owning document, jangan menambal konflik secara diam-diam di code.

## Laporan Akhir

Ringkas hasil, check yang dijalankan, pull request, dan blocker atau handoff berikutnya. Jangan menyalin raw log kecuali diperlukan untuk menjelaskan kegagalan.
