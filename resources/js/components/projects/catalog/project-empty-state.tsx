import { Button } from '@/components/ui/button';

export function ProjectEmptyState({
    onReset,
    isMine,
    onExplore,
}: {
    onReset: () => void;
    isMine: boolean;
    onExplore: () => void;
}) {
    return (
        <section
            data-test="projects-empty"
            className="project-discovery-empty grid justify-items-center gap-4 rounded-xl border border-dashed border-primary/25 px-5 py-8 text-center"
        >
            <img
                src="/images/dashboard-project-folder.webp"
                srcSet="/images/dashboard-project-folder-128.webp 128w, /images/dashboard-project-folder.webp 256w"
                sizes="96px"
                width={256}
                height={256}
                alt=""
                aria-hidden="true"
                className="size-24 object-contain"
                loading="lazy"
                decoding="async"
            />
            <div className="grid max-w-lg gap-2">
                <h3 className="text-title font-semibold">
                    {isMine
                        ? 'Belum ada proyek saya yang cocok'
                        : 'Belum ada proyek yang cocok'}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                    {isMine
                        ? 'Proyek yang kamu kelola atau tim yang masih kamu ikuti akan muncul di sini. Coba atur ulang filter, atau temukan peluang untuk mulai bergabung.'
                        : 'Coba ubah kata pencarian atau longgarkan filter status dan visibilitas untuk melihat peluang kolaborasi lain.'}
                </p>
            </div>
            <Button
                type="button"
                variant="outline"
                onClick={onReset}
                data-test="projects-reset-empty"
            >
                Atur ulang filter
            </Button>
            {isMine && (
                <Button type="button" onClick={onExplore}>
                    Temukan peluang
                </Button>
            )}
        </section>
    );
}
