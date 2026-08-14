---
version: 2
slug: 'route-login'
primary_target: 'route:/login'
related_targets: ['route:/register', 'route:/recover']
---

# WhatsApp Authentication

## Job and Audience

Student atau invited operator ingin registrasi, login, atau recovery dengan aman memakai private username, password, dan nomor WhatsApp. Mode: **Operate**.

## Outcome and Proof

Pengguna menyelesaikan flow tanpa email, memahami cooldown/expiry, dan tidak terjebak ketika OTP atau delivery gagal.

## Selected Direction

Compact security docket dengan numbered receipt untuk OTP. Private username dijelaskan sebagai login-only. Phone dimasking setelah submit. Visual world **Buku Besar Kolaborasi** menyediakan receipt, ruled fields, dan validation mark sebagai keluarga bentuk. Pada desktop, panel kiri menjadi collaboration canvas yang mengikuti hero landing: gradasi biru muda, mascot transparan yang utuh, pesan singkat, dan catatan privasi. Form di panel kanan tetap menjadi working surface yang tenang.

## Scope and Boundaries

**Job:** Identity creation, login, password recovery, invitation acceptance, session management, dan OTP verification.
**Boundaries:** Mencakup register, login, OTP verify/resend, password recovery, invitation acceptance, session expiry, dan phone delivery status. Tidak mencakup social login, email fallback, privileged public registration (campus admin/recruiter), atau onboarding pasca-registrasi.
**Provider boundary:** Fonnte hanya delivery channel. SATU backend membuat, menyimpan, dan memverifikasi OTP. Token atau OTP tidak pernah mencapai browser atau client-side state.

## States and Ranges

### Auth States

- **Unknown number:** sebelum nomor WhatsApp disubmit.
- **Delivery queued:** OTP dikirim ke provider, menunggu konfirmasi delivery.
- **Delivery sent:** OTP berhasil dikirim ke nomor WhatsApp.
- **Delivery failed:** provider tidak dapat mengirim (timeout, nomor invalid, provider down). Recovery: resend atau ganti nomor.
- **OTP invalid:** kode tidak cocok. Tidak mengungkap apakah nomor terdaftar.
- **OTP expired:** kode melewati masa berlaku (default 5 menit). Recovery: resend.
- **OTP replayed:** kode yang sudah dipakai tidak dapat digunakan ulang.
- **Cooldown (resend):** jeda minimal 60 detik sebelum resend tersedia.
- **Cooldown (rate limit):** maksimal 3 percobaan per 15 menit per nomor.
- **Attempts exhausted:** percobaan OTP habis. Recovery: tunggu waktu reset atau mulai ulang.
- **Username unavailable:** saat registrasi, username sudah dipakai. Tidak mengungkap identitas pemilik.
- **Invalid credentials:** username atau password salah. Tidak membedakan mana yang salah.
- **Session expired:** token session kedaluwarsa. Recovery: login ulang.
- **Invitation expired:** invitation link melewati masa berlaku. Recovery: minta undangan ulang.
- **Offline:** tidak ada koneksi. Form tetap terlihat, current input tidak hilang. Recovery action: retry saat online.
- **Privacy:** nomor dimasking setelah submit (hanya 3 digit awal + 2 digit akhir). Error tidak membocorkan account existence. Token tidak mencapai browser.

## Interaction and Accessibility

### Keyboard

Seluruh flow dapat diselesaikan keyboard: Tab antar field, Enter untuk submit, Escape untuk dismiss overlay. OTP field mendukung navigation antar digit dengan Arrow Left/Right. Focus dialihkan ke error summary setelah submit gagal. Focus tetap pada field saat cooldown timer berjalan.

### Screen Reader

OTP memiliki single logical label per group, bukan label per digit. Timer tidak diumumkan setiap detik; hanya diumumkan saat tersedia kembali. Error tidak mengungkap account existence. Live region mengumumkan "Kode dikirim ke WhatsApp Anda" setelah delivery berhasil dan "Pengiriman gagal. Periksa nomor atau coba lagi." setelah delivery gagal. Decorative frame dan receipt border disembunyikan dari screen reader.

### Reduced Motion

`prefers-reduced-motion` menonaktifkan: OTP digit transition, timer countdown animation, skeleton shimmer, dan success checkmark animation. Status delivery tetap tersedia melalui text dan status semantics tanpa bergantung pada animation.

### Mobile Consequence

Single column pada 320px. Nomor WhatsApp input memakai `inputmode="numeric"`. OTP receipt compact dengan digit input ukuran besar (min 44px touch target). Recovery action tidak tertutup keyboard virtual. Tidak ada horizontal overflow.

## Constraints

Fonnte hanya delivery provider. SATU membuat dan memverifikasi OTP pada backend. Token tidak pernah mencapai browser.

## Loading Contract

Loading mengikuti [LOADING_STATES.md](../../docs/ux/LOADING_STATES.md).

- Initial page load: app shell dan heading tetap stabil, form login/register memakai skeleton geometry yang mempertahankan field count dan action button.
- OTP delivery: form dan recovery action tetap terlihat. Delivery status menggunakan inline progress (Spinner) pada button dan status text, bukan full-page skeleton.
- Deferred history: region delivery history (bila ditampilkan) memakai skeleton dengan jumlah baris realistis.
- Processing: submit, resend, dan logout memakai inline Spinner pada button dengan disabled state. Content form tetap terlihat.
- Error/empty/timeout: pesan pemulihan menggantikan skeleton. Retry action tersedia.
- Empty: tidak ada delivery history kosong tanpa explanation.
- Keyboard dan screen reader: region loading memiliki `aria-busy="true"` dan satu `role="status"` polite announcement. Skeleton block dekoratif disembunyikan.
