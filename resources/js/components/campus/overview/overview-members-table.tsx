import { OverviewMembershipStatus } from '@/components/campus/overview/overview-membership-status';
import {
    formatDate,
    roleLabel,
} from '@/components/campus/overview/overview-types';
import type { MemberItem } from '@/components/campus/overview/overview-types';

export function OverviewMembersTable({ items }: { items: MemberItem[] }) {
    return (
        <div className="hidden @min-[36rem]:block">
            <table className="w-full table-fixed text-left text-sm">
                <caption className="sr-only">
                    Daftar keanggotaan kampus. Referensi keanggotaan, program
                    studi, peran, dan status afiliasi.
                </caption>
                <thead className="border-b border-border bg-accent/35 text-xs text-muted-foreground">
                    <tr>
                        <th
                            scope="col"
                            className="w-[24%] rounded-tl-3xl px-4 py-3 font-semibold"
                        >
                            Keanggotaan
                        </th>
                        <th
                            scope="col"
                            className="w-[28%] px-4 py-3 font-semibold"
                        >
                            Program studi
                        </th>
                        <th
                            scope="col"
                            className="w-[20%] px-4 py-3 font-semibold"
                        >
                            Peran
                        </th>
                        <th
                            scope="col"
                            className="w-[28%] rounded-tr-3xl px-4 py-3 font-semibold"
                        >
                            Status afiliasi
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {items.map((member) => (
                        <tr key={member.id}>
                            <th
                                scope="row"
                                className="px-4 py-3 align-top font-normal"
                            >
                                <span className="font-label text-xs font-semibold break-words">
                                    ANGGOTA-{member.id}
                                </span>
                                <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                                    Tercatat {formatDate(member.createdAt)}
                                </span>
                            </th>
                            <td className="px-4 py-3 align-top leading-6 break-words">
                                {member.program || 'Belum tersedia'}
                            </td>
                            <td className="px-4 py-3 align-top leading-6">
                                {roleLabel(member.role)}
                            </td>
                            <td className="px-4 py-3 align-top">
                                <OverviewMembershipStatus
                                    status={member.status}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
