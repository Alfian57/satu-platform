import { useEffect, useState } from 'react';
import type { StudentTourStep } from '@/lib/student-menu-tour';

type Spotlight = {
    stepId: string;
    revision: number;
    settled: boolean;
    rect: { left: number; top: number; width: number; height: number } | null;
};

export function useStudentTourSpotlight(
    step: StudentTourStep | undefined,
    enabled: boolean,
    revision: number,
) {
    const [spotlight, setSpotlight] = useState<Spotlight | null>(null);

    useEffect(() => {
        if (!enabled || !step) {
            return;
        }

        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let measureFrame = 0;
        let scrollFrame = 0;
        let delay = 0;
        let positioned = false;
        let settling = true;
        let scrollDestination: number | null = null;

        const publish = () => {
            const bounds = document
                .querySelector<HTMLElement>(step.target)
                ?.getBoundingClientRect();
            const panel = document
                .querySelector<HTMLElement>('[data-test="student-menu-tour"]')
                ?.getBoundingClientRect();
            const left = Math.max(8, (bounds?.left ?? 0) - 12);
            const top = Math.max(76, (bounds?.top ?? 0) - 12);
            const right = Math.min(
                window.innerWidth - 8,
                (bounds?.right ?? 0) + 12,
            );
            const behindPanel =
                bounds &&
                panel &&
                bounds.right > panel.left &&
                bounds.left < panel.right;
            const bottom = Math.min(
                behindPanel
                    ? Math.max(88, panel.top - 16)
                    : window.innerHeight - 12,
                (bounds?.bottom ?? 0) + 12,
            );
            const next: Spotlight = {
                stepId: step.id,
                revision,
                settled: !settling,
                rect:
                    bounds && right > left && bottom > top
                        ? {
                              left,
                              top,
                              width: right - left,
                              height: bottom - top,
                          }
                        : null,
            };
            setSpotlight((previous) =>
                JSON.stringify(previous) === JSON.stringify(next)
                    ? previous
                    : next,
            );
        };

        const position = () => {
            const element = document.querySelector<HTMLElement>(step.target);
            const bounds = element?.getBoundingClientRect();

            if (!bounds) {
                settling = false;
                publish();

                return;
            }

            positioned = true;
            const panel = document
                .querySelector<HTMLElement>('[data-test="student-menu-tour"]')
                ?.getBoundingClientRect();
            const behindPanel =
                panel && bounds.right > panel.left && bounds.left < panel.right;
            const availableBottom = behindPanel
                ? panel.top - 28
                : window.innerHeight - 28;
            const anchor =
                bounds.height > availableBottom - 100
                    ? (element
                          ?.querySelector<HTMLElement>('h1, h2')
                          ?.getBoundingClientRect() ?? bounds)
                    : bounds;
            const needsScroll =
                anchor.top < 96 || anchor.bottom > availableBottom;
            const from = window.scrollY;
            const destination = Math.max(
                0,
                Math.min(
                    document.documentElement.scrollHeight - window.innerHeight,
                    from + (needsScroll ? anchor.top - 100 : 0),
                ),
            );
            scrollDestination = destination;

            if (motion.matches || Math.abs(destination - from) < 2) {
                window.scrollTo({ top: destination, behavior: 'instant' });
                settling = false;
                publish();

                return;
            }

            settling = true;
            const started = performance.now();
            const tick = (now: number) => {
                const progress = Math.min(1, (now - started) / 420);
                const eased =
                    progress < 0.5
                        ? 4 * progress ** 3
                        : 1 - (-2 * progress + 2) ** 3 / 2;
                window.scrollTo({
                    top: from + (destination - from) * eased,
                    behavior: 'instant',
                });
                settling = progress < 1;
                publish();

                if (settling) {
                    scrollFrame = window.requestAnimationFrame(tick);
                }
            };
            scrollFrame = window.requestAnimationFrame(tick);
        };

        const measure = () => {
            if (delay) {
                return;
            }

            if (!positioned) {
                position();
            } else {
                publish();
            }
        };
        const schedule = () => {
            window.cancelAnimationFrame(measureFrame);
            measureFrame = window.requestAnimationFrame(measure);
        };
        const finishMotion = () => {
            if (!motion.matches) {
                return;
            }

            window.clearTimeout(delay);
            delay = 0;
            window.cancelAnimationFrame(scrollFrame);

            if (scrollDestination !== null) {
                window.scrollTo({
                    top: scrollDestination,
                    behavior: 'instant',
                });
                settling = false;
                publish();
            } else {
                position();
            }
        };
        const observer = new MutationObserver(schedule);
        const resize = new ResizeObserver(schedule);
        observer.observe(document.body, { childList: true, subtree: true });
        resize.observe(document.body);
        const panel = document.querySelector('[data-test="student-menu-tour"]');

        if (panel) {
            resize.observe(panel);
        }

        window.addEventListener('resize', schedule);
        window.addEventListener('scroll', schedule, true);
        motion.addEventListener('change', finishMotion);

        if (motion.matches) {
            schedule();
        } else {
            delay = window.setTimeout(() => {
                delay = 0;
                position();
            }, 140);
        }

        return () => {
            window.clearTimeout(delay);
            window.cancelAnimationFrame(measureFrame);
            window.cancelAnimationFrame(scrollFrame);
            observer.disconnect();
            resize.disconnect();
            window.removeEventListener('resize', schedule);
            window.removeEventListener('scroll', schedule, true);
            motion.removeEventListener('change', finishMotion);
        };
    }, [enabled, revision, step]);

    const settled =
        enabled &&
        spotlight?.stepId === step?.id &&
        spotlight?.revision === revision &&
        spotlight?.settled === true;

    return {
        rect: spotlight?.rect ?? null,
        settled,
        moving: enabled && !settled,
    };
}
