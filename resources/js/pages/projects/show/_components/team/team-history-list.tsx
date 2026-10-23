import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { index as projectsIndex } from '@/routes/projects';
import type { TeamFormationState } from '@/types/project';
import { TeamSection } from './team-section';
import { formatDate } from './team-utils';

type Props = {
    owner: boolean;
    history: TeamFormationState['request_history'];
    blocked: boolean;
    onReloadPage: (page: number) => void;
};

const statusLabels: Record<string, string> = {
    accepted: 'Diterima',
    rejected: 'Belum diterima',
    withdrawn: 'Ditarik',
    expired: 'Berakhir',
};

export function TeamHistoryList({
    owner,
    history,
    blocked,
    onReloadPage,
}: Props) {
    return (
        <TeamSection
            title={
                owner ? 'Riwayat keputusan pengajuan' : 'Riwayat pengajuanmu'
            }
            id="team-request-history"
        >
            {!history?.data.length ? (
                <p className="text-sm text-muted-foreground">
                    Belum ada pengajuan selesai. Pengajuan menunggu ditampilkan
                    di atas.
                </p>
            ) : (
                <ul
                    className="grid min-w-0 gap-4"
                    aria-label="Riwayat pengajuan selesai"
                >
                    {history.data.map((request) => (
                        <li
                            key={request.id}
                            className="grid min-w-0 gap-2 border-b border-border pb-4 wrap-anywhere last:border-b-0"
                        >
                            <p className="font-semibold">
                                {owner &&
                                    `${request.requester?.name ?? 'Mahasiswa'}. `}
                                {request.role?.title ?? 'Peran umum'}
                            </p>
                            <p className="text-sm">
                                {statusLabels[request.status] ??
                                    'Status belum dikenali'}
                                {request.responded_at &&
                                    `, ${formatDate(request.responded_at)}`}
                            </p>
                            <p className="text-sm leading-6 text-muted-foreground">
                                {request.response_reason ??
                                    (request.status === 'withdrawn'
                                        ? 'Pengajuan ditarik. Tidak memesan tempat atau membentuk keanggotaan.'
                                        : 'Alasan belum tercatat pada pengajuan lama.')}
                            </p>
                            <p className="text-xs leading-5 text-muted-foreground">
                                {request.status === 'accepted'
                                    ? 'Keputusan ini tercatat pada waktunya. Akses ruang kerja mengikuti keanggotaan dan izin saat ini.'
                                    : owner
                                      ? 'Pemohon dapat mempertimbangkan peran lain. Riwayat ini tetap tersimpan.'
                                      : 'Kamu dapat mempertimbangkan peran lain. Pengajuan baru tidak menghapus riwayat ini.'}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
            {history && history.last_page > 1 && (
                <nav
                    aria-label="Halaman riwayat pengajuan"
                    className="flex flex-wrap items-center gap-2"
                >
                    <Button
                        type="button"
                        variant="outline"
                        disabled={blocked || history.current_page <= 1}
                        onClick={() => onReloadPage(history.current_page - 1)}
                        className="min-h-11"
                    >
                        Sebelumnya
                    </Button>
                    <span className="text-sm">
                        Halaman {history.current_page} dari {history.last_page}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={
                            blocked || history.current_page >= history.last_page
                        }
                        onClick={() => onReloadPage(history.current_page + 1)}
                        className="min-h-11"
                    >
                        Berikutnya
                    </Button>
                </nav>
            )}
            {!owner && (
                <Link
                    href={projectsIndex()}
                    className="w-fit cursor-pointer rounded-md text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
                >
                    Temukan peluang lain
                </Link>
            )}
        </TeamSection>
    );
}
