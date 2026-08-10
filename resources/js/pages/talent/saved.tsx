import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Award,
    Bookmark,
    BookmarkX,
    CheckCircle,
    ChevronRight,
    Trash2,
    UserCheck,
} from 'lucide-react';
import React, { useState, useTransition } from 'react';
import AppLayout from '@/layouts/app-layout';

interface Candidate {
    id: number;
    headline: string | null;
    bio: string | null;
    skills: string[];
    badges: string[];
    contributions: string[];
    availability_status: string;
    verified_at: string | null;
    institution_name: string | null;
}

interface SavedCandidatesProps {
    candidates: {
        data: Candidate[];
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
    };
    entitlement: {
        has_entitlement: boolean;
        status: string;
    };
}

export default function SavedCandidates({
    candidates,
    entitlement,
}: SavedCandidatesProps) {
    const [savedList, setSavedList] = useState<Candidate[]>(candidates.data);
    const [isPending, startTransition] = useTransition();

    const handleUnsave = (candidateId: number) => {
        // Optimistic UI update: remove candidate immediately
        const previousList = [...savedList];
        setSavedList((prev) => prev.filter((c) => c.id !== candidateId));

        startTransition(() => {
            router.delete(`/recruiter/talent/candidates/${candidateId}/save`, {
                preserveState: true,
                preserveScroll: true,
                onError: () => {
                    // Rollback optimistic state on failure
                    setSavedList(previousList);
                },
            });
        });
    };

    return (
        <AppLayout>
            <Head title="Saved Candidates - SATU Platform" />

            <div className="mx-auto min-h-screen max-w-7xl space-y-8 bg-slate-900 p-6 text-slate-100 md:p-10">
                {/* Header & Navigation */}
                <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <button
                            onClick={() =>
                                router.get('/recruiter/talent/search')
                            }
                            className="mb-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-200"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Talent
                            Search
                        </button>
                        <div className="flex items-center gap-3">
                            <h1 className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                                Saved Candidates
                            </h1>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-800/50 bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-300">
                                <Bookmark className="h-3.5 w-3.5 text-blue-400" />{' '}
                                Private Org List
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                            Private saved candidate workspace for your recruiter
                            organization.
                        </p>
                    </div>

                    {entitlement.has_entitlement && (
                        <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-300">
                            <UserCheck className="h-4 w-4 text-blue-400" />
                            <span>Entitlement Active</span>
                        </div>
                    )}
                </div>

                {/* Candidate Results Region */}
                <div
                    role="region"
                    aria-busy={isPending}
                    aria-live="polite"
                    className="space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
                            Saved Candidates ({savedList.length})
                        </h2>
                        <span role="status" className="text-xs text-slate-500">
                            Page {candidates.current_page} of{' '}
                            {candidates.last_page}
                        </span>
                    </div>

                    {/* Skeleton Loading State */}
                    {isPending && (
                        <div className="space-y-4">
                            {[1, 2].map((n) => (
                                <div
                                    key={n}
                                    className="animate-pulse space-y-3 rounded-2xl border border-slate-700/40 bg-slate-800/40 p-6"
                                >
                                    <div className="h-5 w-1/3 rounded bg-slate-700/60"></div>
                                    <div className="h-4 w-2/3 rounded bg-slate-700/40"></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isPending && savedList.length === 0 && (
                        <div className="space-y-4 rounded-2xl border border-slate-700/50 bg-slate-800/30 p-12 text-center">
                            <BookmarkX className="mx-auto h-12 w-12 text-slate-600" />
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold text-slate-300">
                                    No Saved Candidates
                                </h3>
                                <p className="mx-auto max-w-md text-sm text-slate-500">
                                    You have not saved any candidates yet.
                                    Browse Talent Search to bookmark candidates
                                    for your organization.
                                </p>
                            </div>
                            <button
                                onClick={() =>
                                    router.get('/recruiter/talent/search')
                                }
                                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold transition-colors hover:bg-slate-700"
                            >
                                Search Candidates
                            </button>
                        </div>
                    )}

                    {/* Saved Candidates List */}
                    {!isPending && savedList.length > 0 && (
                        <div className="space-y-4">
                            {savedList.map((candidate) => (
                                <div
                                    key={candidate.id}
                                    className="group rounded-2xl border border-slate-700/60 bg-slate-800/60 p-6 shadow-md transition-all duration-200 hover:border-blue-500/50 hover:bg-slate-800/90"
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="max-w-2xl space-y-2">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-lg font-bold text-slate-100 transition-colors group-hover:text-blue-300">
                                                    {candidate.headline ||
                                                        'Verified Student Candidate'}
                                                </h3>
                                                {candidate.institution_name && (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-xs text-slate-300">
                                                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                                                        {
                                                            candidate.institution_name
                                                        }
                                                    </span>
                                                )}
                                            </div>

                                            {candidate.bio && (
                                                <p className="line-clamp-2 text-sm text-slate-300/80">
                                                    {candidate.bio}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                                {candidate.skills.map(
                                                    (skill) => (
                                                        <span
                                                            key={skill}
                                                            className="rounded-md border border-blue-900 bg-blue-950/80 px-2.5 py-1 text-xs font-medium text-blue-300"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ),
                                                )}
                                                {candidate.badges.map(
                                                    (badge) => (
                                                        <span
                                                            key={badge}
                                                            className="inline-flex items-center gap-1 rounded-md border border-amber-900 bg-amber-950/80 px-2.5 py-1 text-xs font-medium text-amber-300"
                                                        >
                                                            <Award className="h-3 w-3 text-amber-400" />
                                                            {badge}
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    router.get(
                                                        `/recruiter/talent/candidates/${candidate.id}`,
                                                    )
                                                }
                                                className="inline-flex items-center gap-2 rounded-xl bg-slate-700/80 px-4 py-2.5 text-xs font-semibold text-slate-100 transition-all hover:bg-blue-600 hover:text-white"
                                            >
                                                View Profile{' '}
                                                <ChevronRight className="h-4 w-4" />
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleUnsave(candidate.id)
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-900/60 bg-rose-950/40 px-3.5 py-2.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-900 hover:text-white"
                                                title="Remove candidate from saved list"
                                            >
                                                <Trash2 className="h-4 w-4" />{' '}
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
