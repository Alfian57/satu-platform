import { Head } from '@inertiajs/react';
import { ProjectEditor } from '@/pages/projects/_components/project-editor';
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
            <Head title="Buat proyek" />
            <ProjectEditor mode="create" institution={institution} />
        </>
    );
}

ProjectCreate.layout = {
    breadcrumbs: [
        {
            title: 'Penemuan proyek',
            href: projectsIndex(),
        },
        {
            title: 'Buat proyek',
        },
    ],
};
