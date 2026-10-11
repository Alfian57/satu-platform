import { Head, router, useForm } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    FileWarning,
    Landmark,
    MailWarning,
    Send,
    ShieldAlert,
    ShieldCheck,
    UserRoundCog,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { AppPage } from '@/components/app-page';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { approve, suspend } from '@/routes/platform/institutions';
import {
    store as issueInvitation,
    revoke,
} from '@/routes/platform/invitations';
import { index as operationsIndex } from '@/routes/platform/operations';
import { revoke as revokeRecruiterEntitlement } from '@/routes/platform/recruiter-entitlements';
import { review as reviewRecruiterOrganization } from '@/routes/platform/recruiter-organizations';
import { store as grantRecruiterEntitlement } from '@/routes/platform/recruiter-organizations/entitlements';

type InstitutionStatus = 'pending' | 'active' | 'suspended' | 'archived';
type InvitationStatus = 'issued' | 'accepted' | 'expired' | 'revoked';
type RecruiterOrganizationStatus =
    'pending' | 'verified' | 'rejected' | 'suspended';
type MessageStatus =
    'pending' | 'processing' | 'sent' | 'delivered' | 'failed' | 'cancelled';

type Institution = {
    id: number;
    name: string;
    slug: string;
    status: InstitutionStatus;
    verifiedCampusAdminsCount: number;
    openInvitationsCount: number;
    updatedAt: string | null;
};

type Invitation = {
    id: number;
    institutionName: string;
    phoneMasked: string;
    status: InvitationStatus;
    deliveryStatus: string | null;
    expiresAt: string;
    canRevoke: boolean;
};

type ActiveEntitlement = {
    id: number;
    scope: string;
    status: string;
    startsAt: string;
    endsAt: string | null;
};

type RecruiterOrganization = {
    id: number;
    name: string;
    industry: string | null;
    status: RecruiterOrganizationStatus;
    activeMembershipsCount: number;
    activeEntitlementsCount: number;
    activeEntitlements?: ActiveEntitlement[];
};

type AuditLog = {
    id: number;
    operation: string;
    reason: string | null;
    actorName: string;
    institutionName: string | null;
    createdAt: string;
};

type Props = {
    filters: { q: string; status: 'all' | InstitutionStatus };
    summary: {
        pendingInstitutions: number;
        openInvitations: number;
        pendingRecruiterOrganizations: number;
        failedMessages: number;
    };
    institutions: Institution[];
    invitations: Invitation[];
    recruiterOrganizations: RecruiterOrganization[];
    provider: {
        totals: Record<MessageStatus, number>;
        recentFailures: {
            id: number;
            purpose: string;
            attempts: number;
            maxAttempts: number;
            updatedAt: string;
        }[];
    };
    auditLogs: AuditLog[];
};

type Command =
    | { kind: 'approve'; institution: Institution }
    | { kind: 'suspend'; institution: Institution }
    | { kind: 'invite'; institution: Institution }
    | { kind: 'revoke'; invitation: Invitation }
    | {
          kind: 'reviewRecruiter';
          organization: RecruiterOrganization;
          conclusion: 'verified' | 'rejected' | 'suspended' | 'unsuspend';
      }
    | {
          kind: 'grantEntitlement';
          organization: RecruiterOrganization;
      }
    | {
          kind: 'revokeEntitlement';
          entitlement: ActiveEntitlement;
          organizationName: string;
      };

const institutionStatusMeta: Record<
    InstitutionStatus,
    { label: string; className: string }
