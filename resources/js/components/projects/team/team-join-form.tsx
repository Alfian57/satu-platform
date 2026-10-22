import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { beginnerLabel, capacityLabel } from '@/lib/project-opportunities';
import type { ProjectRole, TeamFormationState } from '@/types/project';
import { TeamCriteriaCard } from './team-criteria-card';
import { firstError, textAreaClass } from './team-utils';
import type { Application } from './team-utils';

type Props = {
    roles: ProjectRole[];
    capacity: TeamFormationState['capacity'];
    canRequestJoin: boolean;
    data: Application;
    errors: Record<string, unknown>;
    blocked: boolean;
    processing: boolean;
    selectedRole?: ProjectRole;
    onChangeField: (
        field: keyof Application,
        value: string | number | null,
    ) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const inputFields = [
    [
        'interest',
        'Minat yang ingin kamu bantu',
        200,
        'Contoh: Membantu merancang tampilan proyek kampus.',
    ],
    [
        'skills',
        'Kemampuan relevan atau hal yang ingin dipelajari',
        350,
        'Contoh: Dasar Figma. Ingin belajar riset kebutuhan bersama tim.',
    ],
    [
        'availability',
        'Ketersediaan singkat',
        250,
        'Contoh: Selasa dan Kamis sore, sekitar 3 jam per minggu.',
    ],
] as const;

export function TeamJoinForm({
    roles,
    capacity,
    canRequestJoin,
    data,
    errors,
    blocked,
    processing,
    selectedRole,
    onChangeField,
    onSubmit,
}: Props) {
    if (!canRequestJoin) {
        return (
            <p
                role="status"
                className="flex gap-2 text-sm leading-6 text-muted-foreground"
            >
                <CircleAlert
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0"
                />
                <span>
                    {capacity.is_full
                        ? 'Kapasitas tim sedang penuh. Periksa kembali setelah tersedia tempat atau cari peluang lain.'
                        : 'Proyek tidak dapat menerima pengajuan dari akunmu saat ini.'}
                </span>
            </p>
        );
    }

    return (
        <form
            id="team-join-request-form"
            tabIndex={-1}
            onSubmit={onSubmit}
            data-test="team-join-request-form"
            className="grid min-w-0 scroll-mt-24 gap-4 rounded-2xl border border-primary/20 bg-background/65 p-4 sm:p-5"
        >
            <div className="grid gap-2 border-b border-border pb-3">
                <h3 className="text-title font-semibold">
                    Ajukan minat, tidak perlu promosi diri
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                    Jawaban singkat cukup. Kamu tidak wajib memiliki karya atau
                    riwayat kolaborasi. Ringkasan ini hanya dibaca olehmu dan
                    pemilik proyek, bukan anggota lain. Bukti privat profil
                    tidak ikut dibagikan.
                </p>
            </div>
            <fieldset
                disabled={blocked}
                className="grid min-w-0 gap-4 disabled:opacity-70"
            >
                <div className="grid gap-2">
                    <Label htmlFor="team-request-role">
                        Peran yang diminati (opsional)
                    </Label>
                    <Select
                        value={data.project_role_id?.toString() ?? 'none'}
                        disabled={blocked}
                        onValueChange={(value) =>
                            onChangeField(
                                'project_role_id',
                                value === 'none' ? null : Number(value),
                            )
                        }
                    >
                        <SelectTrigger
                            id="team-request-role"
                            aria-invalid={Boolean(errors.project_role_id)}
                            className="min-h-11 w-full min-w-0 cursor-pointer py-3 text-left data-[size=default]:h-auto [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:wrap-anywhere [&_[data-slot=select-value]]:whitespace-normal"
                        >
                            <SelectValue placeholder="Pilih peran" />
                        </SelectTrigger>
                        <SelectContent
                            avoidCollisions
                            className="w-(--radix-select-trigger-width) max-w-[calc(100vw-2rem)]"
                        >
                            <SelectItem
                                value="none"
                                className="min-h-11 cursor-pointer"
                            >
                                Peran umum
                            </SelectItem>
                            {roles.map((role) => (
                                <SelectItem
                                    key={role.id}
                                    value={String(role.id)}
                                    disabled={
                                        role.capacity_stats?.accepting === false
                                    }
                                    className="min-h-11 cursor-pointer [&_span]:wrap-anywhere [&_span]:whitespace-normal"
                                >
                                    {role.title}.{' '}
                                    {beginnerLabel(role.accepts_beginners)}.{' '}
                                    {capacityLabel(
                                        role.capacity_stats,
                                        role.capacity,
                                    )}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {Boolean(errors.project_role_id) && (
                        <p className="text-sm text-destructive">
                            {firstError({
                                role: errors.project_role_id,
                            })}
                        </p>
                    )}
                </div>
                {selectedRole && <TeamCriteriaCard role={selectedRole} />}
                {inputFields.map(([key, label, maxLength, placeholder]) => (
                    <div key={key} className="grid gap-2">
                        <Label htmlFor={`team-request-${key}`}>{label}</Label>
                        <textarea
                            aria-required="true"
                            id={`team-request-${key}`}
                            value={data[key]}
                            onChange={(event) =>
                                onChangeField(key, event.target.value)
                            }
                            maxLength={maxLength}
                            rows={2}
                            placeholder={placeholder}
                            className={textAreaClass}
                            aria-invalid={Boolean(errors[key])}
                            aria-describedby={`team-request-${key}-hint`}
                        />
                        <p
                            id={`team-request-${key}-hint`}
                            className="text-xs leading-5 text-muted-foreground"
                        >
                            {firstError({
                                [key]: errors[key],
                            }) ??
                                `Maksimal ${maxLength} karakter. Hindari kontak dan data pribadi yang tidak diperlukan.`}
                        </p>
                    </div>
                ))}
            </fieldset>
            <Button
                type="submit"
                disabled={blocked}
                data-test="submit-team-join-request"
                className="min-h-11 w-full whitespace-normal sm:w-fit"
            >
                {processing && <Spinner aria-hidden="true" />}
                Kirim permintaan bergabung
            </Button>
        </form>
    );
}
