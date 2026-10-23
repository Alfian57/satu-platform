import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    Check,
    GraduationCap,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import type { KeyboardEvent } from 'react';
import LandingReveal from '@/pages/welcome/_components/landing-reveal';
import {
    AUDIENCE_TABS,
    AUDIENCES,
} from '@/pages/welcome/_utils/welcome-constants';
import type { AudienceKey } from '@/pages/welcome/_utils/welcome-constants';
import { dashboard, register } from '@/routes';

interface WelcomeAudienceSectionProps {
    activeAudience: AudienceKey;
    auth: { user?: unknown };
    onSelectAudience: (key: AudienceKey) => void;
    onMoveAudience: (
        event: KeyboardEvent<HTMLButtonElement>,
        index: number,
    ) => void;
}

export default function WelcomeAudienceSection({
    activeAudience,
    auth,
    onSelectAudience,
    onMoveAudience,
}: WelcomeAudienceSectionProps) {
    const audience = AUDIENCES[activeAudience];

    return (
        <div className="landing-lower">
            <section
                id="peran"
                aria-labelledby="roles-heading"
                className="landing-section landing-roles"
            >
                <div className="landing-container">
                    <div className="landing-section-intro">
                        <LandingReveal className="landing-role-intro">
                            <p className="landing-kicker">
                                <span className="landing-section-index">
                                    03
                                </span>
                                Berbeda peran, satu tujuan
                            </p>
                            <h2
                                id="roles-heading"
                                className="landing-section-title mt-4"
                            >
                                Mahasiswa berkarya.
                                <br />
                                <span className="text-satu-blue">
                                    Kampus melihat buktinya.
                                </span>
                            </h2>
                            <p className="mt-5 text-base leading-7 text-satu-muted">
                                Dua peran yang saling melengkapi. Pilih untuk
                                melihat cara masing-masing mendukung perjalanan
                                ini.
                            </p>
                        </LandingReveal>
                        <LandingReveal className="landing-role-bridge">
                            <div aria-hidden="true">
                                <p className="landing-role-bridge-caption">
                                    SATU RUANG KOLABORASI
                                </p>
                                <div className="landing-role-bridge-pair">
                                    <span>
                                        <GraduationCap />
                                        <strong>Mahasiswa</strong>
                                        <small>Mengambil peran</small>
                                    </span>
                                    <span className="landing-role-bridge-connector">
                                        <ArrowRight />
                                    </span>
                                    <span>
                                        <ShieldCheck />
                                        <strong>Admin Universitas</strong>
                                        <small>Meninjau kontribusi</small>
                                    </span>
                                </div>
                                <p className="landing-role-bridge-bottom">
                                    Kesempatan bertemu pengakuan.
                                </p>
                            </div>
                        </LandingReveal>
                    </div>
                    <div
                        role="tablist"
                        aria-label="Pilih peran di SATU"
                        className="landing-audience-tabs mt-8 flex flex-wrap gap-2"
                    >
                        {AUDIENCE_TABS.map((tab, index) => {
                            const Icon = tab.icon;
                            const active = tab.key === activeAudience;

                            return (
                                <button
                                    key={tab.key}
                                    id={`role-tab-${tab.key}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={active}
                                    aria-controls="role-panel"
                                    tabIndex={active ? 0 : -1}
                                    onClick={() => onSelectAudience(tab.key)}
                                    onKeyDown={(event) =>
                                        onMoveAudience(event, index)
                                    }
                                    className="landing-control landing-role-tab cursor-pointer"
                                >
                                    <Icon
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    {tab.label}
                                    {active && (
                                        <Check
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <section
                        id="role-panel"
                        role="tabpanel"
                        aria-labelledby={`role-tab-${activeAudience}`}
                        tabIndex={0}
                        className="landing-role-panel mt-6"
                    >
                        <div
                            key={activeAudience}
                            className="landing-panel-enter grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:items-center lg:gap-16"
                        >
                            <div className="landing-role-copy min-w-0">
                                <div
                                    className="landing-role-mark"
                                    aria-hidden="true"
                                >
                                    {activeAudience === 'student' ? (
                                        <UsersRound />
                                    ) : (
                                        <ShieldCheck />
                                    )}
                                    <span>
                                        {activeAudience === 'student'
                                            ? 'Ruang mahasiswa'
                                            : 'Admin Universitas'}
                                    </span>
                                </div>
                                <h3 className="max-w-[20ch] text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.12] font-bold tracking-[-0.03em]">
                                    {audience.title}
                                </h3>
                                <p className="mt-5 max-w-lg text-base leading-7 text-satu-muted">
                                    {audience.description}
                                </p>
                                <ul className="mt-6 space-y-4">
                                    {audience.boundaries.map((boundary) => (
                                        <li
                                            key={boundary}
                                            className="flex items-start gap-3 text-sm leading-6 text-satu-muted"
                                        >
                                            <ShieldCheck
                                                aria-hidden="true"
                                                className="mt-1 size-4 shrink-0 text-satu-blue"
                                            />
                                            {boundary}
                                        </li>
                                    ))}
                                </ul>
                                {activeAudience === 'student' ? (
                                    <Link
                                        href={
                                            auth.user ? dashboard() : register()
                                        }
                                        className="landing-primary mt-7 px-5"
                                        prefetch
                                    >
                                        {auth.user
                                            ? 'Buka beranda'
                                            : 'Buat akun mahasiswa'}
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </Link>
                                ) : (
                                    <a
                                        href="#privasi"
                                        className="landing-control mt-7"
                                    >
                                        Pelajari batas akses
                                        <ArrowRight
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </a>
                                )}
                            </div>
                            <div className="landing-role-path">
                                <p className="landing-role-path-caption">
                                    <BookOpen
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    {activeAudience === 'student'
                                        ? 'Dari bekal ke pengakuan'
                                        : 'Dari afiliasi ke keputusan'}
                                </p>
                                <ol className="landing-role-steps min-w-0 self-center">
                                    {audience.steps.map((step, index) => (
                                        <li
                                            key={step.title}
                                            className="landing-role-step"
                                        >
                                            <span className="landing-role-number">
                                                {index + 1}
                                            </span>
                                            <div className="min-w-0 pt-1">
                                                <h4 className="text-lg font-bold">
                                                    {step.title}
                                                </h4>
                                                <p className="mt-2 max-w-lg text-sm leading-6 text-satu-muted">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </section>
                </div>
            </section>
        </div>
    );
}
