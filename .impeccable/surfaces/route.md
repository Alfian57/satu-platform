---
version: 2
slug: 'route'
primary_target: 'route:/'
related_targets: ['route:/register', 'route:/login']
---

# SATU Product Landing dan Synthetic Network Demo

## Job and Audience

Student, campus leader, recruiter, dan competition evaluator menilai apa itu SATU, bagaimana opportunity menjadi verified proof, serta batas privacy produk. Mode: **Persuade**.

- **Student**: mencari tempat menemukan tim, proyek, dan kontribusi yang dapat divalidasi. Nilai: kolaborasi terstruktur tanpa harus sudah punya circle.
- **Campus leader**: menilai apakah SATU dapat menjadi alat operasi afiliasi dan validasi kontribusi. Nilai: roster, manual review, dan campus operations.
- **Recruiter**: ingin tahu apakah portofolio mahasiswa dapat ditemukan tanpa melanggar privasi. Nilai: Talent Portal dengan batas visibility yang dikendalikan mahasiswa.
- **Competition evaluator**: menilai kejujuran klaim, batas implementasi, dan pembedaan data synthetic.

## Outcome and Proof

Pengunjung dapat menjelaskan alur `opportunity -> team -> work -> validation -> portfolio`, mengetahui bahwa graph demo synthetic dan non-diagnostic, lalu memilih CTA yang sesuai.

## Selected Direction

Live record of opportunity-to-proof dalam visual world **Buku Besar Kolaborasi**. First viewport menunjukkan mekanisme nyata melalui ledger yang berkembang menjadi graph dan verified contribution, bukan generic hero dengan floating cards.

Landing disusun sebagai lembaran yang dapat digulir: first viewport membawa offer, mechanism cue, dan primary CTA yang langsung menunjukkan cara kerja SATU. Scrolling mengungkap lifecycle evidence: satu node contribution tumbuh menjadi hubungan kolaborasi dan berakhir sebagai portfolio dengan stamp validasi. Graph demo interaktif memungkinkan pengunjung memilih node, melihat hubungan, dan membandingkan lewat table equivalent. Setiap demo record memiliki label synthetic.

### Implemented Direction Contract

- First viewport memakai **SATU collaboration mascot**: offer dan CTA berada di working column kiri, sedangkan maskot buku besar transparan dengan node kolaborasi, kartu validasi, token check, dan lencana validasi berada di kanan sebagai konteks mekanisme.
- Maskot tidak ditempatkan di dalam panel ber-background. Aura biru, teal, indigo, dan gold yang lembut memberi fokus visual tanpa menghilangkan transparansi asset. Container utama memakai lebar maksimum 110rem agar komposisi terasa lapang di desktop.
- Visual landing memakai Blue Current Ledger: seluruh page memiliki gradasi biru berlapis yang airy, sedangkan surface dan penanda tahap memakai skala putih-biru yang konsisten.
- Motion thesis adalah blue wash satu kali saat hero masuk, lalu flow ledger menulis lima tahap secara berurutan di bagian Cara Kerja. Hover, selection, dan filter memberi feedback terhadap hubungan yang berubah, dengan reduced-motion fallback.
- Rounded index, validation stamp, dan custom SVG lifecycle glyph mempertahankan material SATU dalam komposisi yang lebih ringan dan kontemporer.
- Copy dirapikan dalam bahasa Indonesia tanpa mengubah product boundary. CTA mahasiswa memakai route registration yang ada; CTA kampus dan recruiter memakai anchor ke privacy boundary karena belum ada public discussion endpoint.
- Hero memakai satu mascot bitmap asset yang bersifat ilustratif, tanpa text, logo, atau data. Asset transparan dengan aksesoris kontekstual dikompresi WebP di bawah 300 KB agar tidak mengaburkan provenance dan batas data.

## Scope and Boundaries

Offer, mechanism, role value, interactive synthetic graph, privacy promise yang dapat dibuktikan, limitation copy, dan role-specific CTA. Tidak mencakup invented customer, price, testimonial, pilot statistic, impact result, atau partner logo.

Privacy proof diwujudkan melalui affordance: synthetic graph hanya menampilkan data yang diizinkan, table menampilkan batas kolom yang tidak mengekspos username, phone, atau private evidence. Label "Data synthetic" muncul pada setiap demo record.

## States and Ranges

