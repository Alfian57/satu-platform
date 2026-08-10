import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Lock, Mail, Shield, XCircle } from 'lucide-react';
import React, { useTransition } from 'react';
import AppLayout from '@/layouts/app-layout';

interface StudentContactRequestItem {
    id: number;
    organization_name: string;
    recruiter_name: string;
    purpose: string;
    message: string | null;
    status: string;
    created_at: string;
    expires_at: string;
    responded_at: string | null;
}

interface StudentContactRequestsProps {
    requests: StudentContactRequestItem[];
}

export default function StudentContactRequests({
    requests,
}: StudentContactRequestsProps) {
    const [isPending, startTransition] = useTransition();

    const handleAccept = (requestId: number) => {
        startTransition(() => {
            router.post(
                `/student/contact-requests/${requestId}/accept`,
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        });
    };

    const handleDecline = (requestId: number) => {
        startTransition(() => {
            router.post(
                `/student/contact-requests/${requestId}/decline`,
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        });
    };

    return (
        <AppLayout>
            <Head title="Recruiter Contact Requests - SATU Platform" />

            <div className="mx-auto min-h-screen max-w-5xl space-y-8 bg-slate-900 p-6 text-slate-100 md:p-10">
                {/* Header */}
                <div className="border-b border-slate-800 pb-6">
                    <div className="flex items-center gap-3">
                        <h1 className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                            Recruiter Outreach Requests
                        </h1>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-800/50 bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-300">
                            <Shield className="h-3.5 w-3.5 text-emerald-400" />{' '}
                            Student Consent Privacy
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                        Review purpose-bound contact requests from verified
                        recruiter organizations. Your phone number is only
                        shared upon explicit acceptance.
                    </p>
                </div>

                {/* Privacy Safeguard Banner */}
                <div className="flex items-start gap-4 rounded-2xl border border-blue-800/60 bg-blue-950/40 p-5 text-blue-200">
                    <Lock className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
                    <div className="space-y-1 text-xs">
                        <h4 className="font-bold tracking-wider text-blue-300 uppercase">
                            Consent & Privacy Guarantee
                        </h4>
                        <p className="leading-relaxed text-blue-200/80">
                            Recruiters never receive your WhatsApp / phone
                            number until you click Accept. Declining or ignoring
                            a request preserves your private student
                            credentials.
                        </p>
                    </div>
                </div>

                {/* Requests List */}
                <div
                    role="region"
                    aria-busy={isPending}
                    aria-live="polite"
                    className="space-y-4"
                >
                    <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
                        Received Requests ({requests.length})
                    </h2>

                    {requests.length === 0 && (
                        <div className="space-y-4 rounded-2xl border border-slate-700/50 bg-slate-800/30 p-12 text-center">
                            <Mail className="mx-auto h-12 w-12 text-slate-600" />
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold text-slate-300">
                                    No Pending Contact Requests
                                </h3>
                                <p className="mx-auto max-w-md text-sm text-slate-500">
                                    You have no active contact requests from
                                    recruiters. Keep your portfolio projection
                                    updated to attract verified opportunities.
                                </p>
                            </div>
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
                                                    {req.organization_name}
                                                </h3>
                                                <span className="text-xs text-slate-400">
                                                    (Recruiter:{' '}
                                                    {req.recruiter_name})
                                                </span>
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

                                            <div className="space-y-1 rounded-xl border border-slate-700/40 bg-slate-900/40 p-4 text-xs text-slate-300">
                                                <p className="font-semibold text-slate-200">
                                                    Purpose: {req.purpose}
                                                </p>
                                                {req.message && (
                                                    <p className="pt-1 text-slate-400">
                                                        "{req.message}"
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 pt-1 text-xs text-slate-500">
                                                <span>
                                                    Received{' '}
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
                                            <div className="flex shrink-0 items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        handleAccept(req.id)
                                                    }
                                                    disabled={isPending}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />{' '}
                                                    Accept
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        handleDecline(req.id)
                                                    }
                                                    disabled={isPending}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
                                                >
                                                    <XCircle className="h-4 w-4" />{' '}
                                                    Decline
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
