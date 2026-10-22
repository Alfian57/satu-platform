import { GraduationCap, UserRound, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
    LeaderboardPageData,
    LeaderboardScope,
} from '@/types/leaderboard';

const categoryIcons = {
    program: GraduationCap,
    team: Users,
    individual: UserRound,
};

const categoryDescriptions = {
    program: 'Rata-rata XP per anggota aktif',
    team: 'Rata-rata XP dalam tim proyek',
    individual: 'Total XP, dengan persetujuan',
};

export interface LeaderboardFilterBarProps {
    semesters: LeaderboardPageData['semesters'];
    selectedSemester: string;
    scopes: LeaderboardPageData['scopes'];
    selectedScope: LeaderboardScope;
    busy: boolean;
    onSelectSemester: (semester: string) => void;
    onSelectScope: (scope: LeaderboardScope) => void;
}

export function LeaderboardFilterBar({
    semesters,
    selectedSemester,
    scopes,
    selectedScope,
    busy,
    onSelectSemester,
    onSelectScope,
}: LeaderboardFilterBarProps) {
    return (
        <section
            aria-labelledby="leaderboard-controls-title"
            className="grid min-w-0 gap-5 rounded-3xl border border-primary/20 bg-card p-5 shadow-md sm:p-6"
        >
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold text-primary">
                        Pilihan tampilan
                    </p>
                    <h2
                        id="leaderboard-controls-title"
                        className="mt-1 text-xl leading-snug font-bold tracking-tight text-foreground sm:text-2xl"
                    >
                        Tentukan semester dan kategori
                    </h2>
                </div>
                <div className="grid min-w-0 gap-1.5 sm:min-w-64">
                    <label
                        htmlFor="leaderboard-semester-select"
                        className="text-xs font-medium text-muted-foreground"
                    >
                        Semester akademik
                    </label>
                    <select
                        id="leaderboard-semester-select"
                        className="h-11 min-w-0 cursor-pointer rounded-xl border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedSemester}
                        disabled={busy}
                        onChange={(event) =>
                            onSelectSemester(event.target.value)
                        }
                        data-test="leaderboard-semester-select"
                    >
                        {semesters.map((semester) => (
                            <option key={semester.value} value={semester.value}>
                                {semester.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid min-w-0 gap-3 border-t border-border pt-4 sm:grid-cols-3">
                {scopes.map((scope) => {
                    const Icon = categoryIcons[scope.value];
                    const active = scope.value === selectedScope;

                    return (
                        <button
                            key={scope.value}
                            type="button"
                            disabled={busy}
                            onClick={() => onSelectScope(scope.value)}
                            data-test={`leaderboard-scope-${scope.value}`}
                            className={cn(
                                'grid min-w-0 cursor-pointer gap-2 rounded-2xl border p-4 text-left transition-[border-color,background-color] duration-fast ease-ledger disabled:cursor-not-allowed disabled:opacity-50',
                                active
                                    ? 'border-primary/40 bg-accent text-primary shadow-xs'
                                    : 'border-border bg-card text-foreground hover:border-primary/20 hover:bg-muted/40',
                            )}
                        >
                            <div className="flex items-center gap-2 font-semibold">
                                <Icon aria-hidden="true" className="size-4" />
                                {scope.label}
                            </div>
                            <p className="text-xs leading-5 text-muted-foreground">
                                {categoryDescriptions[scope.value]}
                            </p>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
