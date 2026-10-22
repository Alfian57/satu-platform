import { Eye, Keyboard, Sun } from 'lucide-react';

export function AppearancePreview() {
    return (
        <figure className="grid min-w-0 gap-4">
            <div
                aria-hidden="true"
                className="grid min-w-0 gap-4 rounded-2xl border border-border bg-background p-4 sm:p-6"
                data-test="appearance-preview"
            >
                <div className="flex items-center gap-2 border-b border-border pb-3">
                    <span className="grid size-8 place-items-center rounded-xl bg-accent text-primary">
                        <Sun className="size-4" />
                    </span>
                    <span className="text-sm font-semibold">SATU</span>
                    <span className="ml-auto rounded-full border border-border bg-card px-2 py-1 text-xs text-muted-foreground">
                        Ruang kerja
                    </span>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-accent to-card p-5">
                    <span className="absolute -top-5 -right-5 size-20 rounded-full border-8 border-satu-orange/25 ring-4 ring-satu-orange/15" />
                    <p className="text-xs font-medium text-primary">
                        Buku Besar Kolaborasi
                    </p>
                    <p className="mt-2 text-title font-semibold">
                        Ruang yang nyaman untuk berkarya.
                    </p>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">
                        Informasi utama mendapat ruang. Detail tetap mudah
                        dibaca.
                    </p>
                </div>
                <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <Eye className="size-5 text-satu-orange-ink" />
                        <p className="mt-3 text-sm font-semibold">
                            Hierarki yang jelas
                        </p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            Judul, penjelasan, dan status dibedakan.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <Keyboard className="size-5 text-primary" />
                        <p className="mt-3 text-sm font-semibold">
                            Fokus yang terlihat
                        </p>
                        <div className="mt-3 w-fit rounded-xl border-2 border-ring bg-accent px-3 py-2 text-xs text-primary">
                            Contoh penanda fokus
                        </div>
                    </div>
                </div>
            </div>
            <figcaption className="text-xs leading-6 text-muted-foreground">
                Pratinjau gaya visual SATU, bukan data akun atau halaman yang
                dapat dioperasikan.
            </figcaption>
        </figure>
    );
}
