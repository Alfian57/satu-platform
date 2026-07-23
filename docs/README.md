# Dokumentasi SATU

Dokumentasi ini mengubah proposal lomba SATU menjadi sumber kebenaran untuk product
discovery, desain, development, pengujian, governance, dan evaluasi bisnis.

AI tidak memulai dari indeks ini. AI wajib membaca [`START_HERE.md`](../START_HERE.md),
[`implementation/PROGRESS.md`](implementation/PROGRESS.md), lalu hanya file phase aktif dan
sumber yang disebutkannya.

## Root Entry Files

File berikut sengaja berada di root karena dibaca langsung oleh agent atau tooling:

| File                                | Fungsi                                                      |
| ----------------------------------- | ----------------------------------------------------------- |
| [`AGENTS.md`](../AGENTS.md)         | Aturan repository dan Laravel Boost                         |
| [`CLAUDE.md`](../CLAUDE.md)         | Delegasi singkat yang menunjuk ke `AGENTS.md`               |
| [`START_HERE.md`](../START_HERE.md) | Protokol startup, stop, dan laporan empat baris             |
| [`PRODUCT.md`](../PRODUCT.md)       | Durable product truth untuk product/design tooling          |
| [`DESIGN.md`](../DESIGN.md)         | Global visual authority untuk Impeccable dan frontend agent |

Surface brief di [`.impeccable/surfaces/`](../.impeccable/surfaces/) merupakan generated
design context dan tidak dipindahkan ke `docs/`.

## Struktur

```text
docs/
├── product/      # requirement, business model, dan business flow
├── ux/           # strategy, information architecture, flows, screens, dan content
├── engineering/  # architecture, data model, security, dan privacy
├── implementation/ # roadmap, progress, phase files, dan test strategy
├── governance/   # accepted, provisional, dan open decisions
└── reference/    # sumber historis yang bukan runtime specification
```

## Hierarchy of Truth

Jika dua dokumen bertentangan, gunakan urutan berikut:

1. [`PRODUCT.md`](../PRODUCT.md) untuk durable product truth dan non-negotiable boundaries.
2. [`product/PRD.md`](product/PRD.md) untuk requirement, scope, dan acceptance criteria.
3. [`DESIGN.md`](../DESIGN.md) untuk global visual authority.
4. Dokumen [`ux/`](ux/README.md) dan matching Impeccable surface brief untuk surface behavior.
5. Dokumen [`engineering/`](engineering/ARCHITECTURE.md) untuk kontrak implementasi.
6. Active file dalam [`implementation/phases/`](implementation/phases/) untuk pekerjaan
   atomik dan [`implementation/TEST_STRATEGY.md`](implementation/TEST_STRATEGY.md) untuk
   verification.
7. [`governance/DECISIONS.md`](governance/DECISIONS.md) untuk keputusan dan open gates.
8. [`reference/proposal_lomba.md`](reference/proposal_lomba.md) sebagai sumber historis.

Dokumen yang lebih spesifik boleh memperinci sumber di atasnya, tetapi tidak boleh mengubah
invariant tanpa memperbarui sumber yang lebih tinggi.

## Peta Dokumen

