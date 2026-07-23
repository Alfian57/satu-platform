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

export function NavUser() {
    const { auth } = usePage().props;
    const getInitials = useInitials();

    if (!auth.user) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    aria-label={`Buka menu akun ${auth.user.name}`}
                    className="h-control-lg min-h-control-lg max-w-56 min-w-control-lg gap-2 rounded-sm px-2 md:h-control-md md:min-h-control-md"
                    data-test="user-menu-button"
                    variant="ghost"
                >
                    <Avatar className="size-8 shrink-0">
                        <AvatarImage
                            src={auth.user.avatar}
                            alt={auth.user.name}
                        />
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                            {getInitials(auth.user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden min-w-0 text-left lg:grid">
                        <span className="truncate text-sm leading-tight font-semibold">
                            {auth.user.name}
                        </span>
                        <span className="truncate text-xs leading-tight font-normal text-muted-foreground">
                            Akun mahasiswa
                        </span>
                    </span>
                    <ChevronDown
                        aria-hidden="true"
                        className="hidden size-4 shrink-0 text-muted-foreground lg:block"
                    />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <UserMenuContent user={auth.user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
