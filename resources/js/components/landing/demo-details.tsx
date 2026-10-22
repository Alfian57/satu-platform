import { ArrowRight, BookOpen, Link2 } from 'lucide-react';
import { DEMO_ICONS } from '@/components/landing-collaboration-map';
import {
    DEMO_KIND_LABELS,
    getDemoNode,
    getDemoRelations,
} from '@/lib/landing-demo';
import type { DemoNode } from '@/lib/landing-demo';

const reverseRelations: Record<string, string> = {
    'project-team': 'Proyek yang dikerjakan',
    'team-contribution': 'Konteks pekerjaan',
    'contribution-validation': 'Kontribusi yang ditinjau',
    'validation-portfolio': 'Dasar karya',
    'siti-team': 'Anggota tim',
    'budi-team': 'Anggota tim',
    'budi-contribution': 'Dikerjakan oleh',
};

interface DemoDetailsProps {
    node: DemoNode | undefined;
    onSelect: (id: string) => void;
}

export default function DemoDetails({ node, onSelect }: DemoDetailsProps) {
    const Icon = node ? DEMO_ICONS[node.kind] : BookOpen;
    const relations = node ? getDemoRelations(node.id) : [];

    return (
        <section
            id="demo-node-detail"
            tabIndex={-1}
            aria-labelledby="demo-detail-heading"
            className="collaboration-detail"
            data-testid="landing-demo-detail"
        >
            <div className="collaboration-detail-heading">
                <span className="collaboration-detail-icon" aria-hidden="true">
                    <Icon className="size-6" />
                </span>
                <div>
                    <p className="text-xs font-semibold text-satu-blue-hover">
                        {node
                            ? `Rincian arsip / ${DEMO_KIND_LABELS[node.kind]}`
                            : 'Mulai dari satu arsip'}
                    </p>
                    <h3
                        id="demo-detail-heading"
                        className="mt-1 text-2xl leading-tight font-bold tracking-[-0.025em]"
                    >
                        {node
                            ? node.label
                            : 'Kenali hubungan di balik sebuah karya.'}
                    </h3>
                </div>
                <span className="collaboration-synthetic-label">
                    Data synthetic
                </span>
            </div>
            {node ? (
                <div
                    key={node.id}
                    className="landing-panel-enter grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-10"
                >
                    <div className="min-w-0">
                        <p className="text-base leading-7 text-satu-muted">
                            {node.description}
                        </p>
                        <dl className="mt-5 grid gap-4 border-t border-satu-border-soft pt-5 sm:grid-cols-2">
                            {node.facts.map(([label, value]) => (
                                <div key={label}>
                                    <dt className="text-xs text-satu-muted">
                                        {label}
                                    </dt>
                                    <dd className="mt-1 text-sm leading-6 font-semibold text-satu-ink">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <div className="mt-5 rounded-2xl border border-satu-border-soft bg-white p-4">
                            <p className="flex items-center gap-2 text-sm font-semibold text-satu-blue-hover">
                                <ArrowRight
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                Langkah berikutnya
                            </p>
                            <p className="mt-2 text-sm leading-6 text-satu-muted">
                                {node.next}
                            </p>
                        </div>
                    </div>
                    <div className="min-w-0">
                        <h4 className="flex items-center gap-2 text-sm font-bold">
                            <Link2
                                aria-hidden="true"
                                className="size-4 text-satu-blue"
                            />
                            Hubungan terdekat
                        </h4>
                        <ul className="mt-3 divide-y divide-satu-border-soft">
                            {relations.map((edge) => {
                                const related = getDemoNode(
                                    edge.source === node.id
                                        ? edge.target
                                        : edge.source,
                                )!;
                                const RelatedIcon = DEMO_ICONS[related.kind];

                                return (
                                    <li key={edge.id} className="py-3">
                                        <p className="mb-2 text-xs leading-5 text-satu-muted">
                                            {edge.source === node.id
                                                ? edge.label
                                                : reverseRelations[edge.id]}
                                        </p>
                                        <button
                                            type="button"
                                            className="collaboration-relation-button cursor-pointer"
                                            onClick={() => onSelect(related.id)}
                                        >
                                            <RelatedIcon
                                                aria-hidden="true"
                                                className="size-4 shrink-0"
                                            />
                                            <span>{related.label}</span>
                                            <ArrowRight
                                                aria-hidden="true"
                                                className="ml-auto size-4 shrink-0"
                                            />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <p className="max-w-2xl text-base leading-7 text-satu-muted">
                        Pilih lembar proyek, anggota tim, atau kontribusi untuk
                        membaca konteksnya. Garis menampilkan hubungan, bukan
                        peringkat atau ukuran nilai seseorang.
                    </p>
                    <button
                        type="button"
                        className="landing-control cursor-pointer"
                        onClick={() => onSelect('project')}
                    >
                        Mulai dari proyek
                        <ArrowRight aria-hidden="true" className="size-4" />
                    </button>
                </div>
            )}
        </section>
    );
}
