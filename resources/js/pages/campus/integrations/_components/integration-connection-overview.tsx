import {
    CheckCircle2,
    Plus,
    ServerCog,
    ShieldAlert,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ConnectionItem } from '@/pages/campus/integrations/_types/integration-types';

interface IntegrationConnectionOverviewProps {
    connections: ConnectionItem[];
    onCreate?: () => void;
}

export function IntegrationConnectionOverview({
    connections,
    onCreate,
}: IntegrationConnectionOverviewProps) {
    return (
        <section
            aria-labelledby="connections-heading"
            className="@container min-w-0"
        >
            <h2 id="connections-heading" className="mb-3 text-lg font-bold">
                Koneksi akademik
            </h2>
            {connections.length === 0 ? (
                <div className="flex flex-wrap items-start gap-3 rounded-3xl border border-border bg-white p-5 shadow-sm">
                    <ServerCog
                        aria-hidden="true"
                        className="mt-1 size-5 shrink-0 text-primary"
                    />
                    <div>
                        <h3 className="font-semibold">
                            Belum ada koneksi akademik
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Status sinkronisasi tersedia setelah koneksi kampus
                            dikonfigurasi melalui alur yang diizinkan. Buat
                            koneksi sandbox secara eksplisit untuk uji coba;
                            pembacaan halaman tidak membuat data baru.
                        </p>
                    </div>
                    {onCreate && (
                        <Button
                            type="button"
                            size="sm"
                            onClick={onCreate}
                            className="min-h-11 shrink-0 gap-1.5"
                        >
                            <Plus aria-hidden="true" className="size-4" />
                            Buat Koneksi Sandbox
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-3 @min-[42rem]:grid-cols-2 @min-[72rem]:grid-cols-3">
                    {connections.map((connection) => (
                        <article
                            key={connection.id}
                            className="min-w-0 rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-3">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                                        <ServerCog
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </span>
                                    <div className="min-w-0">
                                        <h3 className="font-bold wrap-anywhere">
                                            {connection.provider_key}
                                        </h3>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {connection.sync_count} sinkronisasi
                                            tercatat
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                                        connection.mode === 'sandbox'
                                            ? 'border-pending/30 bg-pending-subtle text-pending-subtle-foreground'
                                            : 'border-primary/15 bg-accent text-primary',
                                    )}
                                >
                                    <Sparkles
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    {connection.mode === 'sandbox'
                                        ? 'Sandbox (uji coba)'
                                        : connection.mode_label}
                                </span>
                            </div>
                            <p className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
                                {connection.status === 'connected' ? (
                                    <CheckCircle2
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-verified"
                                    />
                                ) : (
                                    <ShieldAlert
                                        aria-hidden="true"
                                        className="size-4 shrink-0 text-pending-subtle-foreground"
                                    />
                                )}
                                {connection.status_label}
                            </p>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
