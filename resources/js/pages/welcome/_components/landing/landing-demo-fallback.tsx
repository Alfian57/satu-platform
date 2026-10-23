import { Skeleton } from '@/components/ui/skeleton';
import ArchiveSkeleton from '@/pages/welcome/_components/landing/archive-skeleton';
import {
    DEMO_NODES,
    getDemoNode,
    getDemoRelations,
} from '@/pages/welcome/_utils/landing-demo';

export default function LandingDemoFallback() {
    const main = DEMO_NODES.filter((node) => node.kind !== 'student');
    const members = DEMO_NODES.filter((node) => node.kind === 'student');
    const initialNode = getDemoNode('contribution')!;

    return (
        <div className="collaboration-demo" aria-busy="true" role="status">
            <div aria-hidden="true">
                <div className="collaboration-toolbar">
                    <div className="flex items-start gap-3">
                        <Skeleton className="size-12 shrink-0 rounded-2xl bg-satu-blue-soft" />
                        <div>
                            <p className="font-label text-xs text-satu-muted">
                                ARSIP DEMO / 001
                            </p>
                            <h3 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                                Peta kolaborasi
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-satu-muted">
                                Perjalanan kontribusi Budi.
                            </p>
                        </div>
                    </div>
                    <span className="collaboration-synthetic-label">
                        Data synthetic
                    </span>
                </div>
                <div className="collaboration-controls">
                    <Skeleton className="h-14 w-80 max-w-full bg-satu-blue-soft" />
                    <Skeleton className="h-14 w-72 max-w-full bg-satu-blue-soft" />
                </div>
                <p className="collaboration-map-description">
                    Pilih arsip untuk membaca rincian. Gulir peta untuk
                    mengikuti alur.
                </p>
                <div className="collaboration-map-container">
                    <div className="collaboration-board">
                        <div className="collaboration-map-grid">
                            {main.map((node, index) => (
                                <div
                                    key={node.id}
                                    className={`collaboration-main-node collaboration-main-node--${index + 1}`}
                                >
                                    <ArchiveSkeleton node={node} />
                                    {node.kind === 'team' && (
                                        <div className="collaboration-members">
                                            {members.map((member) => (
                                                <ArchiveSkeleton
                                                    key={member.id}
                                                    node={member}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="collaboration-detail">
                    <div className="collaboration-detail-heading">
                        <Skeleton className="collaboration-detail-icon bg-satu-blue-soft" />
                        <div>
                            <p className="rounded bg-satu-blue-soft text-xs font-semibold text-transparent">
                                Rincian arsip / Kontribusi
                            </p>
                            <h3 className="mt-1 rounded bg-satu-blue-soft text-2xl leading-tight font-bold tracking-[-0.025em] text-transparent">
                                {initialNode.label}
                            </h3>
                        </div>
                        <span className="collaboration-synthetic-label">
                            Data synthetic
                        </span>
                    </div>
                    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-10">
                        <div className="min-w-0">
                            <p className="rounded bg-satu-blue-soft text-base leading-7 text-transparent">
                                {initialNode.description}
                            </p>
                            <div className="mt-5 grid gap-4 border-t border-satu-border-soft pt-5 sm:grid-cols-2">
                                {initialNode.facts.map(([label, value]) => (
                                    <div key={label}>
                                        <p className="rounded bg-satu-blue-soft text-xs text-transparent">
                                            {label}
                                        </p>
                                        <p className="mt-1 rounded bg-satu-blue-soft text-sm leading-6 font-semibold text-transparent">
                                            {value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 rounded-2xl border border-satu-border-soft bg-white p-4">
                                <Skeleton className="h-5 w-40 max-w-full bg-satu-blue-soft" />
                                <p className="mt-2 rounded bg-satu-blue-soft text-sm leading-6 text-transparent">
                                    {initialNode.next}
                                </p>
                            </div>
                        </div>
                        <div className="min-w-0">
                            <Skeleton className="h-5 w-40 max-w-full bg-satu-blue-soft" />
                            <div className="mt-3 divide-y divide-satu-border-soft">
                                {getDemoRelations(initialNode.id).map(
                                    (edge) => {
                                        const related = getDemoNode(
                                            edge.source === initialNode.id
                                                ? edge.target
                                                : edge.source,
                                        )!;

                                        return (
                                            <div key={edge.id} className="py-3">
                                                <Skeleton className="mb-2 h-5 w-28 max-w-full bg-satu-blue-soft" />
                                                <div className="flex min-h-11 items-center gap-2 rounded-xl border border-satu-border-contrast px-3 py-2.5 text-sm font-semibold">
                                                    <Skeleton className="size-4 shrink-0 bg-satu-blue-soft" />
                                                    <span className="rounded bg-satu-blue-soft text-transparent">
                                                        {related.label}
                                                    </span>
                                                    <Skeleton className="ml-auto size-4 shrink-0 bg-satu-blue-soft" />
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <p className="collaboration-demo-note">
                    Contoh alur, bukan progres akun. Validasi tidak otomatis
                    memublikasikan portofolio.
                </p>
            </div>
            <span className="sr-only">Menyiapkan demo kolaborasi.</span>
        </div>
    );
}
