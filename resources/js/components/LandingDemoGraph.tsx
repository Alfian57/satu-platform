import cytoscape from 'cytoscape';
import React, { useEffect, useRef, useState, useMemo } from 'react';

// "Data synthetic" dummy data for the graph
const SYNTHETIC_DATA = {
    nodes: [
        {
            data: {
                id: 'opp1',
                label: 'Opportunity: Hackathon',
                type: 'opportunity',
            },
        },
        { data: { id: 'user1', label: 'Student: Budi', type: 'student' } },
        { data: { id: 'user2', label: 'Student: Siti', type: 'student' } },
        { data: { id: 'team1', label: 'Team: Alpha', type: 'team' } },
        { data: { id: 'work1', label: 'Work: Frontend UI', type: 'work' } },
        { data: { id: 'work2', label: 'Work: Backend API', type: 'work' } },
        {
            data: {
                id: 'val1',
                label: 'Validation: Verified',
                type: 'validation',
            },
        },
        {
            data: {
                id: 'port1',
                label: 'Portfolio: Budi UI/UX',
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

export default function LandingDemoGraph() {
    const containerRef = useRef<HTMLDivElement>(null);
    const cyRef = useRef<cytoscape.Core | null>(null);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [activeNode, setActiveNode] = useState<string | null>(null);

    // Reduced motion check
    const prefersReducedMotion = useMemo(() => {
        if (typeof window === 'undefined') {
return false;
}

        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    useEffect(() => {
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
                        'background-color': '#f53003',
                        label: 'data(label)',
                        color: '#1b1b18',
                        'font-family': 'Familjen Grotesk, sans-serif',
                        'font-size': '12px',
                        'text-valign': 'bottom',
                        'text-halign': 'center',
                        'text-margin-y': 6,
                    },
                },
                {
                    selector: 'node[type="opportunity"]',
                    style: { 'background-color': '#0ea5e9' },
                },
                {
                    selector: 'node[type="student"]',
                    style: { 'background-color': '#8b5cf6' },
                },
                {
                    selector: 'node[type="team"]',
                    style: { 'background-color': '#10b981' },
                },
                {
                    selector: 'node[type="work"]',
                    style: { 'background-color': '#f59e0b' },
                },
                {
                    selector: 'node[type="validation"]',
                    style: { 'background-color': '#3b82f6' },
                },
                {
                    selector: 'node[type="portfolio"]',
                    style: { 'background-color': '#f43f5e' },
                },
                {
                    selector: 'edge',
                    style: {
                        width: 2,
                        'line-color': '#e5e7eb',
                        'target-arrow-color': '#e5e7eb',
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        label: 'data(label)',
                        'font-size': '10px',
                        color: '#6b7280',
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
                        'background-color': '#f53003',
                        'border-width': 4,
                        'border-color': '#fca5a5',
                    },
                },
                {
                    selector: 'edge.highlighted',
                    style: {
                        'line-color': '#f53003',
                        'target-arrow-color': '#f53003',
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

        return () => {
            cy.destroy();
        };
    }, [prefersReducedMotion]);

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

    const displayNodes = SYNTHETIC_DATA.nodes.filter(
        (n) => selectedType === 'all' || n.data.type === selectedType,
    );

    return (
        <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#161615]">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 p-4 dark:border-neutral-800">
                    <div>
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            Collaboration Graph Demo
                        </h3>
                        <p className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                            <span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
                            Data synthetic
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            aria-label="Filter collaboration type"
                            className="rounded-md border-neutral-300 bg-white py-1.5 pr-8 pl-3 text-xs focus:border-primary focus:ring-primary dark:border-neutral-700 dark:bg-neutral-900"
                        >
                            <option value="all">Semua Tipe</option>
                            <option value="opportunity">Opportunity</option>
                            <option value="student">Student</option>
                            <option value="team">Team</option>
                            <option value="work">Work</option>
                            <option value="validation">Validation</option>
                            <option value="portfolio">Portfolio</option>
                        </select>
                        <button
                            onClick={resetGraph}
                            className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                            aria-label="Reset graph"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Graph Canvas Region */}
                <div
                    ref={containerRef}
                    className="h-[300px] w-full bg-slate-50 lg:h-[400px] dark:bg-neutral-900/50"
                    aria-hidden="true"
                />
            </div>

            {/* Context Table (Equivalent Alternative) */}
            <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm lg:w-[320px] dark:border-neutral-800 dark:bg-[#161615]">
                <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        Ledger
                    </h3>
                    <p className="mt-1 text-xs text-neutral-500">
                        Tabel riwayat kolaborasi (Data synthetic)
                    </p>
                </div>
                <div className="max-h-[300px] flex-1 overflow-y-auto p-0 lg:max-h-[400px]">
                    <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-400">
                        <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-900/80">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-4 py-2 font-medium"
                                >
                                    Node
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-2 font-medium"
                                >
                                    Tipe
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {displayNodes.map((node) => (
                                <tr
                                    key={node.data.id}
                                    className={`transition-colors ${activeNode === node.data.id ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}
                                >
                                    <td className="px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-200">
                                        {node.data.label.split(': ')[1]}
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
                                        className="px-4 py-8 text-center text-neutral-500"
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
