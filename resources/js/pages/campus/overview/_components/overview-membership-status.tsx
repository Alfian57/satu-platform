import { CheckCircle2, Clock3, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OverviewMembershipStatus({ status }: { status: string }) {
    const meta =
        status === 'verified'
            ? {
                  label: 'Terverifikasi',
                  Icon: CheckCircle2,
                  className:
                      'border-verified/20 bg-verified-subtle text-verified-subtle-foreground',
              }
            : status === 'pending'
              ? {
                    label: 'Menunggu tinjauan',
                    Icon: Clock3,
                    className:
                        'border-pending/20 bg-pending-subtle text-pending-subtle-foreground',
                }
              : status === 'suspended'
                ? {
                      label: 'Ditangguhkan',
                      Icon: XCircle,
                      className:
                          'border-correction/20 bg-correction-subtle text-correction-subtle-foreground',
                  }
                : {
                      label:
                          status === 'unverified'
                              ? 'Belum terverifikasi'
                              : 'Status belum tersedia',
                      Icon: Info,
                      className:
                          'border-border bg-background text-muted-foreground',
                  };

    return (
        <span
            className={cn(
                'inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs leading-5 font-semibold',
                meta.className,
            )}
        >
            <meta.Icon aria-hidden="true" className="size-3.5 shrink-0" />
            {meta.label}
        </span>
    );
}
