import { ClipboardList, LockKeyhole, MessageCircle } from 'lucide-react';
import Mascot from '@/components/mascot';

type Props = {
    state: 'editing' | 'pending' | 'locked';
};

export default function OnboardingAffiliationIntro({ state }: Props) {
    const message = {
        editing: 'Yuk, periksa kembali datamu sebelum dikirim.',
        pending:
            'Pengajuanmu sudah tercatat. Periksa status untuk melihat hasilnya.',
        locked: 'Kita periksa dulu, ya. Ikuti petunjuk untuk melanjutkan.',
    }[state];

    return (
        <aside className="affiliation-intro" aria-label="Panduan afiliasi">
            <div className="affiliation-intro-copy">
                <p className="affiliation-intro-kicker">
                    <ClipboardList aria-hidden="true" />
                    Kenalan dulu, yuk.
                </p>
                <h2>
                    Mulai dari
                    <span>identitasmu.</span>
                </h2>
                <p className="affiliation-intro-description">
                    Isi identitas akademikmu. SATU akan mencocokkannya dengan
                    data universitas.
                </p>
            </div>
            <div className="affiliation-intro-scene">
                <div
                    className="affiliation-intro-atmosphere"
                    aria-hidden="true"
                >
                    <span />
                </div>
                <Mascot
                    pose="affiliation-check"
                    priority
                    className="affiliation-intro-mascot"
                />
                <p className="affiliation-intro-message">
                    <MessageCircle aria-hidden="true" />
                    {message}
                </p>
            </div>
            <p className="affiliation-intro-note">
                <LockKeyhole aria-hidden="true" />
                Pengajuanmu perlu diverifikasi. Mengisi form bukan berarti
                afiliasi langsung disetujui.
            </p>
        </aside>
    );
}
