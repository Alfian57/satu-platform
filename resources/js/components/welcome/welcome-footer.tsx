import { ArrowUpRight, GraduationCap, LockKeyhole } from 'lucide-react';
import AppLogo from '@/components/app-logo';

interface WelcomeFooterProps {
    navigation: readonly { href: string; label: string }[];
    publicUniversity?: { name: string | null };
}

export default function WelcomeFooter({
    navigation,
    publicUniversity,
}: WelcomeFooterProps) {
    return (
        <footer className="landing-footer">
            <div className="landing-container">
                <div className="landing-footer-top">
                    <div>
                        <AppLogo
                            compact
                            logoClassName="size-11 rounded-none shadow-none"
                            className="text-satu-ink"
                        />
                        <p className="mt-4 max-w-xs text-sm leading-6 text-satu-muted">
                            Sistem Aktivitas Talenta Universitas.
                            <br />
                            Kesempatan berkolaborasi. Pengakuan berbasis
                            kontribusi.
                        </p>
                    </div>
                    <div className="landing-footer-links">
                        <p className="landing-footer-label">Jelajahi SATU</p>
                        <nav
                            aria-label="Navigasi footer"
                            className="landing-footer-navigation"
                        >
                            {navigation.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="landing-nav-link"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>
                    </div>
                    <div className="landing-footer-note">
                        <GraduationCap
                            aria-hidden="true"
                            className="size-5 text-satu-blue"
                        />
                        <p className="landing-footer-label">
                            Ruang kolaborasi mahasiswa
                        </p>
                        <p className="landing-footer-university">
                            {publicUniversity?.name ||
                                'Informasi universitas belum tersedia.'}
                        </p>
                        <p className="text-sm leading-6 text-satu-muted">
                            Kenali kemampuan. Temukan peran. Bangun karya.
                        </p>
                    </div>
                </div>
                <div className="landing-footer-bottom">
                    <p>&copy; {new Date().getFullYear()} SATU Platform.</p>
                    <a href="#top" className="landing-footer-back">
                        Kembali ke atas
                        <ArrowUpRight aria-hidden="true" className="size-4" />
                    </a>
                    <p className="inline-flex items-center gap-2">
                        <LockKeyhole
                            aria-hidden="true"
                            className="size-4 shrink-0"
                        />
                        Portofolio dibagikan dengan izin mahasiswa.
                    </p>
                </div>
            </div>
            <div aria-hidden="true" className="landing-footer-wordmark">
                SATU<span>.</span>
            </div>
        </footer>
    );
}
