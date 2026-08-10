import { Head } from '@inertiajs/react';
import {
    ArrowLeft,
    Award,
    CheckCircle,
    Lock,
    Send,
    Shield,
} from 'lucide-react';
import React from 'react';
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

interface CandidateDetailProps {
    candidate: Candidate;
    contactConsequenceNotice: string;
}

export default function CandidateDetail({
    candidate,
    contactConsequenceNotice,
}: CandidateDetailProps) {
    return (
        <AppLayout>
            <Head
                title={`${candidate.headline || 'Candidate Profile'} - SATU Platform`}
            />

            <div className="mx-auto min-h-screen max-w-5xl space-y-8 bg-slate-900 p-6 text-slate-100 md:p-10">
                {/* Navigation */}
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-200"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Talent Search
                </button>

                {/* Profile Card */}
                <div className="space-y-8 rounded-3xl border border-slate-700/60 bg-slate-800/60 p-8 shadow-2xl">
                    {/* Header */}
                    <div className="flex flex-col justify-between gap-6 border-b border-slate-700/60 pb-8 md:flex-row md:items-center">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-extrabold text-slate-100 md:text-3xl">
                                    {candidate.headline ||
                                        'Verified Student Candidate'}
                                </h1>
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
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

                            {/* Provenance Badge */}
                            {candidate.institution_name && (
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                    <span>
                                        Verified Student at{' '}
                                        <strong className="text-slate-100">
                                            {candidate.institution_name}
                                        </strong>
                                    </span>
                                    {candidate.verified_at && (
                                        <span className="text-xs text-slate-500">
                                            (Verified{' '}
                                            {new Date(
                                                candidate.verified_at,
                                            ).toLocaleDateString()}
                                            )
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="shrink-0">
                            <button
                                disabled
                                className="inline-flex cursor-not-allowed items-center gap-2 rounded-2xl bg-blue-600/50 px-6 py-3 text-xs font-semibold text-slate-300 opacity-80 shadow-lg"
                                title="Contact request requires active contact entitlement"
                            >
                                <Send className="h-4 w-4" /> Send Contact
                                Request
                            </button>
                        </div>
                    </div>

                    {/* Contact Consequence Notice Banner */}
                    <div className="flex items-start gap-4 rounded-2xl border border-slate-700/80 bg-slate-900/80 p-5">
                        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                        <div className="space-y-1">
                            <h4 className="text-xs font-bold tracking-wider text-blue-400 uppercase">
                                Recruiter Privacy Boundary
                            </h4>
                            <p className="text-xs leading-relaxed text-slate-300">
                                {contactConsequenceNotice}
                            </p>
                        </div>
                    </div>

                    {/* Biography */}
                    {candidate.bio && (
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                About Candidate
                            </h3>
                            <p className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-5 text-sm leading-relaxed text-slate-200">
                                {candidate.bio}
                            </p>
                        </div>
                    )}

                    {/* Skills */}
                    {candidate.skills.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                Verified Skills
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {candidate.skills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="rounded-xl border border-blue-900/80 bg-blue-950 px-3.5 py-1.5 text-xs font-medium text-blue-300"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Badges */}
                    {candidate.badges.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                Academic & Project Badges
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {candidate.badges.map((badge) => (
                                    <span
                                        key={badge}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-900/80 bg-amber-950 px-3.5 py-1.5 text-xs font-medium text-amber-300"
                                    >
                                        <Award className="h-4 w-4 text-amber-400" />
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Verified Contributions */}
                    {candidate.contributions.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                                Verified Contributions
                            </h3>
                            <ul className="space-y-2">
                                {candidate.contributions.map((contrib, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-center gap-2 rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3 text-xs text-slate-300"
                                    >
                                        <Shield className="h-4 w-4 shrink-0 text-emerald-400" />
                                        {typeof contrib === 'string'
                                            ? contrib
                                            : JSON.stringify(contrib)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
