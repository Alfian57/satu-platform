import { ArrowRight, Check, Link2 } from 'lucide-react';
import { DEMO_ICONS } from '@/components/landing-collaboration-map';
import { DEMO_KIND_LABELS } from '@/lib/landing-demo';
import type { DemoKind, DemoNode } from '@/lib/landing-demo';
import { cn } from '@/lib/utils';

export interface ArchiveNodeProps {
    node: DemoNode;
    index?: number;
    selectedId: string | null;
    relatedIds: ReadonlySet<string>;
    focusedKind: DemoKind | 'all';
    onSelect: (id: string) => void;
}

export default function ArchiveNode({
    node,
    index,
    selectedId,
    relatedIds,
    focusedKind,
    onSelect,
}: ArchiveNodeProps) {
    const selected = selectedId === node.id;
    const related = !selected && relatedIds.has(node.id);
    const focused = focusedKind !== 'all' && node.kind === focusedKind;
    const Icon = DEMO_ICONS[node.kind];

    return (
        <article
            className={cn(
                'collaboration-node',
                node.kind === 'student' && 'collaboration-node--member',
            )}
            data-demo-node-box={node.id}
            data-selected={selected || undefined}
            data-related={related || undefined}
            data-focused={focused || undefined}
        >
            <button
                type="button"
                className="collaboration-node-button cursor-pointer"
                aria-label={`Pilih arsip ${DEMO_KIND_LABELS[node.kind]}: ${node.label}`}
                aria-pressed={selected}
                aria-controls="demo-node-detail"
                data-demo-node={node.id}
                onClick={() => onSelect(node.id)}
            >
                <span className="collaboration-node-icon" aria-hidden="true">
                    {node.initial ? (
                        <span className="text-xl font-bold">
                            {node.initial}
                        </span>
                    ) : (
                        <Icon className="size-6" />
                    )}
                </span>
                {index !== undefined && (
                    <span
                        aria-hidden="true"
                        className="collaboration-node-index font-label"
                    >
                        {String(index + 1).padStart(2, '0')}
                    </span>
                )}
                <span className="collaboration-node-kind">
                    {DEMO_KIND_LABELS[node.kind]}
                </span>
                <span className="collaboration-node-title">{node.label}</span>
                <span className="collaboration-node-caption">
                    {node.caption}
                </span>
                <span className="collaboration-node-status">
                    {selected ? (
                        <>
                            <Check aria-hidden="true" className="size-3.5" />
                            Dipilih
                        </>
                    ) : related ? (
                        <>
                            <Link2 aria-hidden="true" className="size-3.5" />
                            Terhubung
                        </>
                    ) : focused ? (
                        'Tahap difokuskan'
                    ) : (
                        'Arsip contoh'
                    )}
                </span>
            </button>
            {selected ? (
                <a
                    href="#demo-node-detail"
                    className="collaboration-node-inspect cursor-pointer"
                    onClick={() =>
                        document
                            .getElementById('demo-node-detail')
                            ?.focus({ preventScroll: true })
                    }
                >
                    Rincian
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                </a>
            ) : (
                <span
                    aria-hidden="true"
                    className="collaboration-node-footnote"
                >
                    {node.kind === 'student'
                        ? 'Anggota tim contoh'
                        : 'Pilih untuk menjelajahi'}
                </span>
            )}
        </article>
    );
}
