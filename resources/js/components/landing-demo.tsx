import { Component, Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DEMO_KIND_LABELS,
    DEMO_NODES,
    getDemoNode,
    getDemoRelations,
} from '@/lib/landing-demo';
import type { DemoNode } from '@/lib/landing-demo';

function ArchiveSkeleton({ node }: { node: DemoNode }) {
    return (
        <div
            className={`collaboration-node ${node.kind === 'student' ? 'collaboration-node--member' : ''}`}
        >
            <div className="collaboration-node-button">
                <Skeleton className="collaboration-node-icon bg-[#E7F2FF]" />
                <span className="collaboration-node-kind rounded bg-[#E7F2FF] text-transparent">
                    {DEMO_KIND_LABELS[node.kind]}
                </span>
                <span className="collaboration-node-title rounded bg-[#E7F2FF] text-transparent">
                    {node.label}
                </span>
                <span className="collaboration-node-caption rounded bg-[#E7F2FF] text-transparent">
                    {node.caption}
                </span>
                <span className="collaboration-node-status text-transparent">
                    Arsip contoh
                </span>
            </div>
            <span className="collaboration-node-footnote">
                <Skeleton className="h-4 w-24 bg-[#E7F2FF]" />
            </span>
        </div>
    );
}

export function LandingDemoFallback() {
    const main = DEMO_NODES.filter((node) => node.kind !== 'student');
    const members = DEMO_NODES.filter((node) => node.kind === 'student');
    const initialNode = getDemoNode('contribution')!;

    return (
        <div className="collaboration-demo" aria-busy="true" role="status">
            <div aria-hidden="true">
                <div className="collaboration-toolbar">
                    <div className="flex items-start gap-3">
                        <Skeleton className="size-12 shrink-0 rounded-2xl bg-[#E7F2FF]" />
                        <div>
                            <p className="font-label text-xs text-[#526B85]">
                                ARSIP DEMO / 001
                            </p>
                            <h3 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                                Peta kolaborasi
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-[#526B85]">
                                Perjalanan kontribusi Budi.
                            </p>
                        </div>
                    </div>
                    <span className="collaboration-synthetic-label">
                        Data synthetic
                    </span>
                </div>
                <div className="collaboration-controls">
                    <Skeleton className="h-14 w-80 max-w-full bg-[#E7F2FF]" />
                    <Skeleton className="h-14 w-72 max-w-full bg-[#E7F2FF]" />
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
                        <Skeleton className="collaboration-detail-icon bg-[#E7F2FF]" />
                        <div>
                            <p className="rounded bg-[#E7F2FF] text-xs font-semibold text-transparent">
                                Rincian arsip / Kontribusi
                            </p>
                            <h3 className="mt-1 rounded bg-[#E7F2FF] text-2xl leading-tight font-bold tracking-[-0.025em] text-transparent">
                                {initialNode.label}
                            </h3>
                        </div>
                        <span className="collaboration-synthetic-label">
                            Data synthetic
                        </span>
                    </div>
                    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-10">
                        <div className="min-w-0">
                            <p className="rounded bg-[#E7F2FF] text-base leading-7 text-transparent">
                                {initialNode.description}
                            </p>
                            <div className="mt-5 grid gap-4 border-t border-[#D9E8F5] pt-5 sm:grid-cols-2">
                                {initialNode.facts.map(([label, value]) => (
                                    <div key={label}>
                                        <p className="rounded bg-[#E7F2FF] text-xs text-transparent">
                                            {label}
                                        </p>
                                        <p className="mt-1 rounded bg-[#E7F2FF] text-sm leading-6 font-semibold text-transparent">
                                            {value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 rounded-2xl border border-[#D9E8F5] bg-white p-4">
                                <Skeleton className="h-5 w-40 max-w-full bg-[#E7F2FF]" />
                                <p className="mt-2 rounded bg-[#E7F2FF] text-sm leading-6 text-transparent">
                                    {initialNode.next}
                                </p>
                            </div>
                        </div>
                        <div className="min-w-0">
                            <Skeleton className="h-5 w-40 max-w-full bg-[#E7F2FF]" />
                            <div className="mt-3 divide-y divide-[#D9E8F5]">
                                {getDemoRelations(initialNode.id).map(
                                    (edge) => {
                                        const related = getDemoNode(
                                            edge.source === initialNode.id
                                                ? edge.target
                                                : edge.source,
                                        )!;

                                        return (
                                            <div key={edge.id} className="py-3">
                                                <Skeleton className="mb-2 h-5 w-28 max-w-full bg-[#E7F2FF]" />
                                                <div className="flex min-h-11 items-center gap-2 rounded-xl border border-[#BFD7EC] px-3 py-2.5 text-sm font-semibold">
                                                    <Skeleton className="size-4 shrink-0 bg-[#E7F2FF]" />
                                                    <span className="rounded bg-[#E7F2FF] text-transparent">
                                                        {related.label}
                                                    </span>
                                                    <Skeleton className="ml-auto size-4 shrink-0 bg-[#E7F2FF]" />
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

export default class LandingDemo extends Component {
    state = { hasError: false };
    private DemoGraph = lazy(() => import('@/components/LandingDemoGraph'));

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    role="alert"
                    className="rounded-3xl border border-[#D9E8F5] bg-[#F3F9FF] p-8 text-center"
                >
                    <h3 className="text-xl font-bold">
                        Demo belum dapat dimuat.
                    </h3>
                    <p className="mx-auto mt-3 max-w-md text-base leading-7 text-[#526B85]">
                        Muat ulang halaman untuk mencoba lagi. Penjelasan alur
                        dan tombol mulai tetap dapat digunakan.
                    </p>
                    <button
                        type="button"
                        className="landing-control mt-5"
                        onClick={() => window.location.reload()}
                    >
                        Muat ulang halaman
                    </button>
                </div>
            );
        }

        const DemoGraph = this.DemoGraph;

        return (
            <Suspense fallback={<LandingDemoFallback />}>
                <DemoGraph />
            </Suspense>
        );
    }
}
