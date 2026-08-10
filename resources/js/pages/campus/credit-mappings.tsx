import { Head, router } from '@inertiajs/react';
import {
    Award,
    CheckCircle2,
    Plus,
    Shield,
    XCircle,
} from 'lucide-react';
import React, { useState, useTransition } from 'react';
import AppLayout from '@/layouts/app-layout';

interface CreditMappingItem {
    id: number;
    activity_type: string;
    credit_amount: number;
    status: string;
    effective_from: string | null;
    effective_to: string | null;
    approver_name: string | null;
    reason: string | null;
    created_at: string;
}

interface CampusCreditMappingsProps {
    mappings: CreditMappingItem[];
    institution: {
        id: number;
        name: string;
    } | null;
}

export default function CampusCreditMappings({
    mappings,
    institution,
}: CampusCreditMappingsProps) {
    const [activityType, setActivityType] = useState('project');
    const [creditAmount, setCreditAmount] = useState('3.0');
    const [reason, setReason] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleCreateDraft = (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(() => {
            router.post(
                '/campus/credit-mappings',
                {
                    activity_type: activityType,
                    credit_amount: parseFloat(creditAmount),
                    reason: reason || undefined,
                },
                {
                    preserveState: true,
                    onSuccess: () => setReason(''),
                }
            );
        });
    };

    const handleActivate = (id: number) => {
        startTransition(() => {
            router.post(`/campus/credit-mappings/${id}/activate`, {}, {
                preserveState: true,
                preserveScroll: true,
            });
        });
    };

    const handleRetire = (id: number) => {
        startTransition(() => {
            router.post(`/campus/credit-mappings/${id}/retire`, {}, {
                preserveState: true,
                preserveScroll: true,
            });
        });
    };

    return (
        <AppLayout>
            <Head title="Academic Credit Mappings - SATU Platform" />

            <div className="min-h-screen mx-auto max-w-7xl space-y-8 bg-slate-900 p-6 text-slate-100 md:p-10">
                {/* Header */}
                <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                                Academic Credit Mapping Engine
                            </h1>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-800/50 bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-300">
                                <Shield className="h-3.5 w-3.5 text-blue-400" /> Versioned Policy Rules
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                            Configure versioned activity-to-credit mapping rulesets for{' '}
                            <strong className="text-slate-200">
                                {institution?.name || 'Campus Institution'}
                            </strong>
                            .
                        </p>
                    </div>
                </div>

                {/* Form to Create Draft Mapping */}
                <form
                    onSubmit={handleCreateDraft}
                    className="space-y-4 rounded-2xl border border-slate-700/60 bg-slate-800/50 p-6 shadow-xl"
                >
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                        Create Draft Credit Mapping Rule
                    </h2>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-medium">
                                Activity Type
                            </label>
                            <select
                                value={activityType}
                                onChange={(e) => setActivityType(e.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="project">Verified Project</option>
                                <option value="competition">Competition / Hackathon</option>
                                <option value="research">Academic Research</option>
                                <option value="organization">Student Organization Leadership</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-medium">
                                Credit Amount (SKS)
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                max="24"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(e.target.value)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-medium">
                                Policy Reason / Notes
                            </label>
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Curriculum credit policy update..."
                                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition-all hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
                        >
                            <Plus className="h-4 w-4" /> Create Draft Mapping
                        </button>
                    </div>
                </form>

                {/* Mappings List */}
                <div
                    role="region"
                    aria-busy={isPending}
                    aria-live="polite"
                    className="space-y-4"
                >
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Configured Mapping Rulesets ({mappings.length})
                    </h2>

                    {mappings.length === 0 && (
                        <div className="space-y-4 rounded-2xl border border-slate-700/50 bg-slate-800/30 p-12 text-center">
                            <Award className="mx-auto h-12 w-12 text-slate-600" />
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold text-slate-300">
                                    No Credit Mappings Configured
                                </h3>
                                <p className="mx-auto max-w-md text-sm text-slate-500">
                                    Create a draft credit mapping ruleset above to start allocating academic credits to verified activities.
                                </p>
                            </div>
                        </div>
                    )}

                    {mappings.length > 0 && (
                        <div className="space-y-4">
                            {mappings.map((map) => (
                                <div
                                    key={map.id}
                                    className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-6 shadow-md"
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div className="space-y-2 max-w-2xl">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-base font-bold text-slate-100 capitalize">
                                                    {map.activity_type.replace(/_/g, ' ')}
                                                </h3>
                                                <span className="rounded-lg border border-blue-900 bg-blue-950 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
                                                    {map.credit_amount} SKS / Credits
                                                </span>
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                                                        map.status === 'active'
                                                            ? 'border border-emerald-800 bg-emerald-950 text-emerald-400'
                                                            : map.status === 'draft'
                                                            ? 'border border-amber-800 bg-amber-950 text-amber-300'
                                                            : 'border border-slate-700 bg-slate-900 text-slate-400'
                                                    }`}
                                                >
                                                    {map.status}
                                                </span>
                                            </div>

                                            {map.reason && (
                                                <p className="text-xs text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-slate-700/40">
                                                    Note: {map.reason}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                                                {map.effective_from && (
                                                    <span>
                                                        Effective From:{' '}
                                                        {new Date(map.effective_from).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {map.approver_name && (
                                                    <span>Approver: {map.approver_name}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {map.status === 'draft' && (
                                                <button
                                                    onClick={() => handleActivate(map.id)}
                                                    disabled={isPending}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" /> Activate Policy
                                                </button>
                                            )}

                                            {map.status === 'active' && (
                                                <button
                                                    onClick={() => handleRetire(map.id)}
                                                    disabled={isPending}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
                                                >
                                                    <XCircle className="h-4 w-4" /> Retire Policy
                                                </button>
                                            )}
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
