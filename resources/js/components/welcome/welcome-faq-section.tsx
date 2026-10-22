import { ArrowUpRight, ChevronDown, MessageCircle } from 'lucide-react';
import LandingReveal from '@/components/landing-reveal';
import { getQuestions } from '@/components/welcome/welcome-constants';

interface WelcomeFaqSectionProps {
    universityName?: string | null;
}

export default function WelcomeFaqSection({
    universityName,
}: WelcomeFaqSectionProps) {
    const questions = getQuestions(universityName);

    return (
        <section
            id="pertanyaan"
            aria-labelledby="faq-heading"
            className="landing-section landing-questions"
        >
            <div className="landing-container landing-faq-grid">
                <LandingReveal className="landing-faq-intro">
                    <p className="landing-kicker">
                        <span className="landing-section-index">05</span>
                        Sebelum mulai
                    </p>
                    <h2 id="faq-heading" className="landing-section-title mt-4">
                        Masih ada yang
                        <br />
                        <span className="text-satu-blue">ingin kamu tahu?</span>
                    </h2>
                    <p className="mt-5 max-w-sm text-base leading-7 text-satu-muted">
                        Beberapa jawaban untuk menemani langkah pertamamu di
                        SATU.
                    </p>
                    <div className="landing-faq-note">
                        <MessageCircle
                            aria-hidden="true"
                            className="size-5 shrink-0"
                        />
                        <div>
                            <p>Ingin melihat contoh nyatanya?</p>
                            <a href="#demo">
                                Jelajahi demo perjalanan
                                <ArrowUpRight
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            </a>
                        </div>
                    </div>
                </LandingReveal>
                <div className="landing-faq-list min-w-0">
                    {questions.map(({ question, answer }, index) => (
                        <details key={question} className="landing-faq group">
                            <summary>
                                <span
                                    aria-hidden="true"
                                    className="landing-faq-number"
                                >
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <span>{question}</span>
                                <ChevronDown
                                    aria-hidden="true"
                                    className="size-5 shrink-0 text-satu-blue transition-transform duration-220 group-open:rotate-180 motion-reduce:transition-none"
                                />
                            </summary>
                            <p className="max-w-2xl pb-5 text-sm leading-7 text-satu-muted">
                                {answer}
                            </p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
