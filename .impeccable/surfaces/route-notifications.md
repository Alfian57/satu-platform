---
version: 2
slug: 'route-notifications'
primary_target: 'route:/notifications'
related_targets: ['route:/settings/notifications']
---

# Notification Center dan Preferences

## Job and Audience

Authenticated user ingin mengetahui perubahan penting dan mengatur kapan WhatsApp dipakai. Mode: **Operate**.

## Outcome and Proof

In-app center menjadi canonical history. User dapat filter, mark read, membuka deep link, dan mengatur purpose-specific WhatsApp preference.

## Selected Direction

Chronological dispatch ledger dengan unread marker, purpose tab, compact provenance, dan quiet bulk actions. Visual world **Buku Besar Kolaborasi** menyediakan ledger rows, status mark, dan timestamp sebagai keluarga bentuk.

## Scope and Boundaries

**Job:** Menampilkan daftar notifikasi canonical, memungkinkan filter, mark read/unread, deep link ke target resource, dan mengelola WhatsApp preference per purpose.
**Boundaries:** Auth dan mandatory security notice tidak dapat dimatikan jika diperlukan untuk keamanan. Raw provider payload, phone penuh, inclusion detail, dan private evidence tidak ditampilkan.
**Provider boundary:** Fonnte menangani delivery WhatsApp melalui backend adapter. Frontend hanya menampilkan status delivery, bukan raw callback atau provider payload.

## States and Ranges

### Notification States
- **Empty:** tidak ada notifikasi. Empty state menjelaskan "Belum ada notifikasi" tanpa next action wajib.
- **Unread:** marker visible (Pending Review colored indicator) di samping baris notification. Dapat ditandai sebagai read dengan satu klik atau bulk action.
- **Read:** tanpa marker; tetap muncul di history.
- **Stale:** deep link target sudah tidak tersedia (dihapus, expired, atau forbidden). Notifikasi tetap muncul dengan label "Tidak tersedia" dan tanpa link.
- **Delivery queued:** WhatsApp delivery menunggu antrian provider.
- **Delivery sent:** WhatsApp delivery berhasil.
- **Delivery failed:** WhatsApp delivery gagal. Notifikasi tetap muncul di in-app center. Status delivery memberikan informasi kegagalan tanpa membocorkan payload provider.

### Connection States
- **Offline:** daftar yang sudah dimuat tetap terlihat. Banner atau status bar menunjukkan "Anda sedang offline. Data per 12:30."
- **Reconnecting:** status bar atau indicator ringan, bukan full-page blocking.
- **Stale data:** timestamp freshness cue dengan reload action.

### Preference States
- **Save success:** confirmation inline, bukan toast.
- **Save error:** network error atau timeout. Recovery: retry.
- **Forbidden:** user tidak memiliki akses ke notification preference.

### Data Ranges
- 1 sampai 500 notifications, paginated.
- Filter: purpose tab (semua, proyek, kontribusi, undangan, keamanan).
- Bulk action: mark all read dalam satu purpose tab.

### Privacy
- Raw provider payload tidak pernah ditampilkan.
- Nomor WhatsApp penuh tidak muncul pada notification content.
- Inclusion signal dan private evidence tidak ditampilkan pada notification apa pun.
- Deep link menuju resource yang memerlukan permission akan menghasilkan forbidden state, bukan membocorkan data.

## Interaction and Layout

### Keyboard
Tab order: filter tab (Arrow Left/Right), notification list (Arrow Up/Down), action button per baris (Enter). Bulk action memiliki selection summary yang dapat difokuskan. Mark all read action dapat dijangkau keyboard. Deep link membuka target di tab baru dengan `Ctrl+Enter` atau tap biasa.

### Screen Reader
New notifications memakai polite announcement melalui `aria-live="polite"` dan tidak mencuri focus. Setiap notification row memiliki label yang menyebutkan purpose, title, timestamp, dan status read/unread. Bulk action memiliki selection summary "3 dari 10 dipilih." Status delivery tidak bergantung pada icon atau warna; setiap status memiliki text label. Empty state dimumkan sebagai "Belum ada notifikasi." Timestamp memakai format yang dapat dibaca screen reader.

### Reduced Motion
`prefers-reduced-motion` menonaktifkan: unread marker pulse, notification insertion animation, tab transition, dan skeleton shimmer. Status perubahan tetap tersedia melalui text. Real-time notification arrival memakai instant appearance tanpa slide/fade.

### Mobile Consequence
Single column pada 320px. Filter tab dapat discroll horizontal atau menjadi dropdown. Notification rows mempertahankan tap target minimum 44px. Bulk action tetap compact dan tidak menutupi list. Preference toggle memiliki label jelas dan tap target memadai. Deep link dapat di-tap untuk navigasi. Tidak ada horizontal overflow.

## Accessibility

New notifications memakai polite announcement dan tidak mencuri focus. Bulk action memiliki selection summary. Status provider tidak bergantung pada icon atau warna.

## Loading Contract

Loading mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md).

- Initial page load: app shell stabil, filter tab dan heading terlihat. Notification rows memakai skeleton per page dengan jumlah baris realistis (5-10 baris).
- Pagination: baris yang sudah ada tetap terlihat, skeleton baris baru muncul di bawah sebelum data pagination berikutnya masuk. Scroll position tidak hilang.
- Refresh: unread filter, bulk action, dan existing rows tetap stabil. Hanya baris baru yang memakai skeleton sementara.
- Processing: mark read, delete, dan preference save memakai inline Spinner/disabled state pada control terkait. Content list tetap terlihat.
- Empty: empty state dengan penjelasan, bukan skeleton tanpa akhir.
- Error/network error: pesan pemulihan dengan retry action. Data yang sudah dimuat tetap terlihat.
- Keyboard dan screen reader: region loading memiliki `aria-busy="true"` dan satu polite announcement "Memuat daftar notifikasi." Decorative skeleton block disembunyikan.
