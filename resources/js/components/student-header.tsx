import { AppHeader } from '@/components/app-header';
import { StudentMenuTourTrigger } from '@/components/student-menu-tour';
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
