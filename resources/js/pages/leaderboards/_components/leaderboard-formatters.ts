export function formatNumber(value: number | null): string {
    return value === null ? '-' : new Intl.NumberFormat('id-ID').format(value);
}

export function formatScore(value: string | null): string {
    if (value === null) {
        return '-';
    }

    return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 4,
        minimumFractionDigits: 2,
    }).format(Number(value));
}

export function formatLeaderboardDate(value: string | null): string {
    if (!value) {
        return 'Belum dihitung';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Waktu tidak tersedia';
    }

    return (
        new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'UTC',
        }).format(date) + ' UTC'
    );
}
