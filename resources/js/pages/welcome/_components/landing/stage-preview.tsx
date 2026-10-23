import {
    ArrowRight,
    BookOpen,
    Check,
    ClipboardCheck,
    Clock3,
    FileText,
    Info,
    LockKeyhole,
    Send,
    UserRound,
    UsersRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BorrowingSketch from '@/pages/welcome/_components/landing/borrowing-sketch';
import type { JourneyStage } from '@/pages/welcome/_utils/landing-journey';

export const stageVisuals = [
    {
        title: 'Bekal pertama Budi',
        eyebrow: 'Profil kemampuan',
        icon: UserRound,
    },
    { title: 'Ruang Baca Kampus', eyebrow: 'Peluang proyek', icon: BookOpen },
    { title: 'Minat bergabung Budi', eyebrow: 'Pengajuan peran', icon: Clock3 },
    {
        title: 'Satu tim, peran berbeda',
        eyebrow: 'Keputusan tim',
        icon: UsersRound,
    },
    { title: 'Rancangan alur peminjaman', eyebrow: 'Ruang kerja', icon: Check },
    {
        title: 'Bagian yang Budi kerjakan',
        eyebrow: 'Kontribusi individual',
        icon: Send,
    },
    {
        title: 'Keputusan atas kontribusi',
        eyebrow: 'Tinjauan kampus',
        icon: ClipboardCheck,
    },
    { title: 'Karya pertama Budi', eyebrow: 'Portofolio', icon: LockKeyhole },
];

export interface StagePreviewProps {
    index: number;
    stage: JourneyStage;
    needsAttention: boolean;
}

export default function StagePreview({
    index,
    stage,
    needsAttention,
}: StagePreviewProps) {
    const visual = stageVisuals[index];
    const StatusIcon = needsAttention ? Info : visual.icon;

    return (
        <article className="journey-preview" data-stage={stage.id}>
            <div className="journey-preview-label">
                <span className="journey-preview-kind">
                    <visual.icon aria-hidden="true" className="size-4" />
                    {visual.eyebrow}
                </span>
                <span>Pratinjau</span>
            </div>
            {index === 0 && (
                <div className="journey-profile">
                    <span className="journey-avatar" aria-hidden="true">
                        B
                    </span>
                    <div>
                        <p className="journey-profile-name">Budi</p>
                        <p>Ingin belajar desain antarmuka</p>
                        <span className="journey-profile-tag">
                            Terbuka untuk belajar
                        </span>
                    </div>
                </div>
            )}
            {index === 1 && (
                <div className="journey-project-cover" aria-hidden="true">
                    <div className="journey-book-spines">
                        <span />
                        <span />
                        <span />
                    </div>
                    <span>
                        Ruang untuk membaca.
                        <br />
                        Ruang untuk berkarya.
                    </span>
                </div>
            )}
            {index === 2 && (
                <div className="journey-application">
                    <span
                        className="journey-avatar journey-avatar--small"
                        aria-hidden="true"
                    >
                        B
                    </span>
                    <p>
                        <strong>Budi</strong>
                        <span>mengajukan peran desainer antarmuka</span>
                    </p>
                    <ArrowRight
                        aria-hidden="true"
                        className="journey-application-arrow size-5"
                    />
                    <span
                        className="journey-avatar journey-avatar--small journey-avatar--ink"
                        aria-hidden="true"
                    >
                        S
                    </span>
                </div>
            )}
            {index === 3 && (
                <div className="journey-team">
                    <div>
                        <span
                            className="journey-avatar journey-avatar--small"
                            aria-hidden="true"
                        >
                            B
                        </span>
                        <strong>Budi</strong>
                        <span>
                            {needsAttention
                                ? 'Belum bergabung'
                                : 'Desainer antarmuka'}
                        </span>
                    </div>
                    <span className="journey-team-connector" aria-hidden="true">
                        {needsAttention ? (
                            <LockKeyhole className="size-4" />
                        ) : (
                            <UsersRound className="size-4" />
                        )}
                    </span>
                    <div>
                        <span
                            className="journey-avatar journey-avatar--small journey-avatar--ink"
                            aria-hidden="true"
                        >
                            S
                        </span>
                        <strong>Siti</strong>
                        <span>Pengembang aplikasi</span>
                    </div>
                </div>
            )}
            {(index === 4 || index === 7) && (
                <div
                    className={cn(
                        'journey-work-sample',
                        index === 7 && 'journey-work-sample--portfolio',
                    )}
                >
                    <BorrowingSketch />
                    {index === 7 && (
                        <span className="journey-private-label">
                            <LockKeyhole
                                aria-hidden="true"
                                className="size-3.5"
                            />
                            Karya privat
                        </span>
                    )}
                </div>
            )}
            {index === 5 && (
                <div className="journey-evidence">
                    <FileText className="size-8 shrink-0" aria-hidden="true" />
                    <div>
                        <strong>Rancangan alur peminjaman</strong>
                        <span>Bukti contoh milik Budi</span>
                    </div>
                    <LockKeyhole
                        className="size-4 shrink-0"
                        aria-hidden="true"
                    />
                </div>
            )}
            {index === 6 && (
                <div
                    className={cn(
                        'journey-review',
                        needsAttention && 'journey-review--revision',
                    )}
                >
                    <StatusIcon
                        className="size-7 shrink-0"
                        aria-hidden="true"
                    />
                    <div>
                        <strong>
                            {needsAttention
                                ? 'Lengkapi, lalu ajukan kembali.'
                                : 'Pekerjaan Budi mendapat pengakuan.'}
                        </strong>
                        <span>Keputusan peninjau pada contoh ini</span>
                    </div>
                </div>
            )}
            <div className="journey-preview-content">
                <h5>
                    {needsAttention && index === 3
                        ? 'Kapasitas peran sudah penuh'
                        : visual.title}
                </h5>
                <p
                    data-testid="journey-status"
                    className={cn(
                        'journey-status',
                        needsAttention && 'journey-status--attention',
                    )}
                >
                    <StatusIcon
                        aria-hidden="true"
                        className="size-4 shrink-0"
                    />
                    {stage.status}
                </p>
                <dl className="journey-facts">
                    {stage.facts.map(([label, value]) => (
                        <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                </dl>
            </div>
            <p className="journey-preview-footer">
                <FileText aria-hidden="true" className="size-3.5 shrink-0" />
                Contoh tampilan, bukan data akunmu.
            </p>
        </article>
    );
}
