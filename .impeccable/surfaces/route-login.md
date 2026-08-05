---
version: 1
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

Compact security docket dengan numbered receipt untuk OTP. Private username dijelaskan sebagai login-only. Phone dimasking setelah submit.

## Scope and Boundaries

Register, login, OTP verify/resend, password recovery, invitation acceptance, session expiry, dan phone delivery status. Tidak mencakup social login, email fallback, atau privileged public registration.

## States and Ranges

Unknown number, delivery queued/sent/failed, invalid/expired/replayed OTP, cooldown, attempts exhausted, username unavailable, invalid credentials, session expired, invitation expired.

## Interaction and Accessibility

OTP mendukung paste dan single logical label. Timer tidak diumumkan tiap detik. Error tidak mengungkap account existence. Focus menuju recovery message dan seluruh action dapat dijalankan keyboard.

## Constraints

Fonnte hanya delivery provider. SATU membuat dan memverifikasi OTP pada backend. Token tidak pernah mencapai browser.
