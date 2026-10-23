import { Link } from '@inertiajs/react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { show as portfolioShow } from '@/routes/portfolio';
import type { TeamFormationState } from '@/types/project';
import { TeamCriteriaCard } from './team-criteria-card';
import { TeamSection } from './team-section';
import { formatDate } from './team-utils';
import type { Decision } from './team-utils';

type Props = {
    requests: TeamFormationState['join_requests'];
    capacityState: TeamFormationState['capacity']['state'];
    blocked: boolean;
    onOpenDecision: (target: Decision) => void;
};

export function TeamRequestQueue({
    requests,
    capacityState,
    blocked,
    onOpenDecision,
}: Props) {
    return (
        <TeamSection
            title="Pengajuan yang perlu ditinjau"
            id="team-request-queue"
        >
            <p className="text-sm leading-6 text-muted-foreground">
                Pertimbangkan kebutuhan peran, kemampuan yang dinyatakan, dan
                ketersediaan. Tidak ada skor popularitas atau syarat karya
                terdahulu.
            </p>
            {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Belum ada pengajuan bergabung yang menunggu keputusan.
                </p>
            ) : (
                <ul
                    aria-label="Pengajuan bergabung yang menunggu keputusan"
                    className="grid min-w-0 gap-3"
                >
                    {requests.map((request) => (
                        <li
                            key={request.id}
                            data-test={`team-join-request-${request.id}`}
                            className="grid min-w-0 gap-3 border-b border-border py-4 last:border-b-0"
                        >
                            <div className="flex flex-wrap justify-between gap-2">
                                <p className="flex gap-2 font-semibold wrap-anywhere">
                                    <Inbox
                                        aria-hidden="true"
                                        className="mt-1 size-4 shrink-0 text-primary"
                                    />
                                    {request.requester?.name ?? 'Mahasiswa'}{' '}
                                    meminta bergabung
                                </p>
                                <span className="text-xs leading-5 text-muted-foreground">
                                    {formatDate(request.requested_at)}
                                </span>
                            </div>
                            <TeamCriteriaCard role={request.role} />
                            <p className="text-sm leading-6 wrap-anywhere whitespace-pre-line text-muted-foreground">
                                {request.message ??
                                    'Pengajuan lama belum menyertakan ringkasan kemampuan dan ketersediaan.'}
                            </p>
                            <div className="grid gap-2 rounded-xl border border-border bg-card p-3">
                                <p className="text-sm font-semibold">
                                    Karya yang diizinkan untuk dibaca
                                </p>
                                {!request.shared_work?.length ? (
                                    <p className="text-xs leading-5 text-muted-foreground">
                                        Tidak ada karya yang dibagikan di sini.
                                        Bukan tanda kurang kemampuan.
                                    </p>
                                ) : (
                                    <ul className="grid gap-3">
                                        {request.shared_work.map((work) => (
                                            <li
                                                key={work.id}
                                                className="grid min-w-0 gap-1 text-sm wrap-anywhere"
                                            >
                                                <Link
                                                    href={portfolioShow(
                                                        work.id,
                                                    )}
                                                    className="w-fit cursor-pointer rounded-md font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
                                                >
                                                    {work.title}
                                                </Link>
                                                <p className="line-clamp-3 leading-6 text-muted-foreground">
                                                    {work.summary}
                                                </p>
                                                <span className="text-xs leading-5 text-muted-foreground">
                                                    {work.verification_label}.
                                                    Pengakuan kontribusi ini,
                                                    bukan verifikasi seluruh
                                                    kemampuan.
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                <Button
                                    type="button"
                                    disabled={
                                        blocked ||
                                        request.can_accept === false ||
                                        capacityState !== 'open'
                                    }
                                    className="min-h-11 whitespace-normal"
                                    data-test={`accept-join-request-${request.id}`}
                                    onClick={() =>
                                        onOpenDecision({
                                            kind: 'accept-request',
                                            id: request.id,
                                            person:
                                                request.requester?.name ??
                                                'mahasiswa',
                                            revision: request.revision,
                                            role: request.role,
                                        })
                                    }
                                >
                                    Terima pengajuan
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={blocked}
                                    className="min-h-11 whitespace-normal"
                                    data-test={`reject-join-request-${request.id}`}
                                    onClick={() =>
                                        onOpenDecision({
                                            kind: 'reject-request',
                                            id: request.id,
                                            person:
                                                request.requester?.name ??
                                                'mahasiswa',
                                            revision: request.revision,
                                            role: request.role,
                                        })
                                    }
                                >
                                    Tolak pengajuan
                                </Button>
                            </div>
                            {(request.can_accept === false ||
                                capacityState !== 'open') && (
                                <p className="text-xs leading-5 text-muted-foreground">
                                    Penerimaan belum tersedia karena kapasitas
                                    tim/peran, keanggotaan, status, atau
                                    tenggat. Penolakan dengan alasan tetap
                                    tersedia.
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </TeamSection>
    );
}
