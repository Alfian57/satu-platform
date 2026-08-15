import cytoscape from 'cytoscape';
import { Check, Info, Network, RotateCcw } from 'lucide-react';
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
        detail: string;
        metadata: string;
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
                label: 'Inovasi Smart Campus',
                type: 'opportunity',
                detail: 'Proyek inisiasi lab riset komputasi untuk mahasiswa',
                metadata: 'Kuota: 3 Talenta | Batas: 30 Hari',
            },
        },
        {
            data: {
                id: 'user1',
                label: 'Budi (Mahasiswa)',
                type: 'student',
                detail: 'Fakultas Ilmu Komputer, Minat Frontend & UI/UX',
                metadata: 'NIM Terverifikasi | Jam: 10h/mgg',
            },
        },
        {
            data: {
                id: 'user2',
                label: 'Siti (Mahasiswa)',
                type: 'student',
                detail: 'Fakultas Teknik Elektro, Minat Backend & Cloud',
                metadata: 'NIM Terverifikasi | Jam: 8h/mgg',
            },
        },
        {
            data: {
                id: 'team1',
                label: 'Squad Garuda Code',
                type: 'team',
                detail: 'Tim kolaboratif beranggotakan 2 mahasiswa lintas prodi',
                metadata: 'Skor Kecocokan: 96% | Formasi: Terbuka',
            },
        },
        {
            data: {
                id: 'work1',
                label: 'Komponen UI & Dashboard',
                type: 'work',
                detail: 'Arsitektur komponen React, desain responsif, dan state',
                metadata: 'PR #24 Digabungkan | Figma Kit v1.2',
            },
        },
        {
            data: {
                id: 'work2',
                label: 'Rest API & Database',
                type: 'work',
                detail: 'Endpoint autentikasi, model data, dan realtime broadcast',
                metadata: 'PR #25 Digabungkan | Cakupan Pengujian 92%',
            },
        },
        {
            data: {
                id: 'val1',
                label: 'Validasi Resmi Dosen',
                type: 'validation',
                detail: 'Peninjauan oleh Dr. Aris Subagyo, S.T., M.Kom.',
                metadata: 'Stempel: TERVERIFIKASI // HASH: 8A4F',
            },
        },
        {
            data: {
                id: 'port1',
                label: 'Portofolio Terproyeksi',
                type: 'portfolio',
                detail: 'Entri portofolio yang diizinkan untuk Talent Scout',
                metadata: 'Visibilitas: Terbuka untuk Mitra',
            },
        },
    ],
    edges: [
        { data: { source: 'opp1', target: 'team1', label: 'dibuka untuk' } },
        { data: { source: 'user1', target: 'team1', label: 'bergabung ke' } },
        { data: { source: 'user2', target: 'team1', label: 'bergabung ke' } },
        { data: { source: 'team1', target: 'work1', label: 'mengerjakan' } },
        { data: { source: 'team1', target: 'work2', label: 'mengerjakan' } },
        { data: { source: 'user1', target: 'work1', label: 'pemilik' } },
        { data: { source: 'user2', target: 'work2', label: 'pemilik' } },
        { data: { source: 'work1', target: 'val1', label: 'ditinjau oleh' } },
        { data: { source: 'work2', target: 'val1', label: 'ditinjau oleh' } },
        {
            data: {
                source: 'val1',
                target: 'port1',
                label: 'diproyeksikan ke',
            },
        },
    ],
};

const TYPE_LABELS: Record<FilterType, string> = {
    all: 'Semua Tahap',
    opportunity: 'Peluang',
    student: 'Mahasiswa',
    team: 'Tim',
    work: 'Pekerjaan',
    validation: 'Validasi',
    portfolio: 'Portofolio',
};

const TYPE_BADGE_CLASSES: Record<SyntheticNodeType, string> = {
    opportunity: 'bg-blue-50 text-blue-700 border-blue-200',
    student: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    team: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    work: 'bg-sky-50 text-sky-700 border-sky-200',
    validation: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    portfolio: 'bg-amber-50 text-amber-800 border-amber-200',
};

const TYPE_NODE_COLORS: Record<SyntheticNodeType, string> = {
    opportunity: '#1746B0',
    student: '#4F46E5',
    team: '#059669',
    work: '#0284C7',
    validation: '#16734A',
    portfolio: '#D97706',
};

