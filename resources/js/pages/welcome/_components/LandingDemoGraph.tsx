import { BookOpen, Layers3, List, Map, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import DemoDetails from '@/pages/welcome/_components/landing/demo-details';
import DemoRelationsTable from '@/pages/welcome/_components/landing/demo-relations-table';
import LandingCollaborationMap from '@/pages/welcome/_components/landing-collaboration-map';
import {
    DEMO_KIND_LABELS,
    DEMO_NODES,
    getDemoNode,
} from '@/pages/welcome/_utils/landing-demo';
import type { DemoKind } from '@/pages/welcome/_utils/landing-demo';

type DemoView = 'map' | 'list';
const views = [
    { key: 'map', label: 'Peta kolaborasi', icon: Map },
    { key: 'list', label: 'Daftar hubungan', icon: List },
] as const;

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
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-satu-border-contrast bg-white text-satu-blue shadow-sm">
                        <Layers3 aria-hidden="true" className="size-6" />
                    </span>
                    <div>
                        <p className="font-label text-xs text-satu-muted">
                            ARSIP DEMO / 001
                        </p>
                        <h3
                            id="graph-heading"
                            className="mt-1 text-xl font-bold tracking-tight sm:text-2xl"
                        >
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
                                    'collaboration-view-tab cursor-pointer',
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
                        className="text-xs font-semibold text-satu-muted"
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
                        className="landing-control cursor-pointer"
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
                    <DemoRelationsTable
                        displayedNodes={displayedNodes}
                        selectedId={selectedId}
                        onSelectNode={selectNode}
                    />
                )}
            </div>
            <DemoDetails node={selectedNode} onSelect={selectNode} />
            <p className="collaboration-demo-note">
                <BookOpen
                    aria-hidden="true"
                    className="size-4 shrink-0 text-satu-blue"
                />
                Contoh alur, bukan progres akun. Validasi tidak otomatis
                memublikasikan portofolio.
            </p>
        </section>
    );
}
