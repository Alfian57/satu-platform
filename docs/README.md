# Dokumentasi SATU

## Mulai

1. Baca `AGENTS.md` dan `START_HERE.md`.
2. Baca [AI Execution Guide](implementation/AI_EXECUTION_GUIDE.md) untuk workflow agent.
3. Jalankan ownership gate GitHub CLI seperti yang dijelaskan pada [Dependency Workflow](implementation/DEPENDENCY_WORKFLOW.md).
4. Buka selected GitHub issue yang berlabel `ready` atau `stacked` sesuai ownership dan dependency.
5. Baca hanya owning docs yang ditautkan issue.
6. Periksa runtime sebelum menyatakan planned capability telah implemented.

## Source of Truth

| Urutan | Sumber                                 | Pemilik kebenaran                      |
| ------ | -------------------------------------- | -------------------------------------- |
| 1      | `PRODUCT.md`                           | Durable product boundary               |
| 2      | `docs/product/PRD.md`                  | Requirement dan release acceptance     |
| 3      | `DESIGN.md`                            | Global visual authority                |
| 4      | `docs/ux/` dan `.impeccable/surfaces/` | Route behavior, content, accessibility |
| 5      | `docs/engineering/`                    | Architecture, data, security, privacy  |
| 6      | GitHub issues, roadmap, test strategy  | Execution dan verification             |
| 7      | `docs/governance/DECISIONS.md`         | Accepted decisions dan open gates      |
| 8      | `docs/reference/proposal_lomba.md`     | Historical input                       |

## Struktur

```text
docs/
├── product/          # PRD dan business flow/model
├── ux/               # IA, flows, copy, accessibility, inventory
├── engineering/      # architecture, data, security/privacy
├── governance/       # accepted decisions dan open gates
├── implementation/   # issue workflow, roadmap, test strategy
└── reference/        # historical source material
```

Task status tidak disimpan pada Markdown. Gunakan GitHub issues/milestones. Jangan membuat ulang `PROGRESS.md` atau `implementation/phases/`.

Workflow status menggunakan label `ready`, `blocked`, `stacked`, `in-progress`, dan `needs-review`. Dependency yang sudah selesai ditulis sebagai `Prerequisite completed`, bukan `Blocked by`. GitHub Assignees menjadi source of truth ownership.

## Maintenance

- Ubah product boundary pada PRODUCT dan PRD.
- Ubah route behavior pada UX docs dan matching surface brief.
- Ubah entity/event/Policy/provider pada engineering docs.
- Ubah gate pada DECISIONS dan owning security/product docs.
- Ubah task scope/status pada GitHub issue.

Documentation change harus lulus Prettier, internal-link review, surface-brief resolution, Unicode em dash check, dan `git diff --check`.