export default function LandingDemoGraph() {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const [selectedType, setSelectedType] = useState<FilterType>('all');
    const [activeNodeId, setActiveNodeId] = useState<string | null>('user1');
    const [hasError, setHasError] = useState(false);

    const prefersReducedMotion = useMemo(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    const activeNodeData = useMemo(() => {
        if (!activeNodeId) {
            return null;
        }

        return (
            SYNTHETIC_DATA.nodes.find((n) => n.data.id === activeNodeId)
                ?.data ?? null
        );
    }, [activeNodeId]);

    const activeNodeConnections = useMemo(() => {
        if (!activeNodeId) {
            return [];
        }

        const incoming = SYNTHETIC_DATA.edges
            .filter((e) => e.data.target === activeNodeId)
            .map((e) => {
                const src = SYNTHETIC_DATA.nodes.find(
                    (n) => n.data.id === e.data.source,
                );

                return {
                    direction: 'in' as const,
                    relation: e.data.label,
                    targetLabel: src?.data.label ?? e.data.source,
                    targetType: src?.data.type ?? 'opportunity',
                };
            });

        const outgoing = SYNTHETIC_DATA.edges
            .filter((e) => e.data.source === activeNodeId)
            .map((e) => {
                const tgt = SYNTHETIC_DATA.nodes.find(
                    (n) => n.data.id === e.data.target,
                );

                return {
                    direction: 'out' as const,
                    relation: e.data.label,
                    targetLabel: tgt?.data.label ?? e.data.target,
                    targetType: tgt?.data.type ?? 'opportunity',
                };
            });

        return [...incoming, ...outgoing];
    }, [activeNodeId]);

    const focusNode = useCallback((id: string) => {
        const cy = cyRef.current;
        const node = cy?.getElementById(id);

        if (!cy || !node || node.empty()) {
            return;
        }

        setActiveNodeId(id);
        cy.elements().removeClass('highlighted');
        node.addClass('highlighted');
        node.connectedEdges().addClass('highlighted');
        node.neighborhood('node').addClass('highlighted');
    }, []);

    const clearFocus = useCallback(() => {
        setActiveNodeId(null);
        cyRef.current?.elements().removeClass('highlighted');
    }, []);

    const initGraph = useCallback(() => {
        if (!containerRef.current) {
            return;
        }

        cyRef.current = cytoscape({
            container: containerRef.current,
            elements: SYNTHETIC_DATA,
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#1746B0',
                        color: '#111827',
                        'font-family':
                            'Familjen Grotesk, system-ui, sans-serif',
                        'font-size': '12px',
                        'font-weight': 'bold',
                        label: 'data(label)',
                        'text-background-color': '#FFFFFF',
                        'text-background-opacity': 0.94,
                        'text-background-padding': '4px',
                        'text-halign': 'center',
                        'text-max-width': '140px',
                        'text-overflow-wrap': 'anywhere',
                        'text-valign': 'bottom',
                        'text-margin-y': 6,
                        'border-width': 2,
                        'border-color': '#FFFFFF',
                        width: 28,
                        height: 28,
                    },
                },
                ...Object.entries(TYPE_NODE_COLORS).map(([type, color]) => ({
                    selector: `node[type="${type}"]`,
                    style: {
                        'background-color': color,
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
                    style: { shape: 'roundrectangle', width: 34, height: 34 },
                },
                {
                    selector: 'edge',
                    style: {
                        color: '#526077',
                        'curve-style': 'bezier',
                        'font-size': '10px',
                        'font-family': 'Azeret Mono, monospace',
                        label: 'data(label)',
                        'line-color': '#C7D0DF',
                        'target-arrow-color': '#C7D0DF',
                        'target-arrow-shape': 'triangle',
                        'text-background-color': '#F7F9FC',
                        'text-background-opacity': 0.9,
                        'text-background-padding': '3px',
                        'text-rotation': 'autorotate',
                        'text-margin-y': -6,
                        width: 1.8,
                    },
                },
                {
                    selector: '.hidden',
                    style: { display: 'none' },
                },
                {
                    selector: '.highlighted',
                    style: {
                        'border-color': '#1746B0',
                        'border-width': 4,
                    },
                },
                {
                    selector: 'edge.highlighted',
                    style: {
                        'line-color': '#1746B0',
                        'target-arrow-color': '#1746B0',
                        width: 3,
                    },
                },
            ],
            layout: {
                name: 'breadthfirst',
                directed: true,
                padding: 40,
                animate: !prefersReducedMotion,
                animationDuration: prefersReducedMotion ? 0 : 400,
            },
            boxSelectionEnabled: false,
            userPanningEnabled: true,
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

        // Set initial highlight
        focusNode('user1');
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
            padding: 40,
            animate: !prefersReducedMotion,
            animationDuration: prefersReducedMotion ? 0 : 300,
        }).run();
    }, [prefersReducedMotion, selectedType]);

    const handleTypeChange = (nextType: FilterType) => {
        setSelectedType(nextType);

        if (
            activeNodeId &&
            nextType !== 'all' &&
            !SYNTHETIC_DATA.nodes.some(
                (node) =>
                    node.data.id === activeNodeId &&
                    node.data.type === nextType,
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
                className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-slate-300 bg-slate-50 p-8 text-center"
                data-testid="landing-demo-error"
                role="alert"
            >
                <p className="text-sm font-semibold text-slate-900">
                    Demo kolaborasi belum dapat dimuat.
                </p>
                <p className="max-w-sm text-xs leading-5 text-slate-500">
                    Data Anda tetap aman. Coba muat ulang demo untuk melihat
                    alurnya kembali.
                </p>
                <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-2xs hover:bg-primary/90"
                >
                    <RotateCcw aria-hidden="true" className="size-3.5" />
                    Coba lagi
                </button>
            </div>
        );
    }

    return (
        <div
            className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:items-start"
            data-testid="landing-demo-graph"
        >
            {/* Cytoscape Graph Canvas Area */}
            <section
                className="min-w-0 overflow-hidden rounded-2xl border border-slate-300/90 bg-white shadow-sm"
                aria-labelledby="graph-heading"
            >
                {/* Header & Filter Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-primary">
                                <Network
                                    aria-hidden="true"
                                    className="size-4"
                                />
                            </span>
                            <h3
                                id="graph-heading"
                                className="text-sm font-bold text-slate-900"
                            >
                                Jaringan Kolaborasi Mahasiswa
                            </h3>
                        </div>
                        <p className="mt-1 font-label text-[0.62rem] text-slate-500">
                            DATA SYNTHETIC // INTERAKTIF (KLIK NODE UNTUK
                            INSPEKSI)
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setSelectedType('all');
                            clearFocus();
                        }}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-100"
                    >
                        <RotateCcw aria-hidden="true" className="size-3.5" />
                        Reset Graf
                    </button>
                </div>

                {/* Filter Pills Bar */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-white px-4 py-2.5 sm:px-5">
                    <span className="mr-1 font-label text-[0.65rem] font-bold text-slate-400">
                        Saring:
                    </span>
                    {(
                        [
                            'all',
                            'opportunity',
                            'student',
                            'team',
                            'work',
                            'validation',
                            'portfolio',
                        ] as const
                    ).map((type) => {
                        const isSelected = selectedType === type;

                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => handleTypeChange(type)}
                                className={cn(
                                    'rounded-lg px-2.5 py-1 font-label text-[0.65rem] font-bold transition-colors',
                                    isSelected
                                        ? 'bg-primary text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                                )}
                            >
                                {TYPE_LABELS[type]}
                            </button>
                        );
                    })}
                </div>

                {/* Graph Canvas */}
                <p id="graph-description" className="sr-only">
                    Grafik interaktif ini menggambarkan alur pembentukan tim,
                    pekerjaan, validasi, dan portofolio.
                </p>
                <div
                    ref={containerRef}
                    aria-describedby="graph-description"
                    aria-hidden="true"
                    className="h-[340px] w-full bg-[#F8FAFC] sm:h-[400px]"
                    data-testid="landing-graph-canvas"
                />

                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-500">
                    <span>💡 Geser dan klik node untuk menelusuri relasi.</span>
                    <span className="font-label text-[0.65rem] font-semibold text-slate-400">
                        8 ENTITAS SYNTHETIC
                    </span>
                </div>
            </section>

            {/* Entity Inspector & Table Equivalent */}
            <section className="space-y-4" aria-labelledby="inspector-heading">
                {/* Active Node Inspector Docket */}
                {activeNodeData ? (
                    <div className="rounded-2xl border border-primary/20 bg-blue-50/40 p-4 shadow-xs sm:p-5">
                        <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                            <span className="font-label text-[0.62rem] font-bold tracking-wider text-primary">
                                INSPEKTOR ENTITAS TERPILIH
                            </span>
                            <span
                                className={cn(
                                    'rounded-md border px-2 py-0.5 font-label text-[0.62rem] font-bold',
                                    TYPE_BADGE_CLASSES[activeNodeData.type],
                                )}
                            >
                                {TYPE_LABELS[activeNodeData.type].toUpperCase()}
                            </span>
                        </div>

                        <div className="mt-3">
                            <h4 className="text-base font-bold text-slate-900">
                                {activeNodeData.label}
                            </h4>
                            <p className="mt-1 text-xs text-slate-600">
                                {activeNodeData.detail}
                            </p>
                            <p className="mt-2 font-label text-[0.68rem] font-semibold text-slate-500">
                                {activeNodeData.metadata}
                            </p>
                        </div>

                        {/* Connected Relationships */}
                        <div className="mt-4 border-t border-primary/10 pt-3">
                            <span className="font-label text-[0.6rem] font-bold text-slate-400">
                                HUBUNGAN TERKAIT ({activeNodeConnections.length}
                                ):
                            </span>
                            <div className="mt-2 space-y-1.5">
                                {activeNodeConnections.map((conn, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between rounded-lg bg-white p-2 text-xs shadow-2xs"
                                    >
                                        <span className="font-label text-[0.65rem] text-slate-500">
                                            {conn.direction === 'in'
                                                ? '← diterima dari'
                                                : '→ berlanjut ke'}
                                        </span>
                                        <span className="font-semibold text-slate-800">
                                            {conn.targetLabel}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400">
                        <Info
                            aria-hidden="true"
                            className="size-5 text-slate-300"
                        />
                        <span className="mt-2 font-semibold">
                            Pilih salah satu node pada graf di atas untuk
                            membaca berkas relasinya.
                        </span>
                    </div>
                )}

                {/* Table Equivalent for Keyboard / Screen-Reader */}
                <div className="overflow-hidden rounded-2xl border border-slate-300/80 bg-white shadow-xs">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900">
                                Daftar Entitas Kolaborasi
                            </h4>
                            <span className="font-label text-[0.62rem] text-slate-500">
                                {displayNodes.length} DATA
                            </span>
                        </div>
                    </div>
                    <div className="max-h-[220px] overflow-y-auto">
                        <table className="w-full text-left text-xs">
                            <caption className="sr-only">
                                Tabel alur relasi synthetic kolaborasi SATU
                            </caption>
                            <thead className="sticky top-0 bg-slate-100 text-slate-800">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-4 py-2 font-semibold"
                                    >
                                        Nama Entitas
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-2 font-semibold"
                                    >
                                        Tahap
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayNodes.map((node) => {
                                    const isFocused =
                                        activeNodeId === node.data.id;

                                    return (
                                        <tr
                                            key={node.data.id}
                                            onClick={() =>
                                                focusNode(node.data.id)
                                            }
                                            className={cn(
                                                'cursor-pointer transition-colors',
                                                isFocused
                                                    ? 'bg-blue-50/80 font-bold'
                                                    : 'hover:bg-slate-50',
                                            )}
                                        >
                                            <td className="px-4 py-2.5 text-slate-900">
                                                <div className="flex items-center gap-2">
                                                    {isFocused && (
                                                        <Check
                                                            aria-hidden="true"
                                                            className="size-3 text-primary"
                                                        />
                                                    )}
                                                    <span>
                                                        {node.data.label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span
                                                    className={cn(
                                                        'rounded-md border px-1.5 py-0.5 font-label text-[0.6rem] font-bold',
                                                        TYPE_BADGE_CLASSES[
                                                            node.data.type
                                                        ],
                                                    )}
                                                >
                                                    {
                                                        TYPE_LABELS[
                                                            node.data.type
                                                        ]
                                                    }
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}
