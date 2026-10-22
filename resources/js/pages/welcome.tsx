import { Head, usePage } from '@inertiajs/react';
import type { CSSProperties } from 'react';
import { LANDING_STAGES } from '@/components/LandingFlowLedger';
import WelcomeAudienceSection from '@/components/welcome/welcome-audience-section';
import WelcomeClosingCta from '@/components/welcome/welcome-closing-cta';
import {
    AUDIENCE_TABS,
    LANDING_NAVIGATION,
    OUTCOMES,
    VISIBILITY_EXAMPLES,
} from '@/components/welcome/welcome-constants';
import WelcomeDemoSection from '@/components/welcome/welcome-demo-section';
import WelcomeFaqSection from '@/components/welcome/welcome-faq-section';
import WelcomeFooter from '@/components/welcome/welcome-footer';
import WelcomeHero from '@/components/welcome/welcome-hero';
import WelcomeNavigation from '@/components/welcome/welcome-navigation';
import WelcomeOutcomes from '@/components/welcome/welcome-outcomes';
import WelcomePrivacySection from '@/components/welcome/welcome-privacy-section';
import { useWelcomeInteractions } from '@/hooks/use-welcome-interactions';
import { SATU_COLORS } from '@/lib/tokens';

const landingTheme = {
    '--landing-canvas': SATU_COLORS.canvas,
    '--landing-surface': SATU_COLORS.surface,
    '--landing-ink': SATU_COLORS.ink,
    '--landing-muted': SATU_COLORS.muted,
    '--landing-border': SATU_COLORS.borderSoft,
    '--landing-blue': SATU_COLORS.primary,
    '--landing-blue-strong': SATU_COLORS.primaryHover,
    '--landing-blue-soft': SATU_COLORS.blueSoft,
    colorScheme: 'light',
} as CSSProperties;

export default function Welcome() {
    const { auth, publicUniversity } = usePage<{
        publicUniversity?: { name: string | null };
    }>().props;

    const { state, actions } = useWelcomeInteractions({
        navigation: LANDING_NAVIGATION,
        audienceTabs: AUDIENCE_TABS,
        visibilityExamples: VISIBILITY_EXAMPLES,
    });

    return (
        <>
            <Head title="SATU | Kolaborasi dan portofolio mahasiswa">
                <meta
                    name="description"
                    content="Temukan peluang kolaborasi, catat kontribusi, dan susun portofolio dengan jangkauan yang kamu kendalikan di SATU."
                />
            </Head>
            <div
                id="top"
                data-landing-surface
                style={landingTheme}
                className="landing-editorial landing-studio relative isolate min-h-screen bg-satu-canvas text-satu-ink selection:bg-satu-border-contrast"
            >
                <WelcomeNavigation
                    navigation={LANDING_NAVIGATION}
                    activeSection={state.activeSection}
                    isMenuOpen={state.isMenuOpen}
                    auth={auth}
                    onSelectSection={actions.selectSection}
                    onToggleMenu={actions.toggleMenu}
                    onCloseMenu={actions.closeMenu}
                />
                <main id="main" tabIndex={-1}>
                    <div className="landing-content">
                        <WelcomeHero
                            auth={auth}
                            publicUniversity={publicUniversity}
                        />
                        <WelcomeOutcomes outcomes={OUTCOMES} />
                        <WelcomeDemoSection />
                        <WelcomeAudienceSection
                            activeAudience={state.activeAudience}
                            auth={auth}
                            onSelectAudience={actions.setActiveAudience}
                            onMoveAudience={actions.moveAudience}
                        />
                        <WelcomePrivacySection
                            visibilityExample={state.visibilityExample}
                            onSelectVisibility={actions.setVisibilityExample}
                        />
                        <WelcomeFaqSection
                            universityName={publicUniversity?.name}
                        />
                        <WelcomeClosingCta auth={auth} />
                    </div>
                </main>
                <noscript>
                    <section className="landing-container py-10">
                        <h2 className="text-2xl font-bold">
                            Alur kolaborasi SATU
                        </h2>
                        <ol className="mt-5 space-y-4">
                            {LANDING_STAGES.map((stage) => (
                                <li key={stage.key}>
                                    <h3 className="font-semibold">
                                        {stage.index}. {stage.label}
                                    </h3>
                                    <p className="mt-1 text-sm leading-6">
                                        {stage.description}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </section>
                </noscript>
                <WelcomeFooter
                    navigation={LANDING_NAVIGATION}
                    publicUniversity={publicUniversity}
                />
            </div>
        </>
    );
}
