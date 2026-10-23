import { StudentMenuTourTrigger } from '@/components/student-tour';
import { AppHeader } from '@/layouts/_components/app-header';
import type { BreadcrumbItem } from '@/types';

export function StudentHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItem[];
}) {
    return (
        <AppHeader breadcrumbs={breadcrumbs}>
            <StudentMenuTourTrigger />
        </AppHeader>
    );
}
