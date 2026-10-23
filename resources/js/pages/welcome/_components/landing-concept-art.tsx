import {
    ArrowRight,
    BookOpen,
    Check,
    FileText,
    FolderOpen,
    Search,
    ShieldCheck,
    UserRound,
} from 'lucide-react';

export type LandingConcept = 'opportunity' | 'team' | 'recognition';

export default function LandingConceptArt({ kind }: { kind: LandingConcept }) {
    return (
        <div
            className={`landing-concept landing-concept--${kind}`}
            aria-hidden="true"
        >
            <svg
                className="landing-concept-trail"
                viewBox="0 0 400 220"
                fill="none"
            >
                <path
                    pathLength="1"
                    d="M-10 170C60 170 22 35 132 50S270 235 410 70"
                />
                <circle cx="132" cy="50" r="5" />
                <circle cx="310" cy="147" r="4" />
            </svg>
            {kind === 'opportunity' ? (
                <div className="landing-concept-paper">
                    <span className="landing-concept-search">
                        <Search className="size-4" />
                        Temukan peranmu
                    </span>
                    <div className="landing-concept-tags">
                        <span>Desain</span>
                        <span>Teknologi</span>
                        <span>Riset</span>
                    </div>
                    <div className="landing-concept-result">
                        <span className="landing-concept-icon">
                            <FolderOpen className="size-5" />
                        </span>
                        <div>
                            <strong>Peluang untuk pemula</strong>
                            <span>Mulai dari kemampuanmu</span>
                        </div>
                        <ArrowRight className="size-4" />
                    </div>
                </div>
            ) : kind === 'team' ? (
                <div className="landing-concept-team">
                    <div className="landing-concept-people">
                        <span>
                            <UserRound className="size-6" />
                            <small>Peranmu</small>
                        </span>
                        <span className="landing-concept-connector" />
                        <span>
                            <UserRound className="size-6" />
                            <small>Rekan tim</small>
                        </span>
                    </div>
                    <div className="landing-concept-task">
                        <FileText className="size-5" />
                        <div>
                            <strong>Bagianmu dalam tim</strong>
                            <span>Tugas jelas, kerja bersama</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="landing-concept-folio">
                    <div className="landing-concept-book">
                        <BookOpen className="size-9" />
                        <span>
                            Catatan
                            <br />
                            kontribusimu
                        </span>
                    </div>
                    <span className="landing-concept-seal">
                        <ShieldCheck className="size-6" />
                    </span>
                    <div className="landing-concept-caption">
                        <Check className="size-4" />
                        Bukti, tinjauan, pengakuan
                    </div>
                </div>
            )}
        </div>
    );
}
