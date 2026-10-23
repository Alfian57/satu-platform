import { CampusAffiliationsContent } from '@/pages/campus/affiliations/_components/campus-affiliations-content';
import type { CampusAffiliationsProps } from '@/pages/campus/affiliations/_types/affiliation-types';

export default function CampusAffiliations(props: CampusAffiliationsProps) {
    return <CampusAffiliationsContent key={props.institution.id} {...props} />;
}

CampusAffiliations.layout = {
    breadcrumbs: [
        { title: 'Operasi kampus', href: '#' },
        { title: 'Afiliasi kampus', href: '#' },
    ],
};
