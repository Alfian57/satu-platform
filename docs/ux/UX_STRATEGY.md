# UX Strategy SATU

## Experience Thesis

SATU terasa seperti buku besar kolaborasi yang hidup: opportunity masuk, keputusan dapat dijelaskan, pekerjaan meninggalkan evidence, validation memberi provenance, dan student tetap mengendalikan projection ke dunia luar.

Application surface memakai mode **Operate**. Public portfolio dapat memakai **Experience**. Landing memakai **Persuade**. Interaktif dan eye-catching dicapai melalui struktur, progressive disclosure, meaningful motion, live status, dan direct manipulation yang accessible, bukan ornament yang menutupi informasi.

## Prinsip

1. Opportunity, bukan diagnosis.
2. Explain before asking.
3. Provenance over decoration.
4. Satu meaningful next action per state.
5. Privacy control ditempatkan dekat akibatnya.
6. Loading, offline, reconnect, stale, forbidden, dan recovery adalah normal state.
7. Competition tetap sehat: verified effort dihargai, cohort kecil dilindungi, dan individual ranking opt-in.

Loading mengikuti kontrak [LOADING_STATES.md](./LOADING_STATES.md). Skeleton
mempertahankan geometry dan context per region, sedangkan processing command
memakai inline progress. Full-page placeholder tidak menjadi default.

## Persona

- Student yang belum memiliki circle proyek.
- Project initiator yang membutuhkan skill dan availability yang tepat.
- Campus operator yang harus menyelesaikan queue dengan aman.
- Platform operator yang memprovisi institution dan recruiter.
- Recruiter yang memerlukan verified evidence dengan batas privasi jelas.

## Trust Model

Setiap decision object menjawab: data apa yang dipakai, siapa yang dapat melihatnya, siapa yang memvalidasi, kapan berubah, dan bagaimana memperbaikinya. Username, phone, private evidence, messages, audit detail, inclusion signal, serta provider secret tidak boleh bocor melalui projection.

## Gamification

XP dan badge mengikuti verified contribution. Leaderboard memberi konteks perkembangan, bukan nilai diri. Program studi dan team tampil default jika cohort cukup. Individual memerlukan opt-in dan dapat dicabut. Tie berbagi rank, reduced motion dihormati, dan celebration tidak menghalangi task.

## Motion

Motion menunjukkan sebab-akibat: issue atau task berpindah, sync berubah status, contribution mendapat stamp, graph terfilter, atau notification masuk. Semua essential action tetap tersedia tanpa drag dan tanpa animation. `prefers-reduced-motion` menghilangkan gerakan non-esensial.

## Success Signals

- Student memahami status affiliation dan langkah recovery.
- Match explanation dapat dipahami tanpa membaca score internal.
- Reviewer dapat membedakan evidence, history, dan pending action.
- Recruiter memahami batas visibility sebelum contact request.
- Synthetic demo tidak dapat disalahartikan sebagai pilot evidence.
