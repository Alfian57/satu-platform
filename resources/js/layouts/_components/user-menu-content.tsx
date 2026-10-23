import { Link, router } from '@inertiajs/react';
import { LogOut, Settings, UserRoundCog } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useMobileNavigation } from '@/layouts/_hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import { edit as editCapabilities } from '@/routes/student-profiles';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuGroup>
                {user.workspace.role === 'student' && (
                    <DropdownMenuItem
                        asChild
                        className="min-h-11 cursor-pointer rounded-xl px-3"
                    >
                        <Link
                            className="flex w-full cursor-pointer items-center"
                            href={editCapabilities()}
                            onClick={cleanup}
                        >
                            <UserRoundCog className="mr-2" aria-hidden="true" />
                            Profil kemampuan
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem
                    asChild
                    className="min-h-11 cursor-pointer rounded-xl px-3"
                >
                    <Link
                        className="flex w-full cursor-pointer items-center"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2" />
                        Pengaturan akun
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                asChild
                className="min-h-11 cursor-pointer rounded-xl px-3 text-correction focus:text-correction"
            >
                <Link
                    className="flex w-full cursor-pointer items-center"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    Keluar
                </Link>
            </DropdownMenuItem>
        </>
    );
}
