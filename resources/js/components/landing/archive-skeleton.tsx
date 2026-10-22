import { Skeleton } from '@/components/ui/skeleton';
import { DEMO_KIND_LABELS } from '@/lib/landing-demo';
import type { DemoNode } from '@/lib/landing-demo';

export default function ArchiveSkeleton({ node }: { node: DemoNode }) {
    return (
        <div
            className={`collaboration-node ${node.kind === 'student' ? 'collaboration-node--member' : ''}`}
        >
            <div className="collaboration-node-button">
                <Skeleton className="collaboration-node-icon bg-satu-blue-soft" />
                <span className="collaboration-node-kind rounded bg-satu-blue-soft text-transparent">
                    {DEMO_KIND_LABELS[node.kind]}
                </span>
                <span className="collaboration-node-title rounded bg-satu-blue-soft text-transparent">
                    {node.label}
                </span>
                <span className="collaboration-node-caption rounded bg-satu-blue-soft text-transparent">
                    {node.caption}
                </span>
                <span className="collaboration-node-status text-transparent">
                    Arsip contoh
                </span>
            </div>
            <span className="collaboration-node-footnote">
                <Skeleton className="h-4 w-24 bg-satu-blue-soft" />
            </span>
        </div>
    );
}
