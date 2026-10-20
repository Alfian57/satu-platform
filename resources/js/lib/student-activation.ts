import type { StudentActivation } from '@/types/onboarding';

export function isAffiliationAwaitingReview(
    activation: StudentActivation | null | undefined,
): boolean {
    return Boolean(
        activation &&
        activation.universityState === 'ready' &&
        activation.phoneVerified &&
        activation.membershipStatus === 'pending' &&
        activation.affiliationStatus === 'pending_review' &&
        !activation.needsRosterRefresh,
    );
}

export function activationNotice(
    activation: StudentActivation | null | undefined,
): {
    title: string;
    description: string;
    locked: boolean;
} {
    if (!activation || activation.universityState !== 'ready') {
        return {
            title: 'Aktivasi kampus belum tersedia',
            description:
                'Universitas belum tersedia atau belum aktif. Akun dan data tersimpan tidak diubah. Hubungi pengelola SATU, lalu periksa status kembali.',
            locked: true,
        };
    }

    if (activation.membershipStatus === 'suspended') {
        return {
            title: 'Akses kampus ditangguhkan',
            description:
                'Menu kolaborasi belum dapat dibuka. Riwayat tetap disimpan, tetapi profil dan bukti tidak ditampilkan. Hubungi Admin Universitas untuk peninjauan akses. Mengirim NIM ulang tidak memulihkan akses.',
            locked: true,
        };
    }

    if (!activation.phoneVerified) {
        return {
            title: 'Nomor WhatsApp perlu diverifikasi',
            description:
                'Afiliasi memerlukan nomor WhatsApp terverifikasi. Hubungi pengelola SATU untuk pemulihan verifikasi nomor. Isian profil belum dikirim.',
            locked: true,
        };
    }

    if (
        activation.affiliationStatus === 'revision_required' ||
        activation.affiliationStatus === 'rejected'
    ) {
        return {
            title:
                activation.affiliationStatus === 'rejected'
                    ? 'Afiliasi perlu diperiksa kembali'
                    : 'Isian afiliasi perlu diperbaiki',
            description:
                'Periksa NIM yang terdaftar dan nomor WhatsApp terverifikasi. Hubungi Admin Universitas jika membutuhkan penjelasan keputusan, lalu kirim isian yang telah diperbaiki. Profil baru disimpan setelah afiliasi terverifikasi.',
            locked: false,
        };
    }

    if (activation.membershipStatus === 'pending') {
        return {
            title: 'Menunggu verifikasi afiliasi',
            description: activation.needsRosterRefresh
                ? 'Daftar mahasiswa telah diperbarui. Periksa kembali isian, lalu kirim NIM untuk verifikasi ulang. Riwayat peninjauan tetap disimpan dan profil belum dikirim.'
                : 'Pengajuanmu sudah diterima dan menunggu verifikasi Admin Universitas. Kamu tidak perlu mengajukan ulang. Fakultas, program studi, dan angkatan masuk akan terisi otomatis di Profil kemampuan setelah afiliasi disetujui.',
            locked: false,
        };
    }

    return {
        title:
            activation.membershipStatus === 'verified'
                ? 'Afiliasi terverifikasi'
                : 'Verifikasi status mahasiswamu',
        description:
            activation.membershipStatus === 'verified'
                ? 'Akses kampus sudah tersedia. Mulai dari kemampuan atau minatmu, tanpa wajib memiliki karya atau pengalaman proyek.'
                : 'Masukkan NIM untuk memverifikasi status mahasiswa. SATU mencocokkannya dengan nomor WhatsApp terverifikasi pada daftar mahasiswa. Jika belum cocok, Admin Universitas akan meninjau. Pendaftaran akun saja belum memverifikasi afiliasi.',
        locked: false,
    };
}