> = {
    pending: {
        label: 'Menunggu persetujuan',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    active: {
        label: 'Aktif',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    suspended: {
        label: 'Ditangguhkan',
        className: 'border-rose-200 bg-rose-50 text-rose-800',
    },
    archived: {
        label: 'Diarsipkan',
        className: 'border-slate-200 bg-slate-100 text-slate-700',
    },
};

const invitationStatusMeta: Record<
    InvitationStatus,
    { label: string; className: string }
> = {
    issued: {
        label: 'Diterbitkan',
        className: 'border-blue-200 bg-blue-50 text-blue-800',
    },
    accepted: {
        label: 'Diterima',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    expired: {
        label: 'Kedaluwarsa',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    revoked: {
        label: 'Dicabut',
        className: 'border-slate-200 bg-slate-100 text-slate-700',
    },
};

const recruiterStatusMeta: Record<
    RecruiterOrganizationStatus,
    { label: string; className: string }
> = {
    pending: {
        label: 'Menunggu verifikasi',
        className: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    verified: {
        label: 'Terverifikasi',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    rejected: {
        label: 'Ditolak',
        className: 'border-rose-200 bg-rose-50 text-rose-800',
    },
    suspended: {
        label: 'Ditangguhkan',
        className: 'border-rose-200 bg-rose-50 text-rose-800',
    },
};

const messageStatusLabels: Record<MessageStatus, string> = {
    pending: 'Menunggu',
    processing: 'Diproses',
    sent: 'Terkirim',
    delivered: 'Diterima',
    failed: 'Gagal',
    cancelled: 'Dibatalkan',
};

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta',
    }).format(new Date(value));
}

function formatDate(value: string | null): string {
    if (value === null) {
        return 'Belum diperbarui';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeZone: 'Asia/Jakarta',
    }).format(new Date(value));
}

function operationLabel(operation: string): string {
    const labels: Record<string, string> = {
        'institution.approved': 'Institusi disetujui',
        'institution.suspended': 'Institusi ditangguhkan',
        'institution.invitation.issued': 'Undangan admin kampus diterbitkan',
        'institution.invitation.revoked': 'Undangan admin kampus dicabut',
        'recruiter_organization.reviewed': 'Organisasi perekrut ditinjau',
        'recruiter_entitlement.granted': 'Hak akses Talent Portal diterbitkan',
        'recruiter_entitlement.revoked': 'Hak akses Talent Portal dicabut',
    };

    return labels[operation] ?? operation.replaceAll('.', ' ');
}

function SummaryCard({
    icon: Icon,
    label,
    value,
    className,
}: {
    icon: LucideIcon;
    label: string;
    value: number;
    className: string;
}) {
    return (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <span
                className={cn(
                    'flex size-9 items-center justify-center rounded-xl',
                    className,
                )}
            >
                <Icon aria-hidden="true" className="size-4" />
            </span>
            <strong className="mt-5 block text-2xl font-bold tracking-[-0.03em] text-foreground">
                {value}
            </strong>
            <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                {label}
            </span>
        </div>
    );
}

export default function PlatformOperations({
    filters,
    summary,
    institutions,
    invitations,
    recruiterOrganizations,
    provider,
    auditLogs,
}: Props) {
    const [query, setQuery] = useState(filters.q);
    const [status, setStatus] = useState<'all' | InstitutionStatus>(
        filters.status,
    );
    const [command, setCommand] = useState<Command | null>(null);
    const commandForm = useForm({
        phone: '',
        reason: '',
        conclusion: '',
        scope: 'candidate_search',
        starts_at: '',
        ends_at: '',
    });

    function closeCommand(): void {
        setCommand(null);
        commandForm.reset();
        commandForm.clearErrors();
    }

    function submitFilters(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        router.get(
            operationsIndex.url({
                query: {
                    q: query.trim() || undefined,
                    status: status === 'all' ? undefined : status,
                },
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    function submitCommand(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (command === null) {
            return;
        }

        const options = {
            preserveScroll: true,
            onSuccess: closeCommand,
        };

        if (command.kind === 'approve') {
            commandForm.post(approve(command.institution.id).url, options);

            return;
        }

        if (command.kind === 'suspend') {
            commandForm.post(suspend(command.institution.id).url, options);

            return;
        }

        if (command.kind === 'invite') {
            commandForm.post(
                issueInvitation(command.institution.id).url,
                options,
            );

            return;
        }

        if (command.kind === 'reviewRecruiter') {
            commandForm.post(
                reviewRecruiterOrganization(command.organization.id).url,
                options,
            );

            return;
        }

        if (command.kind === 'grantEntitlement') {
            commandForm.post(
                grantRecruiterEntitlement(command.organization.id).url,
                options,
            );

            return;
        }

        if (command.kind === 'revokeEntitlement') {
            commandForm.post(
                revokeRecruiterEntitlement(command.entitlement.id).url,
                options,
            );

            return;
        }

        commandForm.post(revoke(command.invitation.id).url, options);
    }

    const commandTitle =
        command === null
            ? ''
            : command.kind === 'revoke'
              ? 'Cabut undangan ' + command.invitation.phoneMasked
              : command.kind === 'approve'
                ? 'Setujui ' + command.institution.name
                : command.kind === 'suspend'
                  ? 'Tangguhkan ' + command.institution.name
                  : command.kind === 'invite'
                    ? 'Undang admin kampus untuk ' + command.institution.name
                    : command.kind === 'reviewRecruiter'
                      ? command.conclusion === 'verified'
                          ? 'Verifikasi ' + command.organization.name
                          : command.conclusion === 'rejected'
                            ? 'Tolak ' + command.organization.name
                            : command.conclusion === 'suspended'
                              ? 'Tangguhkan ' + command.organization.name
                              : 'Cabut penangguhan ' + command.organization.name
                      : command.kind === 'grantEntitlement'
                        ? 'Beri Hak Akses Talent Portal: ' +
                          command.organization.name
                        : 'Cabut Hak Akses Talent Portal: ' +
                          command.organizationName;

    const commandDescription =
        command === null
            ? ''
            : command.kind === 'approve'
              ? 'Institusi akan aktif dan dapat menerima undangan admin kampus.'
              : command.kind === 'suspend'
                ? 'Akses operasional institusi akan ditangguhkan. Tindakan ini perlu alasan dan tercatat pada audit.'
                : command.kind === 'invite'
                  ? 'Undangan satu kali akan dikirim ke nomor WhatsApp yang diberikan.'
                  : command.kind === 'revoke'
                    ? 'Tautan undangan tidak akan bisa lagi dipakai. Tindakan ini perlu alasan dan tercatat pada audit.'
                    : command.kind === 'reviewRecruiter'
                      ? command.conclusion === 'verified'
                          ? 'Organisasi perekrut akan diverifikasi sehingga dapat mengelola tim dan menerima hak akses Talent Portal.'
                          : command.conclusion === 'rejected'
                            ? 'Pendaftaran organisasi perekrut akan ditolak. Berikan alasan penolakan.'
                            : command.conclusion === 'suspended'
                              ? 'Akses operasional organisasi perekrut akan ditangguhkan. Berikan alasan penangguhan.'
                              : 'Penangguhan organisasi perekrut akan dicabut dan status kembali aktif terverifikasi.'
                      : command.kind === 'grantEntitlement'
                        ? 'Berikan hak akses pencarian kandidat (candidate_search) kepada organisasi perekrut yang terverifikasi.'
                        : 'Hak akses pencarian kandidat organisasi perekrut akan dicabut segera. Tindakan ini membutuhkan alasan.';

    const commandButtonLabel =
        command === null || command.kind === 'revoke'
            ? 'Cabut undangan'
            : command.kind === 'approve'
              ? 'Setujui institusi'
              : command.kind === 'suspend'
                ? 'Tangguhkan institusi'
                : command.kind === 'invite'
                  ? 'Kirim undangan'
                  : command.kind === 'reviewRecruiter'
                    ? command.conclusion === 'verified'
                        ? 'Verifikasi organisasi'
                        : command.conclusion === 'rejected'
                          ? 'Tolak organisasi'
                          : command.conclusion === 'suspended'
                            ? 'Tangguhkan organisasi'
                            : 'Aktifkan kembali'
                    : command.kind === 'grantEntitlement'
                      ? 'Terbitkan hak akses'
                      : 'Cabut hak akses';

    return (
        <>
            <Head title="Operasi platform" />

            <AppPage
                contextRail={
                    <div className="grid gap-4">
                        <p className="font-label text-label text-primary">
                            Ruang kendali platform
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                            Semua keputusan institusi dan organisasi perekrut
                            membutuhkan alasan dan tersimpan pada audit. Nomor,
                            payload provider, dan data mahasiswa tidak
                            diproyeksikan di sini.
                        </p>
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
                            Verifikasi organisasi perekrut dan penerbitan hak
                            akses Talent Portal kini dapat dikelola langsung
                            oleh admin platform.
                        </div>
                    </div>
                }
                contextRailLabel="Batas operasi admin platform"
            >
                <div
                    className="mx-auto w-full max-w-6xl space-y-8"
                    data-test="platform-operations-root"
                >
                    <header className="rounded-3xl border border-blue-100 bg-white px-5 py-7 shadow-[0_18px_50px_-32px_rgba(30,64,175,0.45)] sm:px-7 sm:py-8">
                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                            <ShieldCheck
                                aria-hidden="true"
                                className="size-4"
                            />
                            Operasi platform
                        </div>
                        <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">
                            Kendalikan operasi lintas institusi
                        </h1>
                        <p className="mt-4 max-w-[72ch] text-sm leading-6 text-slate-600 sm:text-base">
                            Selesaikan persetujuan institusi dan undangan admin
                            kampus. Pantau antrean dan pengiriman tanpa membuka
                            data privat.
                        </p>
                    </header>

                    <section
                        aria-label="Ringkasan operasi platform"
                        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                    >
                        <SummaryCard
                            icon={Landmark}
                            label="institusi menunggu persetujuan"
                            value={summary.pendingInstitutions}
                            className="bg-amber-50 text-amber-700"
                        />
                        <SummaryCard
                            icon={Send}
                            label="undangan masih aktif"
                            value={summary.openInvitations}
                            className="bg-blue-50 text-blue-700"
                        />
                        <SummaryCard
                            icon={UserRoundCog}
                            label="organisasi perekrut menunggu"
                            value={summary.pendingRecruiterOrganizations}
                            className="bg-emerald-50 text-emerald-700"
                        />
                        <SummaryCard
                            icon={FileWarning}
                            label="pesan provider gagal"
                            value={summary.failedMessages}
                            className="bg-rose-50 text-rose-700"
                        />
                    </section>

                    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="font-label text-label text-primary">
                                    Institusi
                                </p>
                                <h2 className="mt-2 text-xl font-bold tracking-[-0.02em] text-foreground">
                                    Persetujuan dan status institusi
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Setujui institusi yang siap, lalu terbitkan
                                    undangan admin kampus melalui WhatsApp.
                                </p>
                            </div>
                            <Badge variant="outline">
                                {institutions.length} institusi tampil
                            </Badge>
                        </div>

                        <form
                            className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]"
                            onSubmit={submitFilters}
                        >
                            <div>
                                <Label htmlFor="institution-query">
                                    Cari institusi
                                </Label>
                                <Input
                                    id="institution-query"
                                    className="mt-2"
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Nama atau slug institusi"
                                />
                            </div>
                            <div>
                                <Label htmlFor="institution-status">
                                    Status
                                </Label>
                                <Select
                                    value={status}
                                    onValueChange={(value) =>
                                        setStatus(
                                            value as 'all' | InstitutionStatus,
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="institution-status"
                                        className="mt-2 cursor-pointer"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua status
                                        </SelectItem>
                                        <SelectItem value="pending">
                                            Menunggu persetujuan
                                        </SelectItem>
                                        <SelectItem value="active">
                                            Aktif
                                        </SelectItem>
                                        <SelectItem value="suspended">
                                            Ditangguhkan
                                        </SelectItem>
                                        <SelectItem value="archived">
                                            Diarsipkan
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                type="submit"
                                variant="outline"
                                className="cursor-pointer self-end"
                            >
                                Terapkan filter
                            </Button>
                        </form>

                        {institutions.length === 0 ? (
                            <p className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                                Tidak ada institusi yang sesuai. Ubah kata kunci
                                atau status untuk melihat institusi lain.
                            </p>
                        ) : (
                            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                                {institutions.map((institution) => (
                                    <article
                                        key={institution.id}
                                        className="rounded-2xl border border-border bg-background p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="truncate font-semibold text-foreground">
                                                    {institution.name}
                                                </h3>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {institution.slug}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    institutionStatusMeta[
                                                        institution.status
                                                    ].className
                                                }
                                            >
                                                {
                                                    institutionStatusMeta[
                                                        institution.status
                                                    ].label
                                                }
                                            </Badge>
                                        </div>
                                        <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-border py-4 text-sm">
                                            <div>
                                                <dt className="text-muted-foreground">
                                                    Admin aktif
                                                </dt>
                                                <dd className="mt-1 font-semibold">
                                                    {
                                                        institution.verifiedCampusAdminsCount
                                                    }
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-muted-foreground">
                                                    Undangan aktif
                                                </dt>
                                                <dd className="mt-1 font-semibold">
                                                    {
                                                        institution.openInvitationsCount
                                                    }
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-muted-foreground">
                                                    Diperbarui
                                                </dt>
                                                <dd className="mt-1 text-xs font-medium">
                                                    {formatDate(
                                                        institution.updatedAt,
                                                    )}
                                                </dd>
                                            </div>
                                        </dl>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {institution.status ===
                                                'pending' && (
                                                <Button
                                                    type="button"
                                                    className="cursor-pointer"
                                                    onClick={() =>
                                                        setCommand({
                                                            kind: 'approve',
                                                            institution,
                                                        })
                                                    }
                                                >
                                                    <CheckCircle2 aria-hidden="true" />
                                                    Setujui
                                                </Button>
                                            )}
                                            {institution.status ===
                                                'active' && (
                                                <>
                                                    <Button
                                                        type="button"
                                                        className="cursor-pointer"
                                                        onClick={() =>
                                                            setCommand({
                                                                kind: 'invite',
                                                                institution,
                                                            })
                                                        }
                                                    >
                                                        <Send aria-hidden="true" />
                                                        Undang admin
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="cursor-pointer border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                                        onClick={() =>
                                                            setCommand({
                                                                kind: 'suspend',
                                                                institution,
                                                            })
                                                        }
                                                    >
                                                        <ShieldAlert aria-hidden="true" />
                                                        Tangguhkan
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                        <div className="flex items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                <MailWarning
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </span>
                            <div>
                                <p className="font-label text-label text-primary">
                                    Undangan Campus Admin
                                </p>
                                <h2 className="mt-2 text-xl font-bold tracking-[-0.02em] text-foreground">
                                    Undangan terbaru
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Nomor WhatsApp dimasking. Cabut undangan
                                    aktif jika penerima atau konteksnya berubah.
                                </p>
                            </div>
                        </div>

                        {invitations.length === 0 ? (
                            <p className="mt-6 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                                Belum ada undangan admin kampus.
                            </p>
                        ) : (
                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full min-w-[42rem] text-left text-sm">
                                    <thead className="border-b border-border text-xs text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-3 font-medium">
                                                Institusi
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                                Penerima
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                                Status
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                                Kedaluwarsa
                                            </th>
                                            <th className="px-3 py-3 font-medium">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invitations.map((invitation) => (
                                            <tr
                                                key={invitation.id}
                                                className="border-b border-border/70 last:border-0"
                                            >
                                                <td className="px-3 py-4 font-medium">
                                                    {invitation.institutionName}
                                                </td>
                                                <td className="px-3 py-4 text-muted-foreground">
                                                    {invitation.phoneMasked}
                                                </td>
                                                <td className="px-3 py-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            invitationStatusMeta[
                                                                invitation
                                                                    .status
                                                            ].className
                                                        }
                                                    >
                                                        {
                                                            invitationStatusMeta[
                                                                invitation
                                                                    .status
                                                            ].label
                                                        }
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-4 text-muted-foreground">
                                                    {formatDateTime(
                                                        invitation.expiresAt,
                                                    )}
                                                </td>
                                                <td className="px-3 py-4">
                                                    {invitation.canRevoke ? (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="cursor-pointer"
                                                            onClick={() =>
                                                                setCommand({
                                                                    kind: 'revoke',
                                                                    invitation,
                                                                })
                                                            }
                                                        >
                                                            Cabut
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            Tidak ada aksi
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="grid gap-6 xl:grid-cols-2">
                        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                            <div className="flex items-start gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                    <UserRoundCog
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                </span>
                                <div>
                                    <p className="font-label text-label text-primary">
                                        Recruiter Organization dan Entitlement
                                    </p>
                                    <h2 className="mt-2 text-xl font-bold tracking-[-0.02em] text-foreground">
                                        Kelola verifikasi dan hak akses
                                    </h2>
                                </div>
                            </div>
                            <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                                Organisasi perekrut terverifikasi dapat menerima
                                hak akses Talent Portal untuk mencari kandidat
                                mahasiswa.
                            </div>
                            <div className="mt-5 grid gap-3">
                                {recruiterOrganizations.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Belum ada organisasi perekrut untuk
                                        dipantau.
                                    </p>
                                ) : (
                                    recruiterOrganizations.map(
                                        (organization) => (
                                            <article
                                                key={organization.id}
                                                className="rounded-xl border border-border bg-background p-3"
                                            >
                                                <div className="flex justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="truncate font-semibold">
                                                            {organization.name}
                                                        </h3>
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            {organization.industry ??
                                                                'Industri belum dicatat'}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            recruiterStatusMeta[
                                                                organization
                                                                    .status
                                                            ].className
                                                        }
                                                    >
                                                        {
                                                            recruiterStatusMeta[
                                                                organization
                                                                    .status
                                                            ].label
                                                        }
                                                    </Badge>
                                                </div>
                                                <p className="mt-3 text-sm text-muted-foreground">
                                                    {
                                                        organization.activeMembershipsCount
                                                    }{' '}
                                                    membership aktif.{' '}
                                                    {
                                                        organization.activeEntitlementsCount
                                                    }{' '}
                                                    hak akses aktif.
                                                </p>

                                                {/* Active entitlements list if any */}
                                                {organization.activeEntitlements &&
                                                    organization
                                                        .activeEntitlements
                                                        .length > 0 && (
                                                        <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 p-2.5">
                                                            <p className="text-xs font-semibold text-foreground">
                                                                Hak Akses Aktif:
                                                            </p>
                                                            {organization.activeEntitlements.map(
                                                                (ent) => (
                                                                    <div
                                                                        key={
                                                                            ent.id
                                                                        }
                                                                        className="flex items-center justify-between gap-2 text-xs text-muted-foreground"
                                                                    >
                                                                        <span>
                                                                            {ent.scope ===
                                                                            'candidate_search'
                                                                                ? 'Pencarian Talenta'
                                                                                : ent.scope}
                                                                            {ent.endsAt &&
                                                                                ` (s.d. ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(ent.endsAt))})`}
                                                                        </span>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 cursor-pointer px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                                            onClick={() => {
                                                                                commandForm.setData(
                                                                                    {
                                                                                        phone: '',
                                                                                        reason: '',
                                                                                        conclusion:
                                                                                            '',
                                                                                        scope: 'candidate_search',
                                                                                        starts_at:
                                                                                            '',
                                                                                        ends_at:
                                                                                            '',
                                                                                    },
                                                                                );
                                                                                setCommand(
                                                                                    {
                                                                                        kind: 'revokeEntitlement',
                                                                                        entitlement:
                                                                                            ent,
                                                                                        organizationName:
                                                                                            organization.name,
                                                                                    },
                                                                                );
                                                                            }}
                                                                        >
                                                                            Cabut
                                                                        </Button>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}

                                                {/* Action buttons */}
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {organization.status ===
                                                        'pending' && (
                                                        <>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                className="cursor-pointer"
                                                                onClick={() => {
                                                                    commandForm.setData(
                                                                        {
                                                                            phone: '',
                                                                            reason: '',
                                                                            conclusion:
                                                                                'verified',
                                                                            scope: 'candidate_search',
                                                                            starts_at:
                                                                                '',
                                                                            ends_at:
                                                                                '',
                                                                        },
                                                                    );
                                                                    setCommand({
                                                                        kind: 'reviewRecruiter',
                                                                        organization,
                                                                        conclusion:
                                                                            'verified',
                                                                    });
                                                                }}
                                                            >
                                                                Verifikasi
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="cursor-pointer text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                                                onClick={() => {
                                                                    commandForm.setData(
                                                                        {
                                                                            phone: '',
                                                                            reason: '',
                                                                            conclusion:
                                                                                'rejected',
                                                                            scope: 'candidate_search',
                                                                            starts_at:
                                                                                '',
                                                                            ends_at:
                                                                                '',
                                                                        },
                                                                    );
                                                                    setCommand({
                                                                        kind: 'reviewRecruiter',
                                                                        organization,
                                                                        conclusion:
                                                                            'rejected',
                                                                    });
                                                                }}
                                                            >
                                                                Tolak
                                                            </Button>
                                                        </>
                                                    )}

                                                    {organization.status ===
                                                        'verified' && (
                                                        <>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                className="cursor-pointer"
                                                                onClick={() => {
                                                                    commandForm.setData(
                                                                        {
                                                                            phone: '',
                                                                            reason: '',
                                                                            conclusion:
                                                                                '',
                                                                            scope: 'candidate_search',
                                                                            starts_at:
                                                                                '',
                                                                            ends_at:
                                                                                '',
                                                                        },
                                                                    );
                                                                    setCommand({
                                                                        kind: 'grantEntitlement',
                                                                        organization,
                                                                    });
                                                                }}
                                                            >
                                                                Beri Hak Akses
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="cursor-pointer text-amber-700 hover:bg-amber-50"
                                                                onClick={() => {
                                                                    commandForm.setData(
                                                                        {
                                                                            phone: '',
                                                                            reason: '',
                                                                            conclusion:
                                                                                'suspended',
                                                                            scope: 'candidate_search',
                                                                            starts_at:
                                                                                '',
                                                                            ends_at:
                                                                                '',
                                                                        },
                                                                    );
                                                                    setCommand({
                                                                        kind: 'reviewRecruiter',
                                                                        organization,
                                                                        conclusion:
                                                                            'suspended',
                                                                    });
                                                                }}
                                                            >
                                                                Tangguhkan
                                                            </Button>
                                                        </>
                                                    )}

                                                    {organization.status ===
                                                        'suspended' && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            className="cursor-pointer"
                                                            onClick={() => {
                                                                commandForm.setData(
                                                                    {
                                                                        phone: '',
                                                                        reason: '',
                                                                        conclusion:
                                                                            'unsuspend',
                                                                        scope: 'candidate_search',
                                                                        starts_at:
                                                                            '',
                                                                        ends_at:
                                                                            '',
                                                                    },
                                                                );
                                                                setCommand({
                                                                    kind: 'reviewRecruiter',
                                                                    organization,
                                                                    conclusion:
                                                                        'unsuspend',
                                                                });
                                                            }}
                                                        >
                                                            Cabut Penangguhan
                                                        </Button>
                                                    )}
                                                </div>
                                            </article>
                                        ),
                                    )
                                )}
                            </div>
                        </section>

                        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                            <div className="flex items-start gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                                    <AlertTriangle
                                        aria-hidden="true"
                                        className="size-5"
                                    />
                                </span>
                                <div>
                                    <p className="font-label text-label text-primary">
                                        Provider Operations
                                    </p>
                                    <h2 className="mt-2 text-xl font-bold tracking-[-0.02em] text-foreground">
                                        Status pengiriman WhatsApp
                                    </h2>
                                </div>
                            </div>
                            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {(
                                    Object.keys(
                                        provider.totals,
                                    ) as MessageStatus[]
                                ).map((messageStatus) => (
                                    <div
                                        key={messageStatus}
                                        className="rounded-xl border border-border bg-background p-3"
                                    >
                                        <dt className="text-xs text-muted-foreground">
                                            {messageStatusLabels[messageStatus]}
                                        </dt>
                                        <dd className="mt-1 text-lg font-bold">
                                            {provider.totals[messageStatus]}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="mt-6 border-t border-border pt-4">
                                <h3 className="text-sm font-semibold">
                                    Kegagalan terbaru
                                </h3>
                                {provider.recentFailures.length === 0 ? (
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Tidak ada kegagalan pengiriman terbaru.
                                    </p>
                                ) : (
                                    <ul className="mt-3 grid gap-3">
                                        {provider.recentFailures.map(
                                            (failure) => (
                                                <li
                                                    key={failure.id}
                                                    className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-sm"
                                                >
                                                    <p className="font-semibold">
                                                        {failure.purpose}
                                                    </p>
                                                    <p className="mt-1 text-muted-foreground">
                                                        Percobaan{' '}
                                                        {failure.attempts} dari{' '}
                                                        {failure.maxAttempts}.
                                                        Diperbarui{' '}
                                                        {formatDateTime(
                                                            failure.updatedAt,
                                                        )}
                                                        .
                                                    </p>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                )}
                            </div>
                        </section>
                    </section>

                    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                        <div className="flex items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                <Clock3 aria-hidden="true" className="size-5" />
                            </span>
                            <div>
                                <p className="font-label text-label text-primary">
                                    Audit
                                </p>
                                <h2 className="mt-2 text-xl font-bold tracking-[-0.02em] text-foreground">
                                    Aktivitas lintas tenant terbaru
                                </h2>
                            </div>
                        </div>
                        {auditLogs.length === 0 ? (
                            <p className="mt-6 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                                Belum ada aktivitas audit yang dapat
                                ditampilkan.
                            </p>
                        ) : (
                            <ol className="mt-6 grid gap-4 md:grid-cols-2">
                                {auditLogs.map((auditLog) => (
                                    <li
                                        key={auditLog.id}
                                        className="border-l-2 border-blue-200 pl-4"
                                    >
                                        <p className="font-semibold">
                                            {operationLabel(auditLog.operation)}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {auditLog.actorName}
                                            {auditLog.institutionName !==
                                                null &&
                                                ' · ' +
                                                    auditLog.institutionName}
                                        </p>
                                        {auditLog.reason !== null && (
                                            <p className="mt-1 text-sm leading-5 text-muted-foreground">
                                                Alasan: {auditLog.reason}
                                            </p>
                                        )}
                                        <time className="mt-2 block text-xs text-muted-foreground">
                                            {formatDateTime(auditLog.createdAt)}
                                        </time>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </section>
                </div>
            </AppPage>

            <Dialog
                open={command !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeCommand();
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{commandTitle}</DialogTitle>
                        <DialogDescription>
                            {commandDescription}
                        </DialogDescription>
                    </DialogHeader>
                    <form className="grid gap-4" onSubmit={submitCommand}>
                        {command?.kind === 'invite' && (
                            <div className="grid gap-2">
                                <Label htmlFor="invitation-phone">
                                    Nomor WhatsApp
                                </Label>
                                <Input
                                    id="invitation-phone"
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    value={commandForm.data.phone}
                                    onChange={(event) =>
                                        commandForm.setData(
                                            'phone',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="+6281234567890"
                                    aria-invalid={Boolean(
                                        commandForm.errors.phone,
                                    )}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Gunakan format E.164, misalnya
                                    +6281234567890.
                                </p>
                                <InputError
                                    message={commandForm.errors.phone}
                                />
                            </div>
                        )}

                        {command?.kind === 'grantEntitlement' && (
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="entitlement-scope">
                                        Scope Hak Akses
                                    </Label>
                                    <select
                                        id="entitlement-scope"
                                        value={commandForm.data.scope}
                                        onChange={(event) =>
                                            commandForm.setData(
                                                'scope',
                                                event.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        <option value="candidate_search">
                                            Pencarian Talenta (candidate_search)
                                        </option>
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="entitlement-ends-at">
                                        Tanggal Berakhir (Opsional)
                                    </Label>
                                    <Input
                                        id="entitlement-ends-at"
                                        type="date"
                                        value={commandForm.data.ends_at}
                                        onChange={(event) =>
                                            commandForm.setData(
                                                'ends_at',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Kosongkan jika hak akses tidak memiliki
                                        batas waktu berakhir.
                                    </p>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="entitlement-reason">
                                        Catatan / Alasan (Opsional)
                                    </Label>
                                    <textarea
                                        id="entitlement-reason"
                                        value={commandForm.data.reason}
                                        onChange={(event) =>
                                            commandForm.setData(
                                                'reason',
                                                event.target.value,
                                            )
                                        }
                                        className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        maxLength={1000}
                                        placeholder="Kemitraan kampus resmi..."
                                    />
                                </div>
                            </div>
                        )}

                        {command?.kind !== 'invite' &&
                            command?.kind !== 'grantEntitlement' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="command-reason">
                                        Alasan keputusan
                                        {(command?.kind === 'suspend' ||
                                            command?.kind === 'revoke' ||
                                            command?.kind ===
                                                'revokeEntitlement' ||
                                            (command?.kind ===
                                                'reviewRecruiter' &&
                                                (command.conclusion ===
                                                    'rejected' ||
                                                    command.conclusion ===
                                                        'suspended'))) && (
                                            <span className="text-rose-500">
                                                {' '}
                                                *
                                            </span>
                                        )}
                                    </Label>
                                    <textarea
                                        id="command-reason"
                                        value={commandForm.data.reason}
                                        onChange={(event) =>
                                            commandForm.setData(
                                                'reason',
                                                event.target.value,
                                            )
                                        }
                                        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        aria-invalid={Boolean(
                                            commandForm.errors.reason,
                                        )}
                                        required={
                                            command?.kind === 'suspend' ||
                                            command?.kind === 'revoke' ||
                                            command?.kind ===
                                                'revokeEntitlement' ||
                                            (command?.kind ===
                                                'reviewRecruiter' &&
                                                (command.conclusion ===
                                                    'rejected' ||
                                                    command.conclusion ===
                                                        'suspended'))
                                        }
                                        minLength={
                                            command?.kind === 'suspend' ||
                                            command?.kind === 'revoke' ||
                                            command?.kind ===
                                                'revokeEntitlement' ||
                                            (command?.kind ===
                                                'reviewRecruiter' &&
                                                (command.conclusion ===
                                                    'rejected' ||
                                                    command.conclusion ===
                                                        'suspended'))
                                                ? 3
                                                : 0
                                        }
                                        maxLength={1000}
                                    />
                                    <InputError
                                        message={commandForm.errors.reason}
                                    />
                                    <InputError
                                        message={
                                            (
                                                commandForm.errors as Record<
                                                    string,
                                                    string | undefined
                                                >
                                            ).institution
                                        }
                                    />
                                </div>
                            )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer"
                                onClick={closeCommand}
                                disabled={commandForm.processing}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                className="cursor-pointer"
                                variant={
                                    command?.kind === 'suspend' ||
                                    command?.kind === 'revoke' ||
                                    command?.kind === 'revokeEntitlement' ||
                                    (command?.kind === 'reviewRecruiter' &&
                                        (command.conclusion === 'rejected' ||
                                            command.conclusion === 'suspended'))
                                        ? 'destructive'
                                        : 'default'
                                }
                                disabled={commandForm.processing}
                            >
                                {commandForm.processing && (
                                    <Spinner aria-hidden="true" />
                                )}
                                {commandButtonLabel}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
