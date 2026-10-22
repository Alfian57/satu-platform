import {
    BookOpen,
    FileText,
    FolderOpen,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import ArchiveNode from '@/components/landing/archive-node';
import {
    createDemoConnector,
    DEMO_EDGES,
    DEMO_NODES,
    getDemoNode,
    getDemoRelatedIds,
} from '@/lib/landing-demo';
import type { DemoBox, DemoKind } from '@/lib/landing-demo';
import { SATU_COLORS } from '@/lib/tokens';

export const DEMO_ICONS = {
    opportunity: FolderOpen,
    team: UsersRound,
    work: FileText,
    validation: ShieldCheck,
    portfolio: BookOpen,
    student: UsersRound,
};

export type MapProps = {
    selectedId: string | null;
    focusedKind: DemoKind | 'all';
    onSelect: (id: string) => void;
};

export default function LandingCollaborationMap({
    selectedId,
    focusedKind,
    onSelect,
}: MapProps) {
    const boardRef = useRef<HTMLDivElement>(null);
    const [paths, setPaths] = useState<{ id: string; d: string }[]>([]);
    const markerId = `demo-arrow-${useId().replace(/\W/g, '')}`;
    const relatedIds = getDemoRelatedIds(selectedId);

    useEffect(() => {
        const board = boardRef.current;

        if (!board) {
            return;
        }

        let frame = 0;
        let mounted = true;

        function measure() {
            if (!mounted || !board) {
                return;
            }

            const bounds = board.getBoundingClientRect();
            const boxes = new Map<string, DemoBox>();
            board
                .querySelectorAll<HTMLElement>('[data-demo-node-box]')
                .forEach((element) => {
                    const rect = element.getBoundingClientRect();
                    boxes.set(element.dataset.demoNodeBox!, {
                        left: rect.left - bounds.left,
                        top: rect.top - bounds.top,
                        width: rect.width,
                        height: rect.height,
                    });
                });

            const next = DEMO_EDGES.flatMap((edge) => {
                const source = boxes.get(edge.source);
                const target = boxes.get(edge.target);

                return source && target
                    ? [
                          {
                              id: edge.id,
                              d: createDemoConnector(
                                  source,
                                  target,
                                  getDemoNode(edge.source)?.kind === 'student',
                              ),
                          },
                      ]
                    : [];
            });

            setPaths((current) =>
                JSON.stringify(current) === JSON.stringify(next)
                    ? current
                    : next,
            );
        }

        function schedule() {
            if (!mounted) {
                return;
            }

            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        }

        const observer =
            typeof ResizeObserver !== 'undefined'
                ? new ResizeObserver(schedule)
                : null;

        observer?.observe(board);
        board
            .querySelectorAll('[data-demo-node-box]')
            .forEach((element) => observer?.observe(element));

        window.addEventListener('resize', schedule);
        document.fonts?.ready.then(schedule);
        schedule();

        return () => {
            mounted = false;
            observer?.disconnect();
            window.removeEventListener('resize', schedule);
            cancelAnimationFrame(frame);
        };
    }, []);

    const members = DEMO_NODES.filter((node) => node.kind === 'student');
    const main = DEMO_NODES.filter((node) => node.kind !== 'student');

    return (
        <div
            className="collaboration-map-container"
            data-testid="landing-graph-canvas"
            role="region"
            aria-label="Peta kolaborasi yang dapat digulir"
            tabIndex={0}
        >
            <div
                ref={boardRef}
                className="collaboration-board"
                role="group"
                aria-label="Peta kolaborasi dengan anggota tim dan kontribusi Budi"
                aria-describedby="demo-map-description"
            >
                <svg
                    aria-hidden="true"
                    focusable="false"
                    className="collaboration-connectors"
                >
                    <defs>
                        {['quiet', 'active'].map((state) => (
                            <marker
                                key={state}
                                id={`${markerId}-${state}`}
                                markerWidth="8"
                                markerHeight="8"
                                refX="7"
                                refY="4"
                                orient="auto"
                                markerUnits="userSpaceOnUse"
                            >
                                <path
                                    d="M1 1L7 4L1 7"
                                    fill="none"
                                    stroke={
                                        state === 'active'
                                            ? SATU_COLORS.primary
                                            : SATU_COLORS.input
                                    }
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </marker>
                        ))}
                    </defs>
                    {paths.map((path) => {
                        const edge = DEMO_EDGES.find(
                            (item) => item.id === path.id,
                        )!;
                        const active =
                            edge.source === selectedId ||
                            edge.target === selectedId;

                        return (
                            <path
                                key={path.id}
                                d={path.d}
                                className={
                                    active
                                        ? 'collaboration-connector collaboration-connector--active'
                                        : 'collaboration-connector'
                                }
                                markerEnd={`url(#${markerId}-${active ? 'active' : 'quiet'})`}
                                data-demo-edge={path.id}
                                data-active={active || undefined}
                            />
                        );
                    })}
                </svg>
                <div className="collaboration-map-grid">
                    {main.map((node, index) => (
                        <div
                            key={node.id}
                            className={`collaboration-main-node collaboration-main-node--${index + 1}`}
                        >
                            <ArchiveNode
                                node={node}
                                index={index}
                                selectedId={selectedId}
                                relatedIds={relatedIds}
                                focusedKind={focusedKind}
                                onSelect={onSelect}
                            />
                            {node.kind === 'team' && (
                                <div
                                    className="collaboration-members"
                                    role="group"
                                    aria-label="Anggota Tim Pustaka"
                                >
                                    {members.map((member) => (
                                        <ArchiveNode
                                            key={member.id}
                                            node={member}
                                            selectedId={selectedId}
                                            relatedIds={relatedIds}
                                            focusedKind={focusedKind}
                                            onSelect={onSelect}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
