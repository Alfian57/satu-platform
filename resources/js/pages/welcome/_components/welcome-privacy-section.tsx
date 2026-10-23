import { BadgeCheck, BookOpen, Check, LockKeyhole } from 'lucide-react';
import { DashboardArchiveArt } from '@/pages/dashboard/_components/dashboard-archive-art';
import LandingReveal from '@/pages/welcome/_components/landing-reveal';
import {
    VISIBILITY_EXAMPLES,
    VISIBILITY_ICONS,
} from '@/pages/welcome/_utils/welcome-constants';
import type { VisibilityExampleItem } from '@/pages/welcome/_utils/welcome-constants';

interface WelcomePrivacySectionProps {
    visibilityExample: VisibilityExampleItem;
    onSelectVisibility: (item: VisibilityExampleItem) => void;
}

export default function WelcomePrivacySection({
    visibilityExample,
    onSelectVisibility,
}: WelcomePrivacySectionProps) {
    const VisibilityIcon = VISIBILITY_ICONS[visibilityExample.key];

    return (
        <section
            id="privasi"
            aria-labelledby="privacy-heading"
            className="landing-section landing-privacy"
        >
            <div className="landing-container landing-privacy-grid">
                <LandingReveal className="landing-privacy-copy">
                    <span className="landing-privacy-mark">
                        <LockKeyhole aria-hidden="true" className="size-6" />
                    </span>
                    <p className="landing-kicker mt-5">
                        <span className="landing-section-index">04</span>
                        Kendali tetap di tanganmu
                    </p>
                    <h2
                        id="privacy-heading"
                        className="landing-section-title mt-4"
                    >
                        Karyamu terlihat
                        <br />
                        <span className="text-satu-blue">
                            sesuai pilihanmu.
                        </span>
                    </h2>
                    <p className="mt-5 text-base leading-7 text-satu-muted">
                        Kampus meninjau kontribusimu. Kamu yang menentukan
                        apakah ringkasan karyanya akan dibagikan.
                    </p>
                    <ul className="landing-privacy-rules">
                        <li>
                            <span className="landing-privacy-rule-icon">
                                <BookOpen
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </span>
                            <div>
                                <h3>Ringkasan karya</h3>
                                <p>Jangkauan dibagikan sesuai pilihanmu.</p>
                            </div>
                        </li>
                        <li>
                            <span className="landing-privacy-rule-icon">
                                <LockKeyhole
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </span>
                            <div>
                                <h3>Bukti dan percakapan</h3>
                                <p>Tidak ikut menjadi isi portofolio publik.</p>
                            </div>
                        </li>
                    </ul>
                </LandingReveal>
                <LandingReveal className="landing-visibility min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-bold">
                            Coba pilihan berbagi
                        </h3>
                        <span className="collaboration-synthetic-label">
                            Data synthetic
                        </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-satu-muted">
                        Pilih jangkauan dan lihat siapa yang dapat membaca
                        ringkasan karya.
                    </p>
                    <div
                        className="landing-visibility-options"
                        role="group"
                        aria-label="Simulasi jangkauan karya"
                    >
                        {VISIBILITY_EXAMPLES.map((example) => {
                            const ExampleIcon = VISIBILITY_ICONS[example.key];

                            return (
                                <button
                                    key={example.key}
                                    type="button"
                                    aria-pressed={
                                        visibilityExample.key === example.key
                                    }
                                    className="landing-control landing-visibility-option cursor-pointer"
                                    onClick={() => onSelectVisibility(example)}
                                >
                                    <ExampleIcon
                                        aria-hidden="true"
                                        className="size-4 shrink-0"
                                    />
                                    {visibilityExample.key === example.key && (
                                        <Check
                                            aria-hidden="true"
                                            className="landing-visibility-check size-3.5 shrink-0"
                                        />
                                    )}
                                    {example.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="landing-visibility-paper mt-5">
                        <div className="landing-folio-cover" aria-hidden="true">
                            <BookOpen className="size-12" />
                            <span>
                                ARSIP KARYA
                                <br />
                                BUDI / 001
                            </span>
                            <DashboardArchiveArt className="landing-folio-archive" />
                        </div>
                        <div className="landing-folio-meta">
                            <p className="mt-5 text-xs font-semibold text-satu-muted">
                                Karya Budi / contoh
                            </p>
                            <span className="landing-folio-audience">
                                <VisibilityIcon
                                    aria-hidden="true"
                                    className="size-3.5"
                                />
                                {visibilityExample.label}
                            </span>
                        </div>
                        <h4 className="mt-2 text-xl font-bold">
                            Rancangan alur peminjaman
                        </h4>
                        <p className="mt-3 flex items-center gap-2 text-sm text-satu-blue-hover">
                            <BadgeCheck
                                aria-hidden="true"
                                className="size-4 shrink-0"
                            />
                            Bersumber dari kontribusi yang disetujui pada
                            contoh.
                        </p>
                        <div
                            role="status"
                            aria-live="polite"
                            aria-atomic="true"
                            className="landing-visibility-result"
                        >
                            <span className="landing-visibility-result-icon">
                                <VisibilityIcon
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </span>
                            <div>
                                <p className="font-semibold">
                                    {visibilityExample.title}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-satu-muted">
                                    {visibilityExample.description}
                                </p>
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-satu-muted">
                        <LockKeyhole
                            aria-hidden="true"
                            className="mt-1 size-4 shrink-0"
                        />
                        Hanya simulasi. Tidak mengubah izin akun. Berkas bukti
                        dan percakapan tim tidak ikut dipublikasikan.
                    </p>
                </LandingReveal>
            </div>
        </section>
    );
}
