import { Check, FileText } from 'lucide-react';
import RelationText from '@/components/landing/relation-text';
import { DEMO_ICONS } from '@/components/landing-collaboration-map';
import { DEMO_KIND_LABELS } from '@/lib/landing-demo';
import type { DemoNode } from '@/lib/landing-demo';

export interface DemoRelationsTableProps {
    displayedNodes: DemoNode[];
    selectedId: string | null;
    onSelectNode: (id: string) => void;
}

export default function DemoRelationsTable({
    displayedNodes,
    selectedId,
    onSelectNode,
}: DemoRelationsTableProps) {
    return (
        <div className="collaboration-ledger" aria-labelledby="ledger-heading">
            <div className="collaboration-ledger-heading">
                <div>
                    <h3 id="ledger-heading" className="text-lg font-bold">
                        Daftar hubungan
                    </h3>
                    <p className="mt-1 text-sm text-satu-muted">
                        {displayedNodes.length} arsip synthetic. Hubungan sama
                        dengan peta.
                    </p>
                </div>
                <FileText
                    aria-hidden="true"
                    className="size-6 text-satu-blue"
                />
            </div>
            <table className="collaboration-table">
                <caption className="sr-only">
                    Arsip dan hubungan graf kolaborasi synthetic SATU
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
                                    selectedId === node.id || undefined
                                }
                            >
                                <th scope="row">
                                    <button
                                        type="button"
                                        aria-pressed={selectedId === node.id}
                                        aria-controls="demo-node-detail"
                                        className="collaboration-table-button cursor-pointer"
                                        onClick={() => onSelectNode(node.id)}
                                    >
                                        <span className="flex items-center gap-2 text-xs font-semibold text-satu-blue-hover">
                                            <Icon
                                                aria-hidden="true"
                                                className="size-4 shrink-0"
                                            />
                                            {DEMO_KIND_LABELS[node.kind]}
                                        </span>
                                        <span className="mt-2 text-sm leading-6 font-bold">
                                            {node.label}
                                        </span>
                                        <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-satu-muted">
                                            {selectedId === node.id && (
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
    );
}
