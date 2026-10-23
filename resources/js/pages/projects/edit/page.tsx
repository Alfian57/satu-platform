import { Head } from '@inertiajs/react';
import { ProjectEditor } from '@/pages/projects/_components/project-editor';
import { index as projectsIndex } from '@/routes/projects';
import type { ProjectDetail } from '@/types/project';

type ProjectEditProps = {
    project: ProjectDetail;
};

export default function ProjectEdit({ project }: ProjectEditProps) {
    return (
        <>
            <Head title={`Ubah ${project.title}`} />
            <ProjectEditor
                mode="edit"
                institution={project.institution}
                project={project}
            />
        </>
    );
}

ProjectEdit.layout = {
    breadcrumbs: [
        {
            title: 'Penemuan proyek',
            href: projectsIndex(),
        },
        {
            title: 'Ubah proyek',
        },
    ],
};
