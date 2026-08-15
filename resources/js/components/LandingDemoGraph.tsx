import cytoscape from 'cytoscape';
import { Check, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type SyntheticNodeType =
    'opportunity' | 'student' | 'team' | 'work' | 'validation' | 'portfolio';

type FilterType = 'all' | SyntheticNodeType;

type SyntheticNode = {
    data: {
        id: string;
        label: string;
        type: SyntheticNodeType;
    };
};

const SYNTHETIC_DATA: {
    nodes: SyntheticNode[];
    edges: { data: { source: string; target: string; label: string } }[];
} = {
    nodes: [
        {
            data: {
                id: 'opp1',
                label: 'Hackathon kampus',
                type: 'opportunity',
            },
        },
        { data: { id: 'user1', label: 'Budi', type: 'student' } },
        { data: { id: 'user2', label: 'Siti', type: 'student' } },
        { data: { id: 'team1', label: 'Tim Alpha', type: 'team' } },
        { data: { id: 'work1', label: 'Frontend UI', type: 'work' } },
        { data: { id: 'work2', label: 'Backend API', type: 'work' } },
        {
            data: {
                id: 'val1',
                label: 'Kontribusi disetujui',
                type: 'validation',
            },
        },
        {
            data: {
                id: 'port1',
                label: 'Portofolio Budi',
                type: 'portfolio',
            },
        },
    ],
    edges: [
        { data: { source: 'opp1', target: 'team1', label: 'dibuka untuk' } },
        { data: { source: 'user1', target: 'team1', label: 'bergabung' } },
        { data: { source: 'user2', target: 'team1', label: 'bergabung' } },
        { data: { source: 'team1', target: 'work1', label: 'menghasilkan' } },
        { data: { source: 'team1', target: 'work2', label: 'menghasilkan' } },
        { data: { source: 'user1', target: 'work1', label: 'mengerjakan' } },
        { data: { source: 'user2', target: 'work2', label: 'mengerjakan' } },
        { data: { source: 'work1', target: 'val1', label: 'ditinjau' } },
        { data: { source: 'work2', target: 'val1', label: 'ditinjau' } },
        { data: { source: 'val1', target: 'port1', label: 'diproyeksikan' } },
    ],
};

const TYPE_LABELS: Record<FilterType, string> = {
    all: 'Semua tahap',
    opportunity: 'Peluang',
    student: 'Mahasiswa',
    team: 'Tim',
    work: 'Pekerjaan',
    validation: 'Validasi',
    portfolio: 'Portofolio',
};

const TYPE_COLORS: Record<SyntheticNodeType, string> = {
    opportunity: '--landing-blue',
    student: '--landing-lilac',
    team: '--landing-mint',
    work: '--landing-coral',
    validation: '--landing-yellow',
    portfolio: '--landing-blue',
};

const TYPE_BADGE_CLASSES: Record<SyntheticNodeType, string> = {
    opportunity: 'bg-[var(--landing-blue-soft)] text-[var(--landing-blue)]',
    student: 'bg-[var(--landing-lilac-soft)] text-[#1D5FAE]',
    team: 'bg-[var(--landing-mint-soft)] text-[#18559C]',
    work: 'bg-[var(--landing-coral-soft)] text-[#1E69BF]',
    validation: 'bg-[var(--landing-yellow-soft)] text-[#276DAF]',
    portfolio: 'bg-[var(--landing-blue-soft)] text-[var(--landing-blue)]',
};

function getComputedToken(name: string, scope?: Element | null): string {
    if (typeof document === 'undefined') {
        return '';
    }

    const source =
        scope?.closest<HTMLElement>('[data-landing-surface]') ??
        document.documentElement;

    return getComputedStyle(source).getPropertyValue(name).trim();
}

export default function LandingDemoGraph() {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const [selectedType, setSelectedType] = useState<FilterType>('all');
    const [activeNode, setActiveNode] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);
    const prefersReducedMotion = useMemo(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    const focusNode = useCallback((id: string) => {
        const cy = cyRef.current;
        const node = cy?.getElementById(id);

        if (!cy || !node || node.empty()) {
            return;
        }

        setActiveNode(id);
        cy.elements().removeClass('highlighted');
        node.addClass('highlighted');
        node.connectedEdges().addClass('highlighted');
        node.neighborhood('node').addClass('highlighted');
    }, []);

    const clearFocus = useCallback(() => {
        setActiveNode(null);
        cyRef.current?.elements().removeClass('highlighted');
    }, []);

    const initGraph = useCallback(() => {
        if (!containerRef.current) {
            return;
        }

        const themeRoot = containerRef.current.closest<HTMLElement>(
            '[data-landing-surface]',
        );
        const primaryColor =
            getComputedToken('--landing-blue', themeRoot) || '#155EEF';
        const foreground =
            getComputedToken('--landing-ink', themeRoot) || '#11346F';
        const mutedForeground =
            getComputedToken('--landing-muted', themeRoot) || '#3D5F91';
        const borderColor =
            getComputedToken('--landing-border', themeRoot) || '#C8DCFA';
        const surfaceColor =
            getComputedToken('--landing-surface', themeRoot) || '#FFFFFF';
        const canvasColor =
            getComputedToken('--landing-canvas', themeRoot) || '#F5FAFF';

        cyRef.current = cytoscape({
            container: containerRef.current,
            elements: SYNTHETIC_DATA,
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': primaryColor,
                        color: foreground,
                        'font-family':
                            'Familjen Grotesk, system-ui, sans-serif',
                        'font-size': '11px',
                        label: 'data(label)',
                        'text-background-color': surfaceColor,
                        'text-background-opacity': 0.96,
                        'text-background-padding': '4px',
                        'text-halign': 'center',
                        'text-max-width': '130px',
                        'text-overflow-wrap': 'anywhere',
                        'text-valign': 'bottom',
                        'text-margin-y': 8,
                        'border-width': 2,
                        'border-color': surfaceColor,
                        width: 26,
                        height: 26,
                    },
                },
                ...Object.entries(TYPE_COLORS).map(([type, token]) => ({
                    selector: `node[type="${type}"]`,
                    style: {
                        'background-color':
                            getComputedToken(token, themeRoot) || primaryColor,
                    },
                })),
                {
                    selector: 'node[type="team"], node[type="validation"]',
                    style: { shape: 'roundrectangle' },
                },
                {
                    selector: 'node[type="work"]',
                    style: { shape: 'rectangle' },
                },
                {
                    selector: 'node[type="portfolio"]',
                    style: { shape: 'roundrectangle', width: 32, height: 32 },
                },
                {
                    selector: 'edge',
                    style: {
                        color: mutedForeground,
                        'curve-style': 'bezier',
                        'font-size': '9px',
                        label: 'data(label)',
                        'line-color': borderColor,
                        'target-arrow-color': borderColor,
                        'target-arrow-shape': 'triangle',
                        'text-background-color': canvasColor,
                        'text-background-opacity': 0.9,
                        'text-background-padding': '3px',
                        'text-rotation': 'autorotate',
                        'text-margin-y': -8,
                        width: 1.5,
                    },
                },
                {
                    selector: '.hidden',
                    style: { display: 'none' },
                },
                {
                    selector: '.highlighted',
                    style: {
                        'background-color': primaryColor,
                        'border-color': surfaceColor,
                        'border-width': 3,
                    },
                },
                {
                    selector: 'edge.highlighted',
                    style: {
                        'line-color': primaryColor,
                        'target-arrow-color': primaryColor,
                        width: 3,
                    },
                },
            ],
            layout: {
                name: 'breadthfirst',
                directed: true,
                padding: 34,
                animate: !prefersReducedMotion,
                animationDuration: prefersReducedMotion ? 0 : 480,
            },
            boxSelectionEnabled: false,
            userPanningEnabled: false,
            userZoomingEnabled: false,
        });

        const cy = cyRef.current;

        cy.on('tap', 'node', (event) => {
            focusNode(event.target.data('id'));
        });
        cy.on('tap', (event) => {
            if (event.target === cy) {
                clearFocus();
            }
        });
    }, [clearFocus, focusNode, prefersReducedMotion]);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        try {
            initGraph();
        } catch {
            window.setTimeout(() => setHasError(true), 0);
        }

        return () => {
            cyRef.current?.destroy();
            cyRef.current = null;
        };
    }, [initGraph]);

    const displayNodes = SYNTHETIC_DATA.nodes.filter(
        (node) => selectedType === 'all' || node.data.type === selectedType,
    );

    useEffect(() => {
        const cy = cyRef.current;

        if (!cy) {
            return;
        }

        cy.elements().removeClass('hidden');

        if (selectedType !== 'all') {
            cy.nodes().forEach((node) => {
                if (node.data('type') !== selectedType) {
                    node.addClass('hidden');
                    node.connectedEdges().addClass('hidden');
                }
            });
        }

        cy.layout({
            name: 'breadthfirst',
            directed: true,
            padding: 34,
            animate: !prefersReducedMotion,
            animationDuration: prefersReducedMotion ? 0 : 360,
        }).run();
    }, [prefersReducedMotion, selectedType]);

    const handleTypeChange = (nextType: FilterType) => {
        setSelectedType(nextType);

        if (
            activeNode &&
            nextType !== 'all' &&
            !SYNTHETIC_DATA.nodes.some(
                (node) =>
                    node.data.id === activeNode && node.data.type === nextType,
            )
        ) {
            clearFocus();
        }
    };

    const handleRetry = () => {
        setHasError(false);
        cyRef.current?.destroy();
        cyRef.current = null;

        window.setTimeout(() => {
            try {
                initGraph();
            } catch {
                setHasError(true);
            }
        }, 0);
    };

    if (hasError) {
        return (
            <div
                className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-[#C9E2FC] bg-[var(--landing-coral-soft)] p-8 text-center sm:p-12"
                data-testid="landing-demo-error"
                role="alert"
            >
                <p className="text-sm font-semibold text-[var(--landing-ink)]">
                    Demo kolaborasi belum dapat dimuat.
                </p>
                <p className="max-w-sm text-sm leading-6 text-[var(--landing-muted)]">
                    Data Anda tetap aman. Coba muat ulang demo untuk melihat
                    alurnya kembali.
                </p>
                <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex h-control-md items-center gap-2 rounded-xl bg-[var(--landing-blue)] px-4 text-sm font-semibold text-white transition-[background-color,transform] duration-fast hover:-translate-y-0.5 hover:bg-[var(--landing-blue-strong)] motion-reduce:transition-none"
                >
                    <RotateCcw aria-hidden="true" className="size-4" />
                    Coba lagi
                </button>
            </div>
        );
    }

    return (
        <div
            className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-5"
            data-testid="landing-demo-graph"
        >
            <section
                className="min-w-0 overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)]"
                aria-labelledby="graph-heading"
            >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--landing-border)] p-4 sm:p-5">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-8 items-center justify-center rounded-xl bg-[var(--landing-mint-soft)] text-[#18559C]">
                                <Check aria-hidden="true" className="size-4" />
                            </span>
                            <h3
                                id="graph-heading"
                                className="text-sm font-semibold text-[var(--landing-ink)]"
                            >
                                Graf kolaborasi
                            </h3>
                        </div>
                        <p className="mt-2 flex items-center gap-2 font-label text-[0.62rem] tracking-[0.03em] text-[var(--landing-muted)]">
                            <span
                                aria-hidden="true"
                                className="size-1.5 rounded-full bg-[var(--landing-coral)]"
                            />
                            Data synthetic / dapat direset
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <label
                            htmlFor="landing-graph-filter"
                            className="sr-only"
                        >
                            Filter tahap kolaborasi
                        </label>
                        <select
                            id="landing-graph-filter"
                            value={selectedType}
                            onChange={(event) =>
                                handleTypeChange(
                                    event.target.value as FilterType,
                                )
                            }
                            className="h-control-sm rounded-xl border border-[var(--landing-border)] bg-[var(--landing-canvas)] px-3 text-xs text-[var(--landing-ink)] focus-visible:border-[var(--landing-blue)]"
                        >
                            {Object.entries(TYPE_LABELS).map(
                                ([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ),
                            )}
                        </select>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedType('all');
                                clearFocus();
                            }}
                            className="inline-flex h-control-sm items-center gap-2 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-blue-soft)] px-3 text-xs font-semibold text-[var(--landing-blue)] transition-[background-color,transform] duration-fast hover:-translate-y-0.5 hover:bg-[#E1E6FF] motion-reduce:transition-none"
                        >
                            <RotateCcw
                                aria-hidden="true"
                                className="size-3.5"
                            />
                            Reset
                        </button>
                    </div>
                </div>

                <p id="graph-description" className="sr-only">
                    Graf dekoratif ini melacak alur dari peluang ke tim,
                    pekerjaan, validasi, dan portofolio. Gunakan tabel di
                    samping untuk membaca data dan memilih node secara keyboard.
                </p>
                <div
                    ref={containerRef}
                    aria-describedby="graph-description"
                    aria-hidden="true"
                    className="h-[320px] w-full bg-[var(--landing-canvas)] sm:h-[380px] lg:h-[440px]"
                    data-testid="landing-graph-canvas"
                />
                <div className="flex items-start gap-3 border-t border-[var(--landing-border)] bg-[var(--landing-blue-soft)] px-4 py-3 text-xs leading-5 text-[var(--landing-muted)] sm:px-5">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-[var(--landing-blue)]" />
                    <p>
                        Klik node untuk menyorot hubungan terdekat. Warna hanya
                        membantu orientasi, bukan satu-satunya penanda tahap.
                    </p>
                </div>
            </section>

            <section
                className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)]"
                aria-labelledby="ledger-heading"
            >
                <div className="border-b border-[var(--landing-border)] p-4 sm:p-5">
                    <p className="font-label text-[0.62rem] tracking-[0.04em] text-[var(--landing-blue)]">
                        TABLE EQUIVALENT
                    </p>
                    <h3
                        id="ledger-heading"
                        className="mt-2 text-title font-semibold tracking-[-0.025em] text-[var(--landing-ink)]"
                    >
                        Ledger hubungan
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-[var(--landing-muted)]">
                        {displayNodes.length} record synthetic pada filter ini.
                    </p>
                </div>
                <div className="max-h-[440px] flex-1 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                        <caption className="sr-only">
                            Record graph kolaborasi synthetic SATU
                        </caption>
                        <thead className="sticky top-0 z-10 bg-[var(--landing-blue-soft)] text-[var(--landing-ink)]">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-4 py-3 font-semibold"
                                >
                                    Node
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 font-semibold"
                                >
                                    Tahap
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--landing-border)]">
                            {displayNodes.map((node) => {
                                const isActive = activeNode === node.data.id;

                                return (
                                    <tr
                                        key={node.data.id}
                                        className={cn(
                                            'transition-colors duration-fast motion-reduce:transition-none',
                                            isActive
                                                ? 'bg-[var(--landing-yellow-soft)]'
                                                : 'hover:bg-[var(--landing-canvas)]',
                                        )}
                                    >
                                        <td className="p-0">
                                            <button
                                                type="button"
                                                aria-pressed={isActive}
                                                onClick={() =>
                                                    focusNode(node.data.id)
                                                }
                                                className="flex min-h-12 w-full items-center gap-2 px-4 py-3 text-left font-semibold text-[var(--landing-ink)]"
                                            >
                                                {isActive ? (
                                                    <Check
                                                        aria-hidden="true"
                                                        className="size-3.5 shrink-0 text-[var(--landing-blue)]"
                                                    />
                                                ) : (
                                                    <span
                                                        aria-hidden="true"
                                                        className={cn(
                                                            'size-2 shrink-0 rounded-full',
                                                            TYPE_BADGE_CLASSES[
                                                                node.data.type
                                                            ].split(' ')[0],
                                                        )}
                                                    />
                                                )}
                                                <span className="truncate">
                                                    {node.data.label}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full px-2 py-1 text-[0.65rem] font-semibold',
                                                    TYPE_BADGE_CLASSES[
                                                        node.data.type
                                                    ],
                                                )}
                                            >
                                                {TYPE_LABELS[node.data.type]}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {displayNodes.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={2}
                                        className="px-4 py-10 text-center text-[var(--landing-muted)]"
                                    >
                                        Tidak ada record pada filter ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
