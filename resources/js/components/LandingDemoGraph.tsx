import {
    ArrowRight,
    BookOpen,
    Check,
    FileText,
    Layers3,
    Link2,
    List,
    Map,
    RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import LandingCollaborationMap, {
    DEMO_ICONS,
} from '@/components/landing-collaboration-map';
import {
    DEMO_KIND_LABELS,
    DEMO_NODES,
    getDemoNode,
    getDemoRelations,
} from '@/lib/landing-demo';
import type { DemoKind, DemoNode } from '@/lib/landing-demo';
import { cn } from '@/lib/utils';

type DemoView = 'map' | 'list';
const views = [
    { key: 'map', label: 'Peta kolaborasi', icon: Map },
    { key: 'list', label: 'Daftar hubungan', icon: List },
] as const;

const reverseRelations: Record<string, string> = {
    'project-team': 'Proyek yang dikerjakan',
    'team-contribution': 'Konteks pekerjaan',
    'contribution-validation': 'Kontribusi yang ditinjau',
    'validation-portfolio': 'Dasar karya',
    'siti-team': 'Anggota tim',
    'budi-team': 'Anggota tim',
    'budi-contribution': 'Dikerjakan oleh',
};

function RelationText({ id }: { id: string }) {
    return (
        <ul className="space-y-2">
            {getDemoRelations(id).map((edge) => (
                <li key={edge.id} className="text-sm leading-6 text-[#526B85]">
                    <span className="font-semibold text-[#17345A]">
                        {getDemoNode(edge.source)?.label}
                    </span>{' '}
                    {edge.label}{' '}
                    <span className="font-semibold text-[#17345A]">
                        {getDemoNode(edge.target)?.label}
                    </span>
                    .
                </li>
            ))}
        </ul>
    );
}

function DemoDetails({
    node,
    onSelect,
}: {
    node: DemoNode | undefined;
    onSelect: (id: string) => void;
}) {
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
                    <p className="text-xs font-semibold text-[#1454C4]">
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
                        <p className="text-base leading-7 text-[#526B85]">
                            {node.description}
                        </p>
                        <dl className="mt-5 grid gap-4 border-t border-[#D9E8F5] pt-5 sm:grid-cols-2">
                            {node.facts.map(([label, value]) => (
                                <div key={label}>
                                    <dt className="text-xs text-[#526B85]">
                                        {label}
                                    </dt>
                                    <dd className="mt-1 text-sm leading-6 font-semibold text-[#17345A]">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <div className="mt-5 rounded-2xl border border-[#D9E8F5] bg-white p-4">
                            <p className="flex items-center gap-2 text-sm font-semibold text-[#1454C4]">
                                <ArrowRight
                                    aria-hidden="true"
                                    className="size-4"
                                />
                                Langkah berikutnya
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[#526B85]">
                                {node.next}
                            </p>
                        </div>
                    </div>
                    <div className="min-w-0">
                        <h4 className="flex items-center gap-2 text-sm font-bold">
                            <Link2
                                aria-hidden="true"
                                className="size-4 text-[#1764E8]"
                            />
                            Hubungan terdekat
                        </h4>
                        <ul className="mt-3 divide-y divide-[#D9E8F5]">
                            {relations.map((edge) => {
                                const related = getDemoNode(
                                    edge.source === node.id
                                        ? edge.target
                                        : edge.source,
                                )!;
                                const RelatedIcon = DEMO_ICONS[related.kind];

                                return (
                                    <li key={edge.id} className="py-3">
                                        <p className="mb-2 text-xs leading-5 text-[#526B85]">
                                            {edge.source === node.id
                                                ? edge.label
                                                : reverseRelations[edge.id]}
                                        </p>
                                        <button
                                            type="button"
                                            className="collaboration-relation-button"
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
                    <p className="max-w-2xl text-base leading-7 text-[#526B85]">
                        Pilih lembar proyek, anggota tim, atau kontribusi untuk
                        membaca konteksnya. Garis menampilkan hubungan, bukan
                        peringkat atau ukuran nilai seseorang.
                    </p>
                    <button
                        type="button"
                        className="landing-control"
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

export default function LandingDemoGraph() {
    const [view, setView] = useState<DemoView>('map');
    const [focusedKind, setFocusedKind] = useState<DemoKind | 'all'>('all');
    const [selectedId, setSelectedId] = useState<string | null>('contribution');
    const [resetCount, setResetCount] = useState(0);
    const selectedNode = selectedId ? getDemoNode(selectedId) : undefined;
    const displayedNodes = DEMO_NODES.filter(
        (node) => focusedKind === 'all' || node.kind === focusedKind,
    );

    function selectNode(id: string) {
        const node = getDemoNode(id);

        if (!node) {
            return;
        }

        setSelectedId(id);

        if (focusedKind !== 'all' && node.kind !== focusedKind) {
            setFocusedKind(node.kind);
        }
    }

    function changeFocus(kind: DemoKind | 'all') {
        setFocusedKind(kind);

        if (kind !== 'all') {
            setSelectedId(
                DEMO_NODES.find((node) => node.kind === kind)?.id ?? null,
            );
        }
    }

    function moveView(event: KeyboardEvent<HTMLButtonElement>, index: number) {
        let next: number;

        if (
            ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(
                event.key,
            )
        ) {
            next = (index + 1) % views.length;
        } else if (event.key === 'Home') {
            next = 0;
        } else if (event.key === 'End') {
            next = views.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        setView(views[next].key);
        event.currentTarget
            .closest('[role="tablist"]')
            ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
            .item(next)
            ?.focus();
    }

    return (
        <section
            className="collaboration-demo"
            data-testid="landing-demo-graph"
            aria-labelledby="graph-heading"
        >
            <div className="collaboration-toolbar">
                <div className="flex items-start gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#BFD7EC] bg-white text-[#1764E8] shadow-sm">
                        <Layers3 aria-hidden="true" className="size-6" />
                    </span>
                    <div>
                        <p className="font-label text-xs text-[#526B85]">
                            ARSIP DEMO / 001
                        </p>
                        <h3
                            id="graph-heading"
                            className="mt-1 text-xl font-bold tracking-tight sm:text-2xl"
                        >
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
                <div
                    role="tablist"
                    aria-label="Tampilan demo kolaborasi"
                    className="collaboration-view-tabs"
                >
                    {views.map((item, index) => {
                        const Icon = item.icon;
                        const active = view === item.key;

                        return (
                            <button
                                key={item.key}
                                id={`demo-view-tab-${item.key}`}
                                role="tab"
                                type="button"
                                aria-selected={active}
                                aria-controls="demo-view-panel"
                                tabIndex={active ? 0 : -1}
                                className={cn(
                                    'collaboration-view-tab',
                                    active && 'collaboration-view-tab--active',
                                )}
                                onClick={() => setView(item.key)}
                                onKeyDown={(event) => moveView(event, index)}
                            >
                                <Icon aria-hidden="true" className="size-4" />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
                <div className="collaboration-filter-controls">
                    <label
                        htmlFor="landing-graph-filter"
                        className="text-xs font-semibold text-[#526B85]"
                    >
                        Fokus tahap
                    </label>
                    <select
                        id="landing-graph-filter"
                        className="collaboration-filter"
                        value={focusedKind}
                        onChange={(event) =>
                            changeFocus(event.target.value as DemoKind | 'all')
                        }
                    >
                        <option value="all">Semua tahap</option>
                        {Object.entries(DEMO_KIND_LABELS).map(
                            ([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ),
                        )}
                    </select>
                    <button
                        type="button"
                        className="landing-control"
                        onClick={() => {
                            setView('map');
                            setFocusedKind('all');
                            setSelectedId(null);
                            setResetCount((count) => count + 1);
                        }}
                    >
                        <RotateCcw aria-hidden="true" className="size-4" />
                        Reset
                    </button>
                </div>
            </div>
            <p
                id="demo-map-description"
                className="collaboration-map-description"
            >
                Pilih arsip untuk membaca rincian. Gulir peta untuk mengikuti
                alur.
                <span className="sr-only">
                    Gunakan Tab lalu Enter, atau buka Daftar hubungan. Fokus
                    tahap tidak menghilangkan konteks peta.
                </span>
            </p>
            <p
                className="sr-only"
                role="status"
                aria-live="polite"
                aria-atomic="true"
            >
                {selectedNode
                    ? `Arsip ${selectedNode.label} dipilih. Rincian dan hubungan terdekat diperbarui.`
                    : 'Tidak ada arsip dipilih. Semua tahap ditampilkan.'}
            </p>
            <div
                id="demo-view-panel"
                role="tabpanel"
                aria-labelledby={`demo-view-tab-${view}`}
                tabIndex={0}
                className="collaboration-view-panel"
            >
                {view === 'map' ? (
                    <LandingCollaborationMap
                        key={resetCount}
                        selectedId={selectedId}
                        focusedKind={focusedKind}
                        onSelect={selectNode}
                    />
                ) : (
                    <div
                        className="collaboration-ledger"
                        aria-labelledby="ledger-heading"
                    >
                        <div className="collaboration-ledger-heading">
                            <div>
                                <h3
                                    id="ledger-heading"
                                    className="text-lg font-bold"
                                >
                                    Daftar hubungan
                                </h3>
                                <p className="mt-1 text-sm text-[#526B85]">
                                    {displayedNodes.length} arsip synthetic.
                                    Hubungan sama dengan peta.
                                </p>
                            </div>
                            <FileText
                                aria-hidden="true"
                                className="size-6 text-[#1764E8]"
                            />
                        </div>
                        <table className="collaboration-table">
                            <caption className="sr-only">
                                Arsip dan hubungan graf kolaborasi synthetic
                                SATU
                            </caption>
                            <thead>
                                <tr>
                                    <th scope="col">Arsip</th>
                                    <th scope="col">Hubungan</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayedNodes.map((node) => {
                                    const Icon = DEMO_ICONS[node.kind];

                                    return (
                                        <tr
                                            key={node.id}
                                            data-selected={
                                                selectedId === node.id ||
                                                undefined
                                            }
                                        >
                                            <th scope="row">
                                                <button
                                                    type="button"
                                                    aria-pressed={
                                                        selectedId === node.id
                                                    }
                                                    aria-controls="demo-node-detail"
                                                    className="collaboration-table-button"
                                                    onClick={() =>
                                                        selectNode(node.id)
                                                    }
                                                >
                                                    <span className="flex items-center gap-2 text-xs font-semibold text-[#1454C4]">
                                                        <Icon
                                                            aria-hidden="true"
                                                            className="size-4 shrink-0"
                                                        />
                                                        {
                                                            DEMO_KIND_LABELS[
                                                                node.kind
                                                            ]
                                                        }
                                                    </span>
                                                    <span className="mt-2 text-sm leading-6 font-bold">
                                                        {node.label}
                                                    </span>
                                                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#526B85]">
                                                        {selectedId ===
                                                            node.id && (
                                                            <Check
                                                                aria-hidden="true"
                                                                className="size-3.5"
                                                            />
                                                        )}
                                                        {selectedId === node.id
                                                            ? 'Dipilih'
                                                            : 'Pilih arsip'}
                                                    </span>
                                                </button>
                                            </th>
                                            <td>
                                                <RelationText id={node.id} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <DemoDetails node={selectedNode} onSelect={selectNode} />
            <p className="collaboration-demo-note">
                <BookOpen
                    aria-hidden="true"
                    className="size-4 shrink-0 text-[#1764E8]"
                />
                Contoh alur, bukan progres akun. Validasi tidak otomatis
                memublikasikan portofolio.
            </p>
        </section>
    );
}
