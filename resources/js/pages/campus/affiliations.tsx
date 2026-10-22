import type { CampusAffiliationsProps } from '@/components/campus/affiliations/affiliation-types';
import { CampusAffiliationsContent } from '@/components/campus/affiliations/campus-affiliations-content';

export default function CampusAffiliations(props: CampusAffiliationsProps) {
    return <CampusAffiliationsContent key={props.institution.id} {...props} />;
}

CampusAffiliations.layout = {
    breadcrumbs: [
        { title: 'Operasi kampus', href: '#' },
        { title: 'Afiliasi kampus', href: '#' },
    ],
};
