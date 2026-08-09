# Gamification Policy

**Version:** 1.0.0
**Status:** draft (menunggu approval GATE-011)
**Audit owner:** product-design
**Effective date:** menunggu approval

Dokumen ini adalah kebijakan versioned untuk XP, badge, dan hybrid leaderboard SATU. Seluruh perubahan wajib melalui version increment dan approval audit owner.

---

## 1. XP Ledger

### 1.1 Source Baseline

Verified contribution adalah satu-satunya source XP. Tidak ada source XP lain yang diperbolehkan, termasuk:

- login frequency atau session count;
- profile completion;
- invitation atau recruitment activity;
- message count atau workspace activity;
- social graph metrics;
- inclusion signal atau connectivity opportunity.

### 1.2 Award Rules

- XP hanya diberikan setelah campus reviewer menyetujui kontribusi (status `approved`).
- Setiap approved contribution menghasilkan tepat satu XP ledger entry dengan amount yang ditentukan oleh kontribusi, bukan oleh reviewer discretion.
- XP entry memiliki idempotency key unik: `{contribution_id}:{version}`. Duplicate key ditolak di database layer.
- XP amount bersifat final setelah awarded. Tidak dapat diubah retroaktif.

### 1.3 Ledger Integrity

- XP ledger bersifat append-only. Tidak ada row yang dihapus.
- Reversal contribution (status berubah dari approved menjadi rejected setelah appeal atau audit) menghasilkan reversal entry baru, bukan menghapus entry sebelumnya.
- Reversal entry mereferensikan entry asli dan menyimpan reason code, actor, serta timestamp.
- Net XP untuk perhitungan leaderboard adalah sum semua entry dikurangi sum semua reversal entry.
- Setiap entry menyimpan: user, institution, semester, amount, reason, source type/id, policy version, awarded-at, reversal reference, dan idempotency key.

### 1.4 Semester Scope

- XP dihitung per semester sesuai semester kontribusi yang disetujui.
- XP tidak dapat dipindahkan atau dikreditkan ke semester lain.

---

## 2. Badge Taxonomy and Issuance

### 2.1 Taxonomy

Badge memiliki taxonomy dengan kategori:

- **Contribution:** milestone kontribusi (misal: kontribusi pertama, kontribusi ke-5, kontribusi ke-10).
- **Skill:** pengakuan skill terverifikasi melalui kontribusi.
- **Collaboration:** partisipasi tim dan project completion.
- **Campus recognition:** badge yang diberikan campus reviewer atas kontribusi luar biasa.

### 2.2 Issuance Rules

- Badge rule disimpan sebagai `badge_rule_versions` dengan version integer.
- Setiap badge definition memiliki public description dan kriteria yang dapat diaudit.
- Badge diberikan secara otomatis oleh sistem berdasarkan rule version aktif, atau secara manual oleh campus reviewer dengan alasan yang tercatat.
- Badge award menyimpan: user, badge definition, rule version, evidence/source, awarded-at, dan revoked-at bila berlaku.
- Badge yang dicabut memiliki revocation entry dengan reason dan actor. History award tetap tersimpan.
- Badge tidak memengaruhi XP amount atau leaderboard score.

### 2.3 Rule Versioning

- Perubahan rule badge menghasilkan version baru. Version lama tetap tersimpan sebagai history.
- Hanya satu rule version yang `active = true` pada satu waktu.
- Campus reviewer tidak dapat mengubah rule version. Perubahan rule melalui approval product-design.

---

## 3. Hybrid Leaderboard

### 3.1 Scope Types

Leaderboard terdiri dari tiga scope:

1. **Program studi (default on):** seluruh active member dalam satu program studi pada satu institution.
2. **Tim (default on):** anggota tim yang memiliki project dengan kontribusi approved pada semester berjalan.
3. **Individual (default off):** student yang telah melakukan opt-in eksplisit.

### 3.2 Period

- Periode leaderboard adalah semester akademik.
- Minimum satu semester, maximum seluruh semester yang memiliki data verified XP.
- Period switch tidak mengubah data historis.

### 3.3 Score Computation

- Score program studi = rata-rata verified XP per active member dalam program studi tersebut pada semester berjalan.
- Score tim = rata-rata verified XP per active member dalam tim tersebut pada semester berjalan.
- Score individual = total verified XP student pada semester berjalan.

Denominator active member dihitung berdasarkan active-member definition (DEC-024):

- Memiliki verified affiliation pada institution.
- Terdaftar pada roster semester berjalan dengan `status_aktif = Aktif`.
- Memiliki minimal satu approved contribution pada semester berjalan.

### 3.4 Cohort Minimum

- Leaderboard program studi dan tim hanya dipublikasikan jika cohort memiliki minimal lima active member.
- Cohort di bawah lima disuppress. Placeholder menampilkan penyebab dan jumlah anggota saat ini.
- Individual leaderboard tidak memiliki cohort minimum.

### 3.5 Tie

- Dua atau lebih entitas dengan score identik berbagi ranking yang sama (shared rank).
- Urutan berikutnya melompat sesuai jumlah tie (standard competition ranking, contoh: 1, 2, 2, 4).
- Tie tidak memengaruhi score computation.