- **JavaScript ready**: graph interaktif, filter, focus node, reset, dan CTA aktif.
- **No-JavaScript fallback**: static ledger atau table equivalent menggantikan canvas/SVG, dengan semantic heading, label, dan CTA yang tetap berfungsi.
- **Reduced motion**: graph kehilangan transition dan animation, hubungan ditampilkan sebagai static rendering, preferensi dihormati tanpa menghilangkan informasi.
- **Keyboard alternative**: table atau list equivalent untuk setiap filter state; navigasi keyboard tidak dipaksa menelusuri setiap decorative edge.
- **Loading**: deferred skeleton di bawah critical content, skeleton mempertahankan geometry region demo tanpa layout shift, heading dan CTA tetap terlihat.
- **Empty**: graph region kosong sebelum data demo pertama dimuat, bukan chart rusak.
- **Error**: network error menggantikan skeleton dengan pesan pemulihan dan retry.
- **Stale**: synthetic graph memiliki freshness cue dan tombol reset/reload.

Demo states: idle, focus node, filter, reset, keyboard table alternative. CTA: competition demo, student registration, campus discussion, atau recruiter interest sesuai release state.

## Interaction and Layout

First viewport memuat offer, mechanism cue, dan primary CTA. Scroll mengungkap evidence lifecycle. Demo memungkinkan memilih node dan filter collaboration type dengan table equivalent. Motion hanya menjelaskan hubungan dan hilang pada reduced motion.

Layout responsif: pada mobile CTA tetap berada dekat offer tanpa hidden overflow; pada tablet graph dan table ditumpuk vertikal; pada desktop split antara graph dan context table memungkinkan eksplorasi paralel. Kontrol filter dan reset tetap accessible di semua viewport.

## Accessibility and Performance

Canvas atau SVG memiliki text alternative dan equivalent list/table. Keyboard tidak dipaksa menavigasi setiap decorative edge. Semua target interaktif memiliki pointer cursor; disabled target menunjukkan not-allowed cursor.

Performance boundary: Target Core Web Vitals LCP maksimal 2.5 detik, INP maksimal 200ms, dan CLS maksimal 0.1. Graph demo dilazy-load di bawah critical content. Total asset grafis landing maksimal 300 KB (compressed), termasuk mascot hero. Static first viewport tetap rendering penuh meskipun graph tertunda.

Font menggunakan Familjen Grotesk dengan fallback system-ui, sans-serif; label teknis memakai Azeret Mono dengan fallback ui-monospace, monospace. Theme light dan dark didukung, dengan pasangan canvas yang sama untuk mencegah flash.

## Constraints and Gates

Semua demonstration record dilabeli `Data synthetic`. CTA dan claim mengikuti capability yang benar-benar tersedia saat release. Copy product dalam bahasa Indonesia dengan istilah canonical dari CONTENT_ACCESSIBILITY.md. Tidak menggunakan Unicode em dash pada UI atau dokumentasi.

Graph tidak boleh menampilkan label stigmatisasi, mental-health inference, username, phone, atau private evidence. Inclusion signal tidak pernah tampil pada landing. Recruiter projection hanya menunjukkan data portofolio yang diizinkan, bukan raw audit atau discussion.

## Loading Contract

Loading mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md). Ketentuan spesifik untuk landing:

- **Initial page load**: App shell, heading, dan primary CTA tetap stabil. Demo region menggunakan skeleton per region yang mempertahankan geometry, spacing, dan row count realistis.
- **Deferred region**: Graph demo dimuat deferred dengan skeleton `aria-busy="true"` dan satu `role="status"` atau `aria-live="polite"` announcement. Critical content di atasnya tetap dapat dibaca.
- **Refresh dan reset**: Tombol reset/filter mempertahankan content yang sudah ada hingga data baru siap; filter state tidak hilang.
- **Processing action**: CTA registration atau login memakai inline progress/Spinner pada button, bukan mengganti seluruh landing dengan skeleton.
- **Error dan recovery**: Network error pada demo graph ditampilkan sebagai pesan pemulihan dengan tombol retry, bukan skeleton abadi.
- **Empty state**: Region demo sebelum data pertama dimuat dikomunikasikan sebagai "Menyiapkan demo kolaborasi", bukan chart kosong.
- **Reduced motion**: Skeleton animation dihentikan pada `prefers-reduced-motion`; informasi loading tetap tersedia melalui text/status semantics.

Skeleton menggunakan component `resources/js/components/ui/skeleton.tsx`, neutral surface token, dan spacing yang sama dengan content final. Focus order dipertahankan dan tidak ada layout shift atau horizontal overflow.
