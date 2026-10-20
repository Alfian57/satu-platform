import { MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { DashboardArchiveArt } from '@/components/dashboard-archive-art';
import Mascot from '@/components/mascot';

export default function AuthWelcomePanel({
    isRegistration,
    isConfirmation = false,
}: {
    isRegistration: boolean;
    isConfirmation?: boolean;
}) {
    return (
        <div className="auth-welcome-panel">
            <div className="auth-welcome-copy">
                <p className="auth-welcome-kicker">
                    <span aria-hidden="true" />
                    {isConfirmation
                        ? 'Konfirmasi akses pribadi'
                        : 'Satu tempat, banyak kemungkinan'}
                </p>
                <h2 className="auth-welcome-heading">
                    {isConfirmation ? 'Kendali akun.' : 'Langkah kecil.'}
                    <span>
                        {isConfirmation ? 'Tetap milikmu.' : 'Cerita besar.'}
                    </span>
                </h2>
                <p className="auth-welcome-description">
                    {isConfirmation
                        ? 'Sebelum melanjutkan, konfirmasikan password akunmu. Satu langkah singkat untuk menjaga akses pribadi.'
                        : 'Temukan teman berkarya, bangun kontribusi, dan ceritakan kemampuanmu lewat bukti nyata.'}
                </p>
            </div>

            <div className="auth-welcome-scene">
                <div className="auth-welcome-atmosphere" aria-hidden="true">
                    <span className="auth-welcome-halo" />
                    <span className="auth-welcome-orbit" />
                    <span className="auth-welcome-orbit auth-welcome-orbit-secondary" />
                    <span className="auth-welcome-platform" />
                    <DashboardArchiveArt className="auth-welcome-archive" />
                    <Sparkles className="auth-welcome-spark" />
                    <span className="auth-welcome-feather" />
                    <span className="auth-welcome-piece auth-welcome-piece-left" />
                    <span className="auth-welcome-piece auth-welcome-piece-top" />
                    <span className="auth-welcome-piece auth-welcome-piece-right" />
                </div>
                <div className="auth-welcome-message">
                    <p>
                        <MessageCircle aria-hidden="true" />
                        {isConfirmation
                            ? 'Sebentar, kita pastikan.'
                            : 'Teman berkaryamu'}
                    </p>
                    <p>
                        {isConfirmation
                            ? 'Konfirmasikan passwordmu, lalu lanjutkan ke halaman tujuan.'
                            : isRegistration
                              ? 'Halo! Cerita kolaborasimu bisa dimulai dari sini.'
                              : 'Selamat kembali! Yuk, lanjutkan cerita kolaborasimu.'}
                    </p>
                    <span>
                        {isConfirmation
                            ? 'Gunakan password akunmu saat ini.'
                            : 'Kenali peluang. Bangun karya.'}
                    </span>
                </div>
                <Mascot
                    pose={
                        isConfirmation
                            ? 'confirm-access'
                            : isRegistration
                              ? 'register-start'
                              : 'login-return'
                    }
                    interactive={!isConfirmation}
                    priority
                    className="auth-welcome-bird"
                />
            </div>
            <p className="auth-welcome-privacy">
                <ShieldCheck aria-hidden="true" />
                {isConfirmation
                    ? 'Konfirmasi ini tidak mengubah password atau data akunmu.'
                    : 'Kamu yang menentukan siapa yang melihat portofoliomu.'}
            </p>
        </div>
    );
}
