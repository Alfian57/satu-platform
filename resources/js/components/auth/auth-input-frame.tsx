import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export default function AuthInputFrame({
    icon: Icon,
    children,
}: {
    icon: LucideIcon;
    children: ReactNode;
}) {
    return (
        <div className="auth-input-frame">
            <Icon aria-hidden="true" className="auth-input-icon" />
            {children}
        </div>
    );
}
