import { DashboardArchiveArt as ArchiveArt } from '@/components/dashboard-archive-art';
import type { EditorMode } from './editor-utils';

type Props = {
    mode: EditorMode;
    institutionName: string;
};

export function ProjectEditorHeader({ mode, institutionName }: Props) {
    return (
        <header className="relative isolate grid min-w-0 gap-3 overflow-hidden rounded-4xl border border-white bg-linear-to-br from-accent to-sky-100 p-5 shadow-md sm:p-7 lg:pr-48">
            <ArchiveArt className="absolute top-5 right-5 -z-10 hidden w-36 -rotate-6 opacity-55 lg:block" />
            <p className="font-label text-label text-primary">
                {mode === 'create' ? 'Proyek baru' : 'Ubah proyek'} /{' '}
                {institutionName}
            </p>
            <h1 className="max-w-[28ch] text-2xl leading-snug font-bold tracking-tight wrap-anywhere sm:text-3xl">
                {mode === 'create'
                    ? 'Mulai ide baru bersama timmu.'
                    : 'Rapikan kebutuhan proyekmu.'}
            </h1>
            <p className="max-w-[70ch] text-body text-muted-foreground">
                Isi kebutuhan peran, kapasitas, visibilitas, dan batas waktu.
                Informasi ini membantu mahasiswa memahami peluang kolaborasi
                sebelum mengambil tindakan.
            </p>
        </header>
    );
}
