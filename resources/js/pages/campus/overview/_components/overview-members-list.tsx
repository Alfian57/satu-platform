import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { OverviewMembersTable } from '@/pages/campus/overview/_components/overview-members-table';
import { OverviewMembershipStatus } from '@/pages/campus/overview/_components/overview-membership-status';
import {
    formatDate,
    numberFormatter,
    roleLabel,
} from '@/pages/campus/overview/_types/overview-types';
import type { CampusOverviewProps } from '@/pages/campus/overview/_types/overview-types';
import { DashboardArchiveArt } from '@/pages/dashboard/_components/dashboard-archive-art';

interface OverviewMembersListProps {
    members: CampusOverviewProps['members'];
    isPending: boolean;
    onPageChange: (page: number) => void;
}

export function OverviewMembersList({
    members,
    isPending,
    onPageChange,
}: OverviewMembersListProps) {
    const pagination = members.pagination;

    return (
        <section
            className="min-w-0 space-y-4"
            aria-labelledby="campus-members-heading"
        >
            <div className="flex flex-wrap items-start justify-between gap-3 px-1">
                <div>
                    <h2
                        id="campus-members-heading"
                        className="text-xl font-bold tracking-tight sm:text-2xl"
                    >
                        Anggota kampus
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Mahasiswa dan operator sesuai filter yang diterapkan.
                    </p>
                </div>
                <span className="rounded-full border border-primary/15 bg-accent px-3 py-1 text-xs leading-5 font-semibold text-primary">
                    {numberFormatter.format(pagination.total)} anggota
                </span>
            </div>
            <div
                className="@container min-w-0 rounded-3xl border border-border bg-white shadow-sm"
                aria-busy={isPending}
            >
                {members.items.length === 0 ? (
                    isPending ? (
                        <div
                            aria-hidden="true"
                            className="space-y-4 p-5 sm:p-6"
                        >
                            {[1, 2, 3].map((key) => (
                                <div
                                    key={key}
                                    className="space-y-3 border-b border-border pb-4 last:border-0"
                                >
                                    <Skeleton className="h-5 w-32 motion-reduce:animate-none" />
                                    <Skeleton className="h-5 w-3/4 motion-reduce:animate-none" />
                                    <Skeleton className="h-6 w-36 rounded-full motion-reduce:animate-none" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="px-5 py-10 text-center">
                            <DashboardArchiveArt className="mx-auto size-24" />
                            <h3 className="mt-4 text-xl font-semibold">
                                Belum ada anggota pada hasil ini
                            </h3>
                            <p className="mx-auto mt-3 max-w-prose text-sm leading-6 text-muted-foreground">
                                Periksa periode dan nama program studi, atau
                                atur ulang filter untuk melihat cakupan yang
                                lebih luas.
                            </p>
                        </div>
                    )
                ) : (
                    <>
                        <OverviewMembersTable items={members.items} />
                        <ul
                            aria-label="Anggota kampus"
                            className="divide-y divide-border @min-[36rem]:hidden"
                        >
                            {members.items.map((member) => (
                                <li key={member.id} className="p-4">
                                    <p className="font-label text-xs font-semibold">
                                        ANGGOTA-{member.id}
                                    </p>
                                    <dl className="mt-3 grid gap-x-4 gap-y-2 @min-[22rem]:grid-cols-2">
                                        <div>
                                            <dt className="text-xs text-muted-foreground">
                                                Program studi
                                            </dt>
                                            <dd className="mt-1 text-sm leading-6 break-words">
                                                {member.program ||
                                                    'Belum tersedia'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-muted-foreground">
                                                Peran
                                            </dt>
                                            <dd className="mt-1 text-sm">
                                                {roleLabel(member.role)}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-muted-foreground">
                                                Status afiliasi
                                            </dt>
                                            <dd className="mt-2">
                                                <OverviewMembershipStatus
                                                    status={member.status}
                                                />
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-muted-foreground">
                                                Tercatat
                                            </dt>
                                            <dd className="mt-1 text-sm">
                                                {formatDate(member.createdAt)}
                                            </dd>
                                        </div>
                                    </dl>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
                <div className="border-t border-border px-4 py-3 text-xs leading-5 text-muted-foreground">
                    Referensi mengidentifikasi catatan keanggotaan. Username
                    privat tidak ditampilkan di ringkasan.
                </div>
            </div>
            {(pagination.last_page > 1 || pagination.current_page > 1) && (
                <nav
                    aria-label="Halaman anggota kampus"
                    className="flex flex-wrap items-center justify-between gap-3 px-1"
                >
                    <p className="text-xs leading-5 text-muted-foreground">
                        Halaman {pagination.current_page} dari{' '}
                        {pagination.last_page}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11"
                            disabled={isPending || pagination.current_page <= 1}
                            onClick={() =>
                                onPageChange(pagination.current_page - 1)
                            }
                        >
                            <ChevronLeft
                                aria-hidden="true"
                                className="size-4"
                            />
                            Sebelumnya
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11"
                            disabled={
                                isPending ||
                                pagination.current_page >= pagination.last_page
                            }
                            onClick={() =>
                                onPageChange(pagination.current_page + 1)
                            }
                        >
                            Berikutnya
                            <ChevronRight
                                aria-hidden="true"
                                className="size-4"
                            />
                        </Button>
                    </div>
                </nav>
            )}
        </section>
    );
}
