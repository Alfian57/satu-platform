# Loading States SATU

Dokumen ini menjadi kontrak global untuk loading state pada seluruh surface
frontend SATU. Loading adalah state normal pada mode **Operate**, bukan alasan
untuk mengganti seluruh halaman dengan placeholder yang tidak memiliki konteks.

## Prinsip

- Pertahankan hierarchy, geometry, dan konteks action selama data dimuat.
- Gunakan skeleton untuk initial load, deferred region, refresh, dan pagination.
- Pertahankan content yang sudah tersedia ketika hanya sebagian region yang sedang dimuat.
- Empty bukan loading. Empty state menjelaskan alasan kosong dan memiliki next action bila tersedia.
- Processing pada command atau form memakai inline progress/status. Jangan mengganti seluruh content dengan skeleton setelah pengguna menekan action.
- Loading tidak boleh menghilangkan primary action yang sudah dapat dipakai.
- Synthetic fixture harus tetap diberi label dan tidak boleh menjadi fallback production secara diam-diam.

## Skeleton Contract

Gunakan existing component Skeleton dari resources/js/components/ui/skeleton.tsx. Setiap skeleton harus:

1. mempertahankan ukuran, spacing, dan urutan region content sebenarnya;
2. memakai jumlah row yang realistis untuk minimum dan typical content;
3. berada di dalam region yang memiliki aria-busy="true";
4. memiliki satu role="status" atau aria-live="polite" announcement yang menjelaskan region yang sedang dimuat;
5. menyembunyikan decorative block dari screen reader agar tidak dibaca sebagai content palsu;
6. mempertahankan focus order dan tidak memindahkan focus secara otomatis;
7. tidak menimbulkan document-level horizontal overflow atau layout shift.

Shimmer bukan requirement. Animation boleh dipakai sebagai supporting cue, tetapi prefers-reduced-motion wajib menonaktifkannya dan informasi loading harus tetap tersedia melalui text/status semantics.

## Loading Granularity

### Initial page load

Gunakan skeleton per region. App shell, page heading, breadcrumb, dan primary action tetap stabil bila server sudah mengirimkannya. Jangan menggunakan blank full-page spinner ketika struktur halaman sudah diketahui.

### Deferred region

Ganti hanya region yang menunggu data, misalnya recommendation, queue, chart, atau ledger. Region lain tetap dapat dibaca dan digunakan.

### Pagination dan refresh

Pertahankan row yang sudah ada, lalu tambahkan skeleton row di posisi data yang akan masuk. Refresh tidak boleh menghapus filter, scroll position, atau selected item tanpa alasan yang dapat dipahami.

### Processing action

Button atau form yang sedang mengirim memakai Spinner, disabled state yang jelas, atau inline progress. Content sebelumnya tetap terlihat sampai server memberikan outcome.

## State Transition

Setiap region harus memiliki transition yang dapat diuji:

loading -> success, loading -> empty, loading -> error, loading -> forbidden, dan loading -> stale.

Error atau timeout menggantikan skeleton dengan pesan pemulihan dan retry. Forbidden menjelaskan batas permission tanpa membocorkan resource. Stale menampilkan timestamp atau freshness cue dan menyediakan reload/reconcile action.

## Accessibility

- Gunakan aria-busy="true" hanya pada region yang benar-benar memuat data.
- Sediakan announcement singkat seperti “Memuat daftar project aktif.”
- Jangan mengumumkan setiap skeleton block secara terpisah.
- Jangan memakai warna atau animation sebagai satu-satunya indikator.
- Pertahankan keyboard order, visible focus, dan screen-reader landmark.
- Uji zoom 200%, reflow, dark mode, reduced motion, dan content terpanjang.

## Empty Data Boundary

Ketika query berhasil tetapi tidak memiliki record, render empty state yang menjelaskan:

- data apa yang belum tersedia;
- apakah pengguna dapat membuat atau melengkapi data;
- CTA untuk next action;
- apakah source bersifat synthetic, sandbox, atau production.

Chart tanpa data tidak boleh dirender sebagai garis kosong yang tampak rusak. Gunakan explanation dan CTA, lalu tampilkan chart setelah data pertama tersedia.

## Acceptance dan Evidence

Setiap frontend issue wajib menguji:

- initial, deferred, pagination, refresh, empty, error, forbidden, stale, dan partial-data state yang relevan;
- geometry pada 320px, tablet, small laptop, dan desktop;
- keyboard dan screen reader announcement;
- reduced motion tanpa essential information loss;
- tidak ada layout shift atau horizontal overflow;
- screenshot atau recording untuk skeleton dan transition ke success/error.
