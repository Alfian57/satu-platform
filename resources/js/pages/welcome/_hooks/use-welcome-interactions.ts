import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type {
    AudienceKey,
    VisibilityExampleItem,
} from '@/pages/welcome/_utils/welcome-constants';

export interface UseWelcomeInteractionsOptions {
    navigation: readonly { href: string; label: string }[];
    audienceTabs: readonly { key: AudienceKey; label: string }[];
    visibilityExamples: readonly VisibilityExampleItem[];
}

export function useWelcomeInteractions({
    navigation,
    audienceTabs,
    visibilityExamples,
}: UseWelcomeInteractionsOptions) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState(navigation[0].href);
    const pendingSection = useRef<string | null>(null);
    const [visibilityExample, setVisibilityExample] =
        useState<VisibilityExampleItem>(visibilityExamples[0]);
    const [activeAudience, setActiveAudience] =
        useState<AudienceKey>('student');

    useEffect(() => {
        const surface = document.querySelector('[data-landing-surface]');
        let frame = 0;
        let scrollIdleTimer = 0;
        let disposed = false;

        function updateActiveSection() {
            frame = 0;
            const header = document.querySelector('.landing-header');
            const readingLine =
                (header?.getBoundingClientRect().bottom ?? 0) + 24;
            let current = navigation[0].href;

            for (const { href } of navigation) {
                const element = document.getElementById(href.slice(1));

                if (
                    element?.isConnected &&
                    element.getClientRects().length > 0 &&
                    element.getBoundingClientRect().top <= readingLine
                ) {
                    current = href;
                }
            }

            if (pendingSection.current && pendingSection.current !== current) {
                return;
            }

            pendingSection.current = null;
            setActiveSection(current);
        }

        function scheduleUpdate() {
            if (!disposed && frame === 0) {
                frame = window.requestAnimationFrame(updateActiveSection);
            }
        }

        function releasePendingSection() {
            pendingSection.current = null;
            window.clearTimeout(scrollIdleTimer);
            scheduleUpdate();
        }

        function handleScroll() {
            window.clearTimeout(scrollIdleTimer);
            const target = pendingSection.current;

            if (target) {
                scrollIdleTimer = window.setTimeout(() => {
                    if (pendingSection.current === target) {
                        releasePendingSection();
                    }
                }, 160);
            }

            scheduleUpdate();
        }

        function handleScrollKey(event: globalThis.KeyboardEvent) {
            if (
                [
                    'ArrowUp',
                    'ArrowDown',
                    'PageUp',
                    'PageDown',
                    'Home',
                    'End',
                    ' ',
                ].includes(event.key)
            ) {
                releasePendingSection();
            }
        }

        function handleHistoryNavigation() {
            if (window.location.hash !== pendingSection.current) {
                releasePendingSection();
            } else {
                scheduleUpdate();
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('wheel', releasePendingSection, {
            passive: true,
        });
        window.addEventListener('touchstart', releasePendingSection, {
            passive: true,
        });
        window.addEventListener('pointerdown', releasePendingSection);
        window.addEventListener('keydown', handleScrollKey);
        window.addEventListener('popstate', handleHistoryNavigation);
        window.addEventListener('resize', releasePendingSection);
        window.addEventListener('hashchange', scheduleUpdate);
        window.addEventListener('pageshow', scheduleUpdate);
        window.addEventListener('load', scheduleUpdate);

        const resizeObserver = new ResizeObserver(scheduleUpdate);

        function observeLayout() {
            resizeObserver.disconnect();

            for (const element of [
                surface,
                document.querySelector('.landing-header'),
                ...navigation.map(({ href }) =>
                    document.getElementById(href.slice(1)),
                ),
            ]) {
                if (element) {
                    resizeObserver.observe(element);
                }
            }

            scheduleUpdate();
        }

        const contentObserver = new MutationObserver(observeLayout);

        if (surface) {
            contentObserver.observe(surface, {
                childList: true,
                subtree: true,
            });
        }

        observeLayout();
        void document.fonts.ready.then(scheduleUpdate);

        return () => {
            disposed = true;
            window.cancelAnimationFrame(frame);
            window.clearTimeout(scrollIdleTimer);
            resizeObserver.disconnect();
            contentObserver.disconnect();
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('wheel', releasePendingSection);
            window.removeEventListener('touchstart', releasePendingSection);
            window.removeEventListener('pointerdown', releasePendingSection);
            window.removeEventListener('keydown', handleScrollKey);
            window.removeEventListener('popstate', handleHistoryNavigation);
            window.removeEventListener('resize', releasePendingSection);
            window.removeEventListener('hashchange', scheduleUpdate);
            window.removeEventListener('pageshow', scheduleUpdate);
            window.removeEventListener('load', scheduleUpdate);
        };
    }, [navigation]);

    function selectSection(href: string) {
        pendingSection.current = href;
        setActiveSection(href);
    }

    function toggleMenu() {
        setIsMenuOpen((open) => !open);
    }

    function closeMenu(restoreFocus = false) {
        setIsMenuOpen(false);

        if (restoreFocus) {
            document
                .querySelector<HTMLButtonElement>(
                    '[data-testid="landing-menu-toggle"]',
                )
                ?.focus();
        }
    }

    function moveAudience(
        event: KeyboardEvent<HTMLButtonElement>,
        index: number,
    ) {
        let next: number;

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            next = (index + 1) % audienceTabs.length;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            next = (index - 1 + audienceTabs.length) % audienceTabs.length;
        } else if (event.key === 'Home') {
            next = 0;
        } else if (event.key === 'End') {
            next = audienceTabs.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        setActiveAudience(audienceTabs[next].key);
        event.currentTarget
            .closest('[role="tablist"]')
            ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
            .item(next)
            ?.focus();
    }

    return {
        state: {
            isMenuOpen,
            activeSection,
            visibilityExample,
            activeAudience,
        },
        actions: {
            setIsMenuOpen,
            toggleMenu,
            closeMenu,
            selectSection,
            setActiveAudience,
            moveAudience,
            setVisibilityExample,
        },
    };
}
