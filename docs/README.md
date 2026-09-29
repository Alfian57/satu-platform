# Dokumentasi SATU

## Mulai

1. Ikuti permintaan pengguna dan baca `AGENTS.md` serta `START_HERE.md`.
2. Baca dokumen pemilik yang relevan. Baca issue GitHub hanya jika pengguna menunjuk issue tersebut.
3. Periksa runtime sebelum menyatakan planned capability telah implemented.

## Source of Truth

| Urutan | Sumber                             | Pemilik kebenaran                      |
| ------ | ---------------------------------- | -------------------------------------- |
| 1      | `PRODUCT.md`                       | Durable product boundary               |
| 2      | `docs/product/PRD.md`              | Requirement dan release acceptance     |
| 3      | `DESIGN.md`                        | Global visual authority                |
| 4      | `docs/ux/`                         | Route behavior, content, accessibility |
| 5      | `docs/engineering/`                | Architecture, data, security, privacy  |
| 6      | GitHub issues dan roadmap          | Execution dan verification             |
| 7      | `docs/governance/DECISIONS.md`     | Accepted decisions dan open gates      |
| 8      | `docs/reference/proposal_lomba.md` | Historical input                       |

## Struktur

```text
docs/
├── product/          # PRD dan business flow/model
├── ux/               # IA, flows, copy, accessibility, inventory, surface behavior
├── engineering/      # architecture, data, security/privacy
├── governance/       # accepted decisions dan open gates
├── implementation/   # GitHub automation, commit format, dan roadmap
└── reference/        # historical source material
```

GitHub Actions menyinkronkan label status issue dan field Project dari issue serta pull request. Aturan mapping automation dijelaskan di [Implementation](implementation/README.md). GitHub Assignees tetap menjadi data ownership pada GitHub.

## Maintenance

- Ubah product boundary pada PRODUCT dan PRD.
- Ubah route behavior pada UX docs dan sinkronkan `SCREEN_INVENTORY.md`.
- Ubah entity/event/Policy/provider pada engineering docs.
- Ubah gate pada DECISIONS dan owning security/product docs.
- Ubah task scope/status pada GitHub issue.

Documentation change mengikuti pemeriksaan format, internal-link, dan `git diff --check` yang relevan dengan perubahan.
