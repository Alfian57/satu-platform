# SATU: Panduan Kerja

Ikuti instruksi eksplisit pengguna dan batas pekerjaan yang diminta.

1. Jika pengguna memberikan GitHub issue, baca issue itu, acceptance criteria, blocker, dan dokumen yang dirujuk. Jika tidak, jangan memilih issue sendiri.
2. Baca dokumen pemilik yang relevan dengan perubahan. Periksa implementasi yang ada dan bedakan kemampuan yang sudah berjalan dari rencana.
3. Kerjakan perubahan sesuai permintaan dan perbarui dokumentasi pemilik bila kontraknya berubah.
4. Jalankan pemeriksaan yang relevan dengan perubahan dan laporkan hasil serta blocker yang tersisa.

Dokumen Markdown menjelaskan product, UX, engineering, security, dan kontrak repository. GitHub issue menjadi konteks tambahan saat pengguna menunjuk issue tertentu.

## Urutan Sumber Kebenaran

1. `PRODUCT.md`
2. `docs/product/PRD.md`
3. `DESIGN.md`
4. `docs/ux/` untuk perilaku, konten, dan aksesibilitas antarmuka
5. `docs/engineering/`
6. Permintaan pengguna dan, jika diberikan, GitHub issue untuk execution scope dan acceptance criteria
7. `docs/implementation/ROADMAP.md` untuk konteks roadmap
8. `docs/governance/DECISIONS.md`
9. `docs/reference/proposal_lomba.md` sebagai input historis

Jika terjadi konflik, sumber yang lebih tinggi menang. Perbarui owning document, jangan menambal konflik secara diam-diam di code.

## Laporan Akhir

Ringkas perubahan, pemeriksaan yang dijalankan, dan blocker yang tersisa. Jangan menyalin raw log kecuali diperlukan untuk menjelaskan kegagalan.
