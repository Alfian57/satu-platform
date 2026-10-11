import { MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import Mascot from '@/components/mascot';

export default function AuthWelcomePanel({
    isRegistration,
}: {
    isRegistration: boolean;
}) {
    return (
        <div className="auth-welcome-panel">
            <div className="auth-welcome-copy">
                <p className="auth-welcome-kicker">
                    <span aria-hidden="true" />
                    Satu tempat, banyak kemungkinan
                </p>
                <h2 className="auth-welcome-heading">
                    Langkah kecil.
                    <span>Cerita besar.</span>
                </h2>
                <p className="auth-welcome-description">
                    Temukan teman berkarya, bangun kontribusi, dan ceritakan
                    kemampuanmu lewat bukti nyata.
                </p>
            </div>

            <div className="auth-welcome-scene">
                <div className="auth-welcome-atmosphere" aria-hidden="true">
                    <span className="auth-welcome-halo" />
                    <span className="auth-welcome-orbit" />
                    <DashboardArchiveArt className="auth-welcome-archive" />
                    <Sparkles className="auth-welcome-spark" />
                    <span className="auth-welcome-feather" />
                </div>
                <div className="auth-welcome-message">
                    <p>
                        <MessageCircle aria-hidden="true" />
                        Teman berkaryamu
                    </p>
                    <p>
                        {isRegistration
                            ? 'Halo! Cerita kolaborasimu bisa dimulai dari sini.'
                            : 'Selamat kembali! Yuk, lanjutkan cerita kolaborasimu.'}
                    </p>
                    <span>Kenali peluang. Bangun karya.</span>
                </div>
                <Mascot
                    pose="welcome"
                    interactive
                    priority
                    className="auth-welcome-bird"
                />
            </div>
            <p className="auth-welcome-privacy">
                <ShieldCheck aria-hidden="true" />
                Kamu yang menentukan siapa yang melihat portofoliomu.
            </p>
        </div>
    );
}
