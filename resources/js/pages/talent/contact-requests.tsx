import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Ban, Mail, Send, UserCheck } from 'lucide-react';
import React, { useTransition } from 'react';
import AppLayout from '@/layouts/app-layout';

interface ContactRequestItem {
    id: number;
    purpose: string;
    message: string | null;
    status: string;
    created_at: string;
    expires_at: string;
    responded_at: string | null;
    candidate_name: string;
    candidate_headline: string | null;
}

interface RecruiterContactRequestsProps {
    requests: ContactRequestItem[];
    entitlement: {
        has_entitlement: boolean;
    };
}

export default function RecruiterContactRequests({
    requests,
    entitlement,
}: RecruiterContactRequestsProps) {
    const [isPending, startTransition] = useTransition();

    const handleCancel = (requestId: number) => {
        startTransition(() => {
            router.delete(`/recruiter/talent/contact-requests/${requestId}`, {
                preserveState: true,
                preserveScroll: true,
            });
        });
    };

    return (
        <AppLayout>
            <Head title="Sent Contact Requests - SATU Platform" />

            <div className="mx-auto min-h-screen max-w-7xl space-y-8 bg-slate-900 p-6 text-slate-100 md:p-10">
                {/* Header */}
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
                                Contact Requests
                            </h1>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-800/50 bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-300">
                                <Send className="h-3.5 w-3.5 text-blue-400" />{' '}
                                Outbound Outreach
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                            Purpose-bound contact requests sent to verified
                            student candidates.
                        </p>
                    </div>

                    {entitlement.has_entitlement && (
                        <div className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-300">
                            <UserCheck className="h-4 w-4 text-blue-400" />
                            <span>Entitlement Active</span>
                        </div>
                    )}
                </div>

                {/* Contact Requests List Region */}
                <div
                    role="region"
                    aria-busy={isPending}
                    aria-live="polite"
                    className="space-y-4"
                >
                    <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
                        Outreach Requests ({requests.length})
                    </h2>

                    {requests.length === 0 && (
                        <div className="space-y-4 rounded-2xl border border-slate-700/50 bg-slate-800/30 p-12 text-center">
                            <Mail className="mx-auto h-12 w-12 text-slate-600" />
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold text-slate-300">
                                    No Contact Requests Sent
                                </h3>
                                <p className="mx-auto max-w-md text-sm text-slate-500">
                                    You have not sent any contact requests yet.
                                    Browse candidates in Talent Search to send
                                    outreach requests.
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

                    {requests.length > 0 && (
                        <div className="space-y-4">
                            {requests.map((req) => (
                                <div
                                    key={req.id}
                                    className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-6 shadow-md"
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="max-w-2xl space-y-2">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-base font-bold text-slate-100">
                                                    {req.candidate_name}
                                                </h3>
                                                {req.candidate_headline && (
                                                    <span className="text-xs text-slate-400">
                                                        (
                                                        {req.candidate_headline}
                                                        )
                                                    </span>
                                                )}
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                                                        req.status ===
                                                        'accepted'
                                                            ? 'border border-emerald-800 bg-emerald-950 text-emerald-400'
                                                            : req.status ===
                                                                'declined'
                                                              ? 'border border-rose-900 bg-rose-950 text-rose-300'
                                                              : req.status ===
                                                                  'pending'
                                                                ? 'border border-amber-800 bg-amber-950 text-amber-300'
                                                                : 'border border-slate-700 bg-slate-900 text-slate-400'
                                                    }`}
                                                >
                                                    {req.status}
                                                </span>
                                            </div>

                                            <div className="space-y-1 rounded-xl border border-slate-700/40 bg-slate-900/40 p-3 text-xs text-slate-300">
                                                <p className="font-semibold text-slate-200">
                                                    Purpose: {req.purpose}
                                                </p>
                                                {req.message && (
                                                    <p className="text-slate-400">
                                                        {req.message}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 pt-1 text-xs text-slate-500">
                                                <span>
                                                    Sent{' '}
                                                    {new Date(
                                                        req.created_at,
                                                    ).toLocaleDateString()}
                                                </span>
                                                <span>
                                                    Expires{' '}
                                                    {new Date(
                                                        req.expires_at,
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        {req.status === 'pending' && (
                                            <div className="shrink-0">
                                                <button
                                                    onClick={() =>
                                                        handleCancel(req.id)
                                                    }
                                                    disabled={isPending}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-900/60 bg-rose-950/40 px-3.5 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-900 hover:text-white disabled:opacity-50"
                                                >
                                                    <Ban className="h-4 w-4" />{' '}
                                                    Cancel Request
                                                </button>
                                            </div>
                                        )}
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
