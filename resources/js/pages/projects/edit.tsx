import { Head } from '@inertiajs/react';
import { ProjectEditor } from '@/components/projects/project-editor';
import { index as projectsIndex } from '@/routes/projects';
import type { ProjectDetail } from '@/types/project';

type ProjectEditProps = {
    project: ProjectDetail;
};

export default function ProjectEdit({ project }: ProjectEditProps) {
    return (
        <>
            <Head title={`Edit ${project.title}`} />
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
            title: 'Project discovery',
            href: projectsIndex(),
        },
        {
            title: 'Edit project',
        },
    ],
};
