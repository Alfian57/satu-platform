import { Head } from '@inertiajs/react';
import { ProjectEditor } from '@/components/projects/project-editor';
import { index as projectsIndex } from '@/routes/projects';

type ProjectCreateProps = {
    institution: {
        id: number;
        name: string;
    };
};

export default function ProjectCreate({ institution }: ProjectCreateProps) {
    return (
        <>
            <Head title="Buat project" />
            <ProjectEditor mode="create" institution={institution} />
        </>
    );
}

ProjectCreate.layout = {
    breadcrumbs: [
        {
            title: 'Project discovery',
            href: projectsIndex(),
        },
        {
            title: 'Buat project',
        },
    ],
};
