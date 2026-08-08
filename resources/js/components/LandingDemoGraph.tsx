import cytoscape from 'cytoscape';
import React, {
    useEffect,
    useRef,
    useState,
    useMemo,
    useCallback,
} from 'react';

// "Data synthetic" dummy data for the graph
const SYNTHETIC_DATA = {
    nodes: [
        {
            data: {
                id: 'opp1',
                label: 'Hackathon',
                type: 'opportunity',
            },
        },
        { data: { id: 'user1', label: 'Budi', type: 'student' } },
        { data: { id: 'user2', label: 'Siti', type: 'student' } },
        { data: { id: 'team1', label: 'Team Alpha', type: 'team' } },
        { data: { id: 'work1', label: 'Frontend UI', type: 'work' } },
        { data: { id: 'work2', label: 'Backend API', type: 'work' } },
        {
            data: {
                id: 'val1',
                label: 'Terverifikasi',
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
        { data: { source: 'opp1', target: 'team1', label: 'Joined' } },
        { data: { source: 'user1', target: 'team1', label: 'Member' } },
        { data: { source: 'user2', target: 'team1', label: 'Member' } },
        { data: { source: 'team1', target: 'work1', label: 'Produced' } },
        { data: { source: 'team1', target: 'work2', label: 'Produced' } },
        { data: { source: 'user1', target: 'work1', label: 'Authored' } },
        { data: { source: 'user2', target: 'work2', label: 'Authored' } },
        { data: { source: 'work1', target: 'val1', label: 'Reviewed' } },
        { data: { source: 'work2', target: 'val1', label: 'Reviewed' } },
        { data: { source: 'val1', target: 'port1', label: 'Published' } },
    ],
};

const TYPE_LABELS: Record<string, string> = {
    all: 'Semua Tipe',
    opportunity: 'Opportunity',
    student: 'Student',
    team: 'Team',
    work: 'Work',
    validation: 'Validation',
    portfolio: 'Portfolio',
};

// Use CSS custom properties for theme-aware graph colors
function getComputedToken(name: string): string {
    if (typeof document === 'undefined') {
        return '#526077';
    }

    return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
}

export default function LandingDemoGraph() {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [activeNode, setActiveNode] = useState<string | null>(null);
    const hasErrorRef = useRef(false);
    const [hasError, setHasError] = useState(false);

    // Reduced motion check
    const prefersReducedMotion = useMemo(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    const initGraph = useCallback(() => {
        if (!containerRef.current) {
            return;
        }

        // Read theme tokens at render time
        const primaryColor = getComputedToken('--primary') || '#1746B0';
        const foreground = getComputedToken('--foreground') || '#111827';
        const mutedFg = getComputedToken('--muted-foreground') || '#526077';
        const borderColor = getComputedToken('--border') || '#C7D0DF';
        const ringColor = getComputedToken('--ring') || '#1E5BD7';

        cyRef.current = cytoscape({
            container: containerRef.current,
            elements: SYNTHETIC_DATA,
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': primaryColor,
                        label: 'data(label)',
                        color: foreground,
                        'font-family':
                            'Familjen Grotesk, system-ui, sans-serif',
                        'font-size': '12px',
                        'text-valign': 'bottom',
                        'text-halign': 'center',
                        'text-margin-y': 6,
                    },
                },
                {
                    selector: 'node[type="opportunity"]',
                    style: { 'background-color': '#0e7490' },
                },
                {
                    selector: 'node[type="student"]',
                    style: { 'background-color': primaryColor },
                },
                {
                    selector: 'node[type="team"]',
                    style: {
                        'background-color':
                            getComputedToken('--verified') || '#16734A',
                    },
                },
                {
                    selector: 'node[type="work"]',
                    style: {
                        'background-color':
                            getComputedToken('--pending') || '#8A5100',
                    },
                },
                {
                    selector: 'node[type="validation"]',
                    style: {
                        'background-color':
                            getComputedToken('--verified') || '#16734A',
                    },
                },
                {
                    selector: 'node[type="portfolio"]',
                    style: {
                        'background-color':
                            getComputedToken('--correction') || '#B42318',
                    },
                },
                {
                    selector: 'edge',
                    style: {
                        width: 2,
                        'line-color': borderColor,
                        'target-arrow-color': borderColor,
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        label: 'data(label)',
                        'font-size': '10px',
                        color: mutedFg,
                        'text-rotation': 'autorotate',
                        'text-margin-y': -8,
                    },
                },
                {
                    selector: '.hidden',
                    style: { display: 'none' },
                },
                {
                    selector: '.highlighted',
                    style: {
                        'background-color': ringColor,
                        'border-width': 4,
                        'border-color': primaryColor,
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
                padding: 10,
                animate: !prefersReducedMotion,
                animationDuration: prefersReducedMotion ? 0 : 500,
            },
            userZoomingEnabled: false,
            userPanningEnabled: false,
            boxSelectionEnabled: false,
        });

        const cy = cyRef.current;

        cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            setActiveNode(node.data('id'));

            cy.elements().removeClass('highlighted');

            // Highlight node and its immediate neighborhood
            node.addClass('highlighted');
            node.connectedEdges().addClass('highlighted');
            node.neighborhood('node').addClass('highlighted');
        });

        cy.on('tap', (evt) => {
            if (evt.target === cy) {
                setActiveNode(null);
                cy.elements().removeClass('highlighted');
            }
        });
    }, [prefersReducedMotion]);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        try {
            initGraph();
        } catch {
            hasErrorRef.current = true;
            // Wrap in timeout to avoid synchronous setState in effect warning
            setTimeout(() => setHasError(true), 0);
        }

        return () => {
            cyRef.current?.destroy();
        };
    }, [initGraph]);

    // Handle filter
    useEffect(() => {
        if (!cyRef.current) {
            return;
        }

        const cy = cyRef.current;

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
            padding: 10,
            animate: !prefersReducedMotion,
            animationDuration: prefersReducedMotion ? 0 : 500,
        }).run();
    }, [selectedType, prefersReducedMotion]);

    const resetGraph = () => {
        setSelectedType('all');
        setActiveNode(null);

        if (cyRef.current) {
            cyRef.current.elements().removeClass('highlighted');
        }
    };

    const handleRetry = () => {
        setHasError(false);
        cyRef.current?.destroy();
        cyRef.current = null;
        initGraph();
    };

    const displayNodes = SYNTHETIC_DATA.nodes.filter(
        (n) => selectedType === 'all' || n.data.type === selectedType,
    );

    // Error state with retry
    if (hasError) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-12 text-center">
                <p className="text-sm font-medium text-foreground">
                    Demo graf tidak dapat dimuat.
                </p>
                <p className="text-sm text-muted-foreground">
                    Data Anda tetap aman. Coba muat ulang demo.
                </p>
                <button
                    onClick={handleRetry}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-4">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">
                            Graf Kolaborasi
                        </h3>
                        <p className="mt-1 flex items-center gap-2 font-label text-label tracking-[0.02em] text-muted-foreground">
                            <span className="inline-block h-2 w-2 rounded-full bg-pending" />
                            Data synthetic
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            aria-label="Filter tipe kolaborasi"
                            className="rounded-md border border-input bg-card py-1.5 pr-8 pl-3 text-xs text-foreground focus:border-primary focus:ring-primary"
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
                            onClick={resetGraph}
                            className="rounded-md bg-secondary px-3 py-1.5 text-xs text-secondary-foreground transition-colors hover:bg-accent"
                            aria-label="Reset graf"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Graph Canvas Region */}
                <div
                    ref={containerRef}
                    className="h-[300px] w-full bg-muted lg:h-[400px]"
                    aria-hidden="true"
                />
            </div>

            {/* Context Table (Equivalent Alternative) */}
            <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card lg:w-[320px]">
                <div className="border-b border-border p-4">
                    <h3 className="text-sm font-semibold text-foreground">
                        Ledger
                    </h3>
                    <p className="mt-1 font-label text-label tracking-[0.02em] text-muted-foreground">
                        Tabel riwayat kolaborasi (Data synthetic)
                    </p>
                </div>
                <div className="max-h-[300px] flex-1 overflow-y-auto p-0 lg:max-h-[400px]">
                    <table className="w-full text-left text-xs text-muted-foreground">
                        <thead className="sticky top-0 bg-muted">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-4 py-2 font-medium text-foreground"
                                >
                                    Node
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-2 font-medium text-foreground"
                                >
                                    Tipe
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {displayNodes.map((node) => (
                                <tr
                                    key={node.data.id}
                                    className={`transition-colors ${activeNode === node.data.id ? 'bg-primary/10' : 'hover:bg-muted'}`}
                                >
                                    <td className="px-4 py-2.5 font-medium text-foreground">
                                        {node.data.label}
                                    </td>
                                    <td className="px-4 py-2.5 capitalize">
                                        {node.data.type}
                                    </td>
                                </tr>
                            ))}
                            {displayNodes.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={2}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        Tidak ada data.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
