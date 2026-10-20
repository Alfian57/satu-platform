import { useLayoutEffect, useRef } from 'react';

export default function LandingNavigationIndicator({
    activeHref,
}: {
    activeHref: string;
}) {
    const indicatorRef = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        const indicator = indicatorRef.current;
        const navigation = indicator?.parentElement;
        const activeLink = navigation?.querySelector<HTMLAnchorElement>(
            `a[href="${activeHref}"]`,
        );

        if (!indicator || !navigation || !activeLink) {
            return;
        }

        let disposed = false;

        function updatePosition() {
            if (
                disposed ||
                !activeLink ||
                !indicator ||
                !navigation ||
                !activeLink.offsetWidth
            ) {
                return;
            }

            const isInitialPosition = !navigation.dataset.indicatorReady;

            if (isInitialPosition) {
                indicator.style.transition = 'none';
            }

            indicator.style.width = `${activeLink.offsetWidth}px`;
            indicator.style.height = `${activeLink.offsetHeight}px`;
            indicator.style.transform = `translate3d(${activeLink.offsetLeft}px, ${activeLink.offsetTop}px, 0)`;

            if (isInitialPosition) {
                indicator.getBoundingClientRect();
                indicator.style.removeProperty('transition');
                navigation.dataset.indicatorReady = 'true';
            }
        }

        updatePosition();
        const resizeObserver = new ResizeObserver(updatePosition);
        resizeObserver.observe(navigation);

        for (const link of navigation.querySelectorAll('a')) {
            resizeObserver.observe(link);
        }

        void document.fonts.ready.then(updatePosition);

        return () => {
            disposed = true;
            resizeObserver.disconnect();
        };
    }, [activeHref]);

    return (
        <span
            ref={indicatorRef}
            aria-hidden="true"
            className="landing-nav-indicator"
        />
    );
}
