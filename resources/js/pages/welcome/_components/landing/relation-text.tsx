import {
    getDemoNode,
    getDemoRelations,
} from '@/pages/welcome/_utils/landing-demo';

export default function RelationText({ id }: { id: string }) {
    return (
        <ul className="space-y-2">
            {getDemoRelations(id).map((edge) => (
                <li key={edge.id} className="text-sm leading-6 text-satu-muted">
                    <span className="font-semibold text-satu-ink">
                        {getDemoNode(edge.source)?.label}
                    </span>{' '}
                    {edge.label}{' '}
                    <span className="font-semibold text-satu-ink">
                        {getDemoNode(edge.target)?.label}
                    </span>
                    .
                </li>
            ))}
        </ul>
    );
}
