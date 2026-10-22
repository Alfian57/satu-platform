import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { ArrowRight, EyeOff, UserRoundCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardRecommendationFeedback } from './dashboard-recommendations-card';

type ActionHref = NonNullable<InertiaLinkProps['href']>;

export function DashboardRecommendationFeedbackActions({
    recommendationId,
    projectHref,
    projectActionLabel,
    profileHref,
    profileActionLabel,
    isProcessing,
    isStale,
    onFeedback,
}: {
    recommendationId: number;
    projectHref: ActionHref | null;
    projectActionLabel: string;
    profileHref: ActionHref | null;
    profileActionLabel: string;
    isProcessing: boolean;
    isStale: boolean;
    onFeedback: (
        recommendationId: number,
        feedback: DashboardRecommendationFeedback,
    ) => void;
}) {
    return (
        <div className="border-t border-border/50 bg-card/65 p-4">
            {projectHref !== null && (
                <Button
                    asChild
                    variant="outline"
                    className="group min-h-11 w-full cursor-pointer rounded-xl border-primary/25 font-semibold text-primary hover:border-primary hover:bg-accent hover:text-primary motion-safe:transition-[background-color,border-color] motion-safe:duration-standard"
                >
                    <Link href={projectHref}>
                        {projectActionLabel}
                        <ArrowRight
                            aria-hidden="true"
                            className="ml-1.5 size-4 motion-safe:transition-transform motion-safe:duration-standard motion-safe:group-hover:translate-x-1"
                        />
                    </Link>
                </Button>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs">
                <button
                    type="button"
                    className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-lg px-2 font-medium text-muted-foreground hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors motion-safe:duration-standard"
                    disabled={isProcessing || isStale}
                    data-test="dashboard-recommendation-hide"
                    onClick={() => onFeedback(recommendationId, 'hide')}
                >
                    <EyeOff aria-hidden="true" className="size-3.5" />
                    Sembunyikan
                </button>
                <button
                    type="button"
                    className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-lg px-2 font-medium text-muted-foreground hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors motion-safe:duration-standard"
                    disabled={isProcessing || isStale}
                    data-test="dashboard-recommendation-not-relevant"
                    onClick={() => onFeedback(recommendationId, 'notRelevant')}
                >
                    Tidak relevan
                </button>
                {profileHref !== null && (
                    <Link
                        href={profileHref}
                        className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-lg px-2 font-semibold text-primary hover:bg-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        <UserRoundCog aria-hidden="true" className="size-3.5" />
                        {profileActionLabel}
                    </Link>
                )}
            </div>
            <p
                className="mt-1 min-h-5 text-xs leading-5 font-medium text-primary"
                role="status"
            >
                {isProcessing ? 'Mengirim masukan...' : null}
            </p>
        </div>
    );
}
