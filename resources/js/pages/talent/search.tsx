import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Award,
    Briefcase,
    CheckCircle,
    ChevronRight,
    Filter,
    Search,
    Shield,
    UserCheck,
    X,
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

interface Institution {
    id: number;
    name: string;
}

interface TalentSearchProps {
    candidates: {
        data: Candidate[];
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
    };
    filters: {
        query: string;
        skills: string[];
        badges: string[];
        availability: string;
        institution_id: string;
    };
    entitlement: {
        has_entitlement: boolean;
        status: string;
        expires_at: string | null;
    };
    institutions: Institution[];
}

export default function TalentSearch({
    candidates,
    filters,
    entitlement,
    institutions,
}: TalentSearchProps) {
    const [searchQuery, setSearchQuery] = useState(filters.query || '');
    const [selectedAvailability, setSelectedAvailability] = useState(
        filters.availability || '',
    );
    const [selectedInstitution, setSelectedInstitution] = useState(
        filters.institution_id || '',
    );
    const [skillInput, setSkillInput] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>(
        filters.skills || [],
    );
    const [isPending, startTransition] = useTransition();

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        startTransition(() => {
            router.get(
                '/recruiter/talent/search',
                {
                    query: searchQuery || undefined,
                    skills:
                        selectedSkills.length > 0
                            ? selectedSkills.join(',')
                            : undefined,
                    availability: selectedAvailability || undefined,
                    institution_id: selectedInstitution || undefined,
                },
                { preserveState: true, replace: true },
            );
        });
    };

    const addSkill = (skill: string) => {
        const trimmed = skill.trim();

        if (trimmed && !selectedSkills.includes(trimmed)) {
            const updated = [...selectedSkills, trimmed];

            setSelectedSkills(updated);
        }

        setSkillInput('');
    };

    const removeSkill = (skillToRemove: string) => {
        const updated = selectedSkills.filter((s) => s !== skillToRemove);
        setSelectedSkills(updated);
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedAvailability('');
        setSelectedInstitution('');
        setSelectedSkills([]);
        router.get(
            '/recruiter/talent/search',
            {},
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout>
            <Head title="Talent Search - SATU Platform" />

            <div className="mx-auto min-h-screen max-w-7xl space-y-8 bg-slate-900 p-6 text-slate-100 md:p-10">
                {/* Header */}
                <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                                Talent Search
                            </h1>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/50 bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-300">
                                <Shield className="h-3.5 w-3.5 text-emerald-400" />{' '}
                                Verified Safe Projection
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                            Search verified student portfolios with strict
                            recruiter-safe privacy projections.
                        </p>
                    </div>

                    {entitlement.has_entitlement && (
                        <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-300">
                            <UserCheck className="h-4 w-4 text-blue-400" />
                            <span>Entitlement Active</span>
                            {entitlement.expires_at && (
                                <span className="text-slate-500">
                                    (Expires{' '}
                                    {new Date(
                                        entitlement.expires_at,
                                    ).toLocaleDateString()}
                                    )
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Entitlement Alert Banner if Entitlement is Missing or Expired */}
                {!entitlement.has_entitlement && (
                    <div
                        role="alert"
                        className="flex items-start gap-4 rounded-2xl border border-amber-800/60 bg-amber-950/60 p-5 text-amber-200 shadow-lg"
                    >
                        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-400" />
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold text-amber-300">
                                {entitlement.status === 'expired'
                                    ? 'Candidate Search Entitlement Expired'
                                    : 'Candidate Search Entitlement Required'}
                            </h3>
                            <p className="text-sm leading-relaxed text-amber-300/80">
                                Your recruiter organization requires an active
                                Talent Entitlement grant to search verified
                                candidates. Contact your platform administrator
                                to grant or renew your entitlement.
                            </p>
                        </div>
                    </div>
                )}

                {/* Search & Filter Section */}
                <form
                    onSubmit={handleFilterSubmit}
                    className="space-y-5 rounded-2xl border border-slate-700/60 bg-slate-800/50 p-6 shadow-xl"
                >
                    <div className="flex flex-col gap-4 md:flex-row">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute top-3.5 left-4 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search candidates by headline or bio..."
                                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pr-4 pl-11 text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                aria-label="Search candidates by headline or bio"
                            />
                        </div>

                        {/* Availability Filter */}
                        <select
                            value={selectedAvailability}
                            onChange={(e) =>
                                setSelectedAvailability(e.target.value)
                            }
                            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            aria-label="Filter by availability status"
                        >
                            <option value="">All Availability</option>
                            <option value="available">Available Now</option>
                            <option value="open_to_offers">
                                Open to Offers
                            </option>
                            <option value="not_available">Not Available</option>
                        </select>

                        {/* Institution Filter */}
                        <select
                            value={selectedInstitution}
                            onChange={(e) =>
                                setSelectedInstitution(e.target.value)
                            }
                            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            aria-label="Filter by campus institution"
                        >
                            <option value="">All Institutions</option>
                            {institutions.map((inst) => (
                                <option key={inst.id} value={inst.id}>
                                    {inst.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Skill Pills Filter */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                            Skill Filters
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                            {selectedSkills.map((skill) => (
                                <span
                                    key={skill}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-800 bg-blue-950 px-3 py-1 text-xs font-medium text-blue-300"
                                >
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => removeSkill(skill)}
                                        className="transition-colors hover:text-blue-100"
                                        aria-label={`Remove skill ${skill}`}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </span>
                            ))}

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) =>
                                        setSkillInput(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addSkill(skillInput);
                                        }
                                    }}
                                    placeholder="Add skill (press Enter)..."
                                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                />
                                {skillInput && (
                                    <button
                                        type="button"
                                        onClick={() => addSkill(skillInput)}
                                        className="rounded-lg bg-slate-700 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-slate-600"
                                    >
                                        Add
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
                        >
                            Reset Filters
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !entitlement.has_entitlement}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Filter className="h-4 w-4" /> Apply Filters
                        </button>
                    </div>
                </form>

                {/* Candidate Results Region */}
                <div
                    role="region"
                    aria-busy={isPending}
                    aria-live="polite"
                    className="space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
                            Verified Candidates ({candidates.total})
                        </h2>
                        <span role="status" className="text-xs text-slate-500">
                            Page {candidates.current_page} of{' '}
                            {candidates.last_page}
                        </span>
                    </div>

                    {/* Skeleton Loading State */}
                    {isPending && (
                        <div className="space-y-4">
                            {[1, 2, 3].map((n) => (
                                <div
                                    key={n}
                                    className="animate-pulse space-y-3 rounded-2xl border border-slate-700/40 bg-slate-800/40 p-6"
                                >
                                    <div className="h-5 w-1/3 rounded bg-slate-700/60"></div>
                                    <div className="h-4 w-2/3 rounded bg-slate-700/40"></div>
                                    <div className="flex gap-2">
                                        <div className="h-6 w-16 rounded-full bg-slate-700/50"></div>
                                        <div className="h-6 w-20 rounded-full bg-slate-700/50"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty Results State */}
                    {!isPending && candidates.data.length === 0 && (
                        <div className="space-y-4 rounded-2xl border border-slate-700/50 bg-slate-800/30 p-12 text-center">
                            <Briefcase className="mx-auto h-12 w-12 text-slate-600" />
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold text-slate-300">
                                    No Candidates Found
                                </h3>
                                <p className="mx-auto max-w-md text-sm text-slate-500">
                                    No verified candidate projections match your
                                    selected filters. Try broadening your search
                                    or resetting filters.
                                </p>
                            </div>
                            <button
                                onClick={resetFilters}
                                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold transition-colors hover:bg-slate-700"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    )}

                    {/* Results Table / List View */}
                    {!isPending && candidates.data.length > 0 && (
                        <div className="space-y-4">
                            {candidates.data.map((candidate) => (
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
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                                                        candidate.availability_status ===
                                                        'available'
                                                            ? 'border border-emerald-800 bg-emerald-950 text-emerald-400'
                                                            : 'border border-slate-700 bg-slate-900 text-slate-400'
                                                    }`}
                                                >
                                                    {candidate.availability_status.replace(
                                                        /_/g,
                                                        ' ',
                                                    )}
                                                </span>
                                            </div>

                                            {candidate.bio && (
                                                <p className="line-clamp-2 text-sm text-slate-300/80">
                                                    {candidate.bio}
                                                </p>
                                            )}

                                            {/* Skills & Badges */}
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

                                        <div className="flex shrink-0 items-center">
                                            <button
                                                onClick={() =>
                                                    router.get(
                                                        `/recruiter/talent/candidates/${candidate.id}`,
                                                    )
                                                }
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-700/80 px-5 py-2.5 text-xs font-semibold text-slate-100 transition-all group-hover:shadow-lg group-hover:shadow-blue-500/20 hover:bg-blue-600 hover:text-white md:w-auto"
                                            >
                                                View Profile{' '}
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {candidates.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-800 pt-6">
                            <button
                                disabled={candidates.current_page <= 1}
                                onClick={() =>
                                    router.get('/recruiter/talent/search', {
                                        ...filters,
                                        page: candidates.current_page - 1,
                                    })
                                }
                                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium transition-colors hover:bg-slate-700 disabled:opacity-40"
                                aria-label="Go to previous page"
                            >
                                Previous
                            </button>
                            <span className="text-xs text-slate-400">
                                Page {candidates.current_page} of{' '}
                                {candidates.last_page}
                            </span>
                            <button
                                disabled={
                                    candidates.current_page >=
                                    candidates.last_page
                                }
                                onClick={() =>
                                    router.get('/recruiter/talent/search', {
                                        ...filters,
                                        page: candidates.current_page + 1,
                                    })
                                }
                                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium transition-colors hover:bg-slate-700 disabled:opacity-40"
                                aria-label="Go to next page"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