### 3.6 Leaderboard Projection

- `leaderboard_projections` menyimpan hasil komputasi: period, scope type/id, rank, shared-rank group, score, verified XP total, active-member denominator, cohort size, suppressed flag, rule version, dan computed-at.
- Projection di-refresh secara periodik. Data lebih dari 24 jam dianggap stale.
- Refresh tidak menghapus projection sebelumnya. Setiap refresh menghasilkan row baru dengan `computed-at` yang diperbarui.

---

## 4. Individual Opt-in and Withdrawal

### 4.1 Default

- Individual leaderboard default off. Student tidak muncul dalam individual leaderboard tanpa opt-in eksplisit.
- Program studi dan tim leaderboard tetap tampil tanpa memerlukan opt-in individual.

### 4.2 Opt-in

- Student melakukan opt-in melalui preference yang disimpan pada `leaderboard_preferences`.
- Sebelum opt-in, student melihat preview: data apa yang akan tampil, siapa yang dapat melihatnya, dan bahwa ranking dapat dicabut kapan saja.
- Opt-in tidak dapat diaktifkan oleh admin, operator, atau sistem atas nama student.

### 4.3 Withdrawal

- Student dapat withdraw kapan saja.
- Withdrawal segera menghapus baris personal dari individual leaderboard.
- Score program studi atau tim yang terpengaruh withdrawal dihitung ulang pada periode refresh berikutnya.
- Student yang telah withdraw dapat opt-in kembali. Baris baru dimulai tanpa membawa history ranking sebelumnya.
- Withdrawal history disimpan pada `leaderboard_preferences` dengan timestamp dan reason.

### 4.4 Preference Record

- `leaderboard_preferences` menyimpan: user, scope type, preference (opt-in/opt-out), changed-at, dan version.
- Setiap perubahan preference menghasilkan row baru. Tidak ada hard delete.

---

## 5. Anti-Abuse

### 5.1 Forbidden Inputs

Score leaderboard tidak boleh dipengaruhi oleh:

- inclusion signal atau connectivity opportunity;
- message count, message content, atau sentiment;
- social graph metrics di luar contribution verified;
- profile completeness;
- login frequency;
- manual adjustment tanpa audit trail.

### 5.2 Abuse Detection

Anti-abuse review mencakup:

- **Duplicate evidence:** kontribusi dengan evidence yang sama diajukan lebih dari satu kali.
- **Repeated submission:** submission-approve-withdraw-resubmit dalam waktu singkat.
- **Collusion:** pola approval antara reviewer dan student tertentu.
- **Inactive member manipulation:** menambahkan anggota tidak aktif untuk menurunkan denominator.
- **Unauthorized reviewer:** reviewer menyetujui kontribusi di luar institution scope.

### 5.3 Abuse Response

- Detected abuse menghasilkan flag pada ledger entry. Flag tidak otomatis membatalkan XP.
- Campus reviewer dengan permission escalation dapat meninjau flag dan memutuskan reversal.
- Reversal menghasilkan reversal entry (bukan delete) dengan reason code `abuse_review`.
- Abuse pattern yang terkonfirmasi dicatat pada audit log.

---

## 6. Policy Governance

### 6.1 Versioning

- Policy ini memiliki semantic version `MAJOR.MINOR.PATCH`.
- MAJOR: perubahan aturan score, source XP, atau scope leaderboard.
- MINOR: perubahan badge taxonomy, rule version, atau anti-abuse criteria.
- PATCH: klarifikasi, perbaikan bahasa, atau penyesuaian non-substantif.
- Setiap perubahan policy wajib melalui pull request dengan approval audit owner.

### 6.2 Audit Owner

- Audit owner untuk policy ini adalah `product-design`.
- Audit owner bertanggung jawab atas approval perubahan policy.
- Audit owner dapat mendelegasikan review teknis ke `owner:backend` atau `owner:security-privacy`.

### 6.3 Forbidden Changes

Perubahan yang tidak diizinkan tanpa governance gate baru:

- Menambahkan source XP di luar verified contribution.
- Mengubah individual leaderboard menjadi default on.
- Menggunakan inclusion signal atau connectivity opportunity sebagai input score.
- Menghapus ledger history atau badge award history.
- Menambahkan reward finansial atau academic grade ke leaderboard.

### 6.4 Related Decisions

- DEC-010: Hybrid leaderboard rules.
- DEC-011: Inclusion bukan leaderboard input.
- DEC-024: Active-member definition.
- GATE-011: Approval gamification policy (human gate).

---

## 7. References

- [PRODUCT.md](../../PRODUCT.md): Produk truth dan batas rilis.
- [PRD.md](../product/PRD.md): Functional requirements FR-06.
- [DATA_MODEL.md](../engineering/DATA_MODEL.md): Schema gamification.
- [SECURITY_PRIVACY.md](../engineering/SECURITY_PRIVACY.md): Gamification integrity dan anti-abuse.
- [DECISIONS.md](./DECISIONS.md): Accepted decisions dan open gates.
- [route-leaderboards.md](../../.impeccable/surfaces/route-leaderboards.md): Surface brief leaderboard.
