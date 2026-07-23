# UX Strategy SATU

## 1. Experience Thesis

SATU mengubah kesempatan kolaborasi yang biasanya tersembunyi di dalam circle menjadi alur yang dapat ditemukan, dijelaskan, dan dibuktikan. Pengalaman harus selalu menjawab:

1. Apa kesempatan atau pekerjaan terpenting sekarang?
2. Mengapa ini relevan untuk saya?
3. Apa akibat dari tindakan saya?
4. Siapa yang dapat melihat data ini?
5. Bagaimana kontribusi ini memperoleh status terpercaya?

## 2. Experience Principles

### Opportunity, not diagnosis

SATU menawarkan project, koneksi, dan next action. Produk tidak menampilkan atau menyimpulkan kondisi mental pengguna.

### Explain before asking

Recommendation menjelaskan alasan sebelum meminta student menerima invitation atau membagikan data.

### Provenance over decoration

Verified state harus menunjukkan sumber, reviewer, dan waktu. Badge tanpa provenance tidak dianggap bukti.

### One meaningful next action

Dashboard dan empty state memprioritaskan satu tindakan yang meningkatkan partisipasi atau menyelesaikan pekerjaan.

### Privacy is visible

Visibility, consent, audience, dan permission muncul dekat tindakan yang mengubah exposure data.

### Recovery is normal

Revision, reconnect, failed upload, lost permission, expired invitation, dan stale data dirancang sebagai product states, bukan exception copy generik.

## 3. Personas dan Context

### Dira: Student di luar circle utama

- Memiliki skill tetapi tidak tahu project mana yang terbuka.
- Khawatir ditolak atau terlihat “tidak punya teman”.
- Membutuhkan recommendation yang aman, jelas, dan tidak mengungkap alasan sensitif.
- Success: bergabung ke team yang relevan dan menyelesaikan contribution pertama.

### Raka: Project initiator

- Memiliki project dan deadline tetapi kekurangan role tertentu.
- Membutuhkan kandidat yang tersedia dan dapat dipercaya.
- Tidak boleh mendapatkan label sosial kandidat.
- Success: team terbentuk tanpa oversubscription dan role gap.

### Maya: Campus admin

- Menangani membership dan validation queue dengan waktu terbatas.
- Membutuhkan provenance, filter, dan audit trail.
- Harus memahami inclusion signal sebagai prompt human review, bukan diagnosis.
- Success: review cepat, konsisten, dan dapat dipertanggungjawabkan.

### Sinta: Recruiter

- Mencari kandidat internship dengan evidence.
- Hanya membutuhkan skill, contribution, dan visibility yang disetujui.
- Success: menemukan kandidat relevan dan memperoleh respons tanpa data sensitif.

## 4. Core Jobs to Be Done

| Role         | Situation                  | Job                                   | Outcome                                |
| ------------ | -------------------------- | ------------------------------------- | -------------------------------------- |
| Student      | Belum memiliki team        | Temukan peluang yang cocok            | Mengambil tindakan pada recommendation |
| Student      | Sedang mengerjakan project | Ketahui task dan deadline             | Progress tanpa kehilangan context      |
| Student      | Selesai bekerja            | Buktikan kontribusi                   | Mendapat provenance yang benar         |
| Campus admin | Queue bertambah            | Prioritaskan review                   | SLA review terjaga                     |
| Campus admin | Signal muncul              | Pahami dan tindak lanjuti secara aman | Human-reviewed outcome tercatat        |
| Recruiter    | Mencari kandidat           | Bandingkan verified work              | Contact request relevan                |

## 5. Trust Model

Trust dibentuk bertahap:

1. **Self-reported**: data dimasukkan pengguna.
2. **Team-confirmed**: aktivitas diakui dalam project.
3. **Institution-verified**: reviewer kampus menyetujui evidence.

UI selalu menampilkan level yang benar. Jangan memakai satu simbol “verified” untuk ketiga level.

## 6. Motivation dan Gamification

XP, badge, dan progress boleh membantu orientation dan completion, tetapi:

- Tidak meranking kesehatan sosial atau popularitas.
- Tidak menghukum student yang menolak invitation.
- Tidak mendorong spam task atau message.
- Tidak menggantikan evidence dan validation.
- Tidak menjadi elemen terbesar di dashboard.

## 7. Content Ranges

| Object            | Minimum | Typical | Maximum design case    |
| ----------------- | ------- | ------- | ---------------------- |
| Match reasons     | 1       | 3       | 5                      |
| Active projects   | 0       | 2–4     | 12                     |
| Project roles     | 1       | 3–6     | 20                     |
| Workspace members | 2       | 4–8     | 25                     |
| Tasks per view    | 0       | 15–40   | 250 paginated/filtered |
| Evidence files    | 0       | 1–4     | 20                     |
| Admin queue       | 0       | 20–100  | 10,000 paginated       |
| Portfolio entries | 0       | 6–12    | 100                    |

## 8. UX Success Signals

- Pengguna dapat menjelaskan alasan recommendation tanpa menyebut “AI tahu kondisi saya”.
- Student memahami perbedaan affiliation, contribution, dan portfolio verification.
- Campus admin dapat menemukan evidence dan policy basis tanpa membuka banyak halaman.
- Recruiter tidak menemukan jalan menuju inclusion data.
- Realtime update tidak menghilangkan input atau menggandakan item.
- Mobile user tetap dapat menyelesaikan critical flow tanpa horizontal overflow.
