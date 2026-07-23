# SATU: AI Entry Point

Baca file ini segera setelah `AGENTS.md` atau `CLAUDE.md`.

## Start

1. Baca [`docs/implementation/PROGRESS.md`](docs/implementation/PROGRESS.md).
2. Buka hanya `current_phase_file` yang tercantum di progress.
3. Baca sumber pada bagian `Read Before Work` di file phase tersebut.
4. Periksa prerequisite, repository state, dan implementasi yang benar-benar tersedia.
5. Kerjakan tepat satu phase.

Jangan membaca seluruh phase atau seluruh dokumentasi tanpa kebutuhan.

## During Work

- Ubah progress menjadi `in_progress` ketika pekerjaan phase dimulai.
- Jangan mengerjakan next phase sebagai cleanup atau convenience work.
- Jika prerequisite tidak terpenuhi, gunakan `blocked` dan laporkan penyebabnya.
- Jika phase memiliki human/external gate, gunakan `awaiting_approval` atau `blocked`, lalu
  berhenti.
- Planned capability tidak boleh dilaporkan sebagai implemented capability.

## Close the Phase

- Jalankan seluruh verification dan pastikan exit criteria terpenuhi.
- Untuk phase automatic yang selesai, perbarui `completed_through`, hitungan, dan pointer ke
  next phase, lalu akhiri sesi.
- Untuk phase dengan gate, jangan memajukan pointer sebelum approval eksplisit.
- Simpan hanya latest outcome dan last checks yang ringkas di progress; Git menyimpan detail
  histori.

## Report

Gunakan tepat empat baris secara default:

```text
Phase: Pxx: completed|awaiting_approval|blocked
Outcome: satu kalimat hasil utama
Checks: pemeriksaan utama dan statusnya
Next: Pyy: judul phase | Blocker: satu kalimat
```

Jelaskan file, diff, atau raw output hanya ketika diperlukan untuk mengatasi kegagalan atau
diminta pengguna.

## Durable Truth

`START_HERE.md` dan progress mengatur scope kerja, bukan product truth. Gunakan precedence
yang ditetapkan `AGENTS.md`: product → PRD → design → UX → engineering → implementation →
governance → historical proposal.