| Area         | Dokumen                                                              | Fungsi                                        |
| ------------ | -------------------------------------------------------------------- | --------------------------------------------- |
| Entry AI     | [`START_HERE.md`](../START_HERE.md)                                  | Active phase, minimum reading, dan stop rules |
| Product      | [`product/PRD.md`](product/PRD.md)                                   | Requirement production dan Increment 1        |
| Product      | [`product/BUSINESS_MODEL.md`](product/BUSINESS_MODEL.md)             | Model B2B2C, GTM, dan eksperimen              |
| Product      | [`product/BUSINESS_FLOW.md`](product/BUSINESS_FLOW.md)               | Alur lintas aktor                             |
| UX           | [`ux/UX_STRATEGY.md`](ux/UX_STRATEGY.md)                             | Prinsip pengalaman, persona, dan JTBD         |
| UX           | [`ux/INFORMATION_ARCHITECTURE.md`](ux/INFORMATION_ARCHITECTURE.md)   | Struktur objek dan navigasi                   |
| UX           | [`ux/USER_FLOWS.md`](ux/USER_FLOWS.md)                               | Alur detail dan failure paths                 |
| UX           | [`ux/SCREEN_INVENTORY.md`](ux/SCREEN_INVENTORY.md)                   | Surface, route, mode, acceptance, dan brief   |
| UX           | [`ux/CONTENT_ACCESSIBILITY.md`](ux/CONTENT_ACCESSIBILITY.md)         | Bahasa produk dan accessibility               |
| Engineering  | [`engineering/ARCHITECTURE.md`](engineering/ARCHITECTURE.md)         | Arsitektur aplikasi dan realtime              |
| Engineering  | [`engineering/DATA_MODEL.md`](engineering/DATA_MODEL.md)             | Entity, lifecycle, dan privacy class          |
| Engineering  | [`engineering/SECURITY_PRIVACY.md`](engineering/SECURITY_PRIVACY.md) | Security, consent, fairness, dan DPIA         |
| Implementasi | [`implementation/README.md`](implementation/README.md)               | Stage index dan execution contract            |
| Implementasi | [`implementation/PROGRESS.md`](implementation/PROGRESS.md)           | Current phase dan handoff lintas-agent        |
| Implementasi | [`implementation/ROADMAP.md`](implementation/ROADMAP.md)             | Milestone dan release gates                   |
| Implementasi | [`implementation/phases/`](implementation/phases/)                   | `P01–P69`, satu file dan outcome per sesi AI  |
| Implementasi | [`implementation/TEST_STRATEGY.md`](implementation/TEST_STRATEGY.md) | Strategi pengujian                            |
| Governance   | [`governance/DECISIONS.md`](governance/DECISIONS.md)                 | Accepted decisions dan open gates             |
| Reference    | [`reference/proposal_lomba.md`](reference/proposal_lomba.md)         | Proposal asli sebagai historical input        |

## Status Istilah

- **Confirmed**: disetujui pengguna atau dinyatakan eksplisit dalam proposal.
- **Planned**: bagian dari target product tetapi belum tersedia di aplikasi.
- **Hypothesis**: harus divalidasi dengan pengguna, institusi, pasar, atau data.
- **Open gate**: keputusan yang harus ditutup sebelum milestone tertentu.

Dokumen tidak boleh menyebut capability `planned` sebagai fitur yang telah tersedia.

## Aturan Pemeliharaan

- Perubahan tujuan, pengguna, positioning, atau batas privasi memperbarui `PRODUCT.md` terlebih dahulu.
- Perubahan requirement atau scope memperbarui `product/PRD.md` dan traceability terkait.
- Surface baru harus memiliki Impeccable shape brief sebelum implementasi.
- Perubahan visual lintas surface memperbarui `DESIGN.md`; perubahan lokal cukup memperbarui surface brief.
- Perubahan entity, event, permission, atau integrasi memperbarui dokumen engineering terkait.
- Perubahan urutan kerja memperbarui phase terkait; perubahan status hanya memperbarui
  `implementation/PROGRESS.md`.
- Keputusan yang menutup sebuah hypothesis atau open gate dicatat di `governance/DECISIONS.md`.
- Setiap requirement baru harus dapat ditelusuri ke flow, screen, module, milestone, dan test category.

## Glossary

| Istilah                  | Makna                                                                          |
| ------------------------ | ------------------------------------------------------------------------------ |
| SATU                     | Sistem Aktivitas Talenta Universitas                                           |
| Institution membership   | Hubungan seorang pengguna dengan sebuah kampus beserta status verifikasinya    |
| Contribution             | Pekerjaan individual yang dapat dibuktikan di dalam sebuah project             |
| Verified contribution    | Contribution yang telah ditinjau oleh pihak berwenang                          |
| Connectivity opportunity | Peluang memperluas partisipasi pengguna dengan konektivitas kolaboratif rendah |
| Inclusion signal         | Sinyal terbatas untuk human review kampus; bukan diagnosis                     |
| Match explanation        | Alasan yang dapat dipahami pengguna atas sebuah rekomendasi                    |
| Talent Portal            | Product surface untuk recruiter, direncanakan pada fase lanjutan               |

## Bahasa

Narasi dokumentasi dan UX copy menggunakan bahasa Indonesia. Nama entity, enum, route, event, dan identifier kode menggunakan bahasa Inggris agar konsisten dengan codebase.
