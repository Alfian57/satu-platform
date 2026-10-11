import { usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { getWorkspaceContext } from '@/lib/workspace-context';

export function NavUser() {
    const { auth } = usePage().props;
    const getInitials = useInitials();

    if (!auth.user) {
        return null;
    }

    const workspace = getWorkspaceContext(auth.user.workspace.role);
    const RoleIcon = workspace.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    aria-label={`Buka menu ${workspace.accountLabel} ${auth.user.name}`}
                    className="h-11 min-h-11 max-w-56 min-w-11 gap-2 rounded-lg border border-border bg-card px-2 text-foreground shadow-xs data-[state=open]:bg-accent"
                    data-test="user-menu-button"
                    variant="ghost"
                >
                    <span className="relative flex size-8 shrink-0">
                        <Avatar className="size-8">
                            <AvatarImage
                                src={auth.user.avatar}
                                alt={auth.user.name}
                            />
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                                {getInitials(auth.user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <span
                            aria-hidden="true"
                            className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground"
                        >
                            <RoleIcon className="size-2.5" />
                        </span>
                    </span>
                    <span className="hidden min-w-0 text-left lg:grid">
                        <span className="truncate text-sm leading-tight font-semibold">
                            {auth.user.name}
                        </span>
                        <span className="truncate text-xs leading-tight font-normal text-muted-foreground">
                            {workspace.accountLabel}
                        </span>
                    </span>
                    <ChevronDown
                        aria-hidden="true"
                        className="hidden size-4 shrink-0 text-muted-foreground lg:block"
                    />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border-border p-2 shadow-md"
                data-test="user-menu-content"
            >
                <UserMenuContent user={auth.user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
