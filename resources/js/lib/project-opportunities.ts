export type CapacityStats = {
    total: number;
    occupied: number;
    remaining: number;
    accepting: boolean;
};

export function beginnerLabel(value: boolean | null | undefined): string {
    return value === true
        ? 'Menerima pemula'
        : value === false
          ? 'Membutuhkan pengalaman'
          : 'Penerimaan pemula belum dinyatakan';
}

export function capacityLabel(
    stats: CapacityStats | undefined,
    total: number,
): string {
    return stats
        ? `${stats.occupied} terisi dari ${stats.total}. ${stats.remaining} tempat tersisa.`
        : `Total ${total} orang. Data terisi belum tersedia.`;
}

export function opportunityStatus(
    stats: CapacityStats | undefined,
    status: string,
    deadline: string,
): string {
    if (new Date(deadline).getTime() <= Date.now()) {
        return 'Batas pengajuan sudah lewat.';
    }

    if (status === 'full' || stats?.remaining === 0) {
        return 'Kapasitas tim penuh.';
    }

    if (!['open', 'forming'].includes(status)) {
        return 'Pengajuan tidak dibuka.';
    }

    return stats?.accepting
        ? 'Pengajuan masih dibuka. Tempat dapat berubah.'
        : 'Periksa tempat dan izin pada detail proyek.';
}
