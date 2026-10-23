import { Link } from '@inertiajs/react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import InputError from '@/components/common/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CapabilityWindow } from '@/lib/student-capabilities';
import type { UseCapabilityProfileReturn } from '@/pages/student/profile/_hooks/useCapabilityProfile';
import { index as projectsIndex } from '@/routes/projects';

const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const selectClass =
    'h-11 w-full min-w-0 cursor-pointer rounded-xl border border-input bg-card px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50';

export interface ProfileProjectsSectionProps {
    institution: { id: number; name: string; timezone: string } | null;
    state: UseCapabilityProfileReturn['state'];
    actions: UseCapabilityProfileReturn['actions'];
}

export function ProfileProjectsSection({
    institution,
    state,
    actions,
}: ProfileProjectsSectionProps) {
    const { availability_windows: availabilityWindows } = state.formData;
    const {
        savedProfile,
        isDirty,
        isProcessing,
        mustReconcile,
        busy,
        message,
        errors,
    } = state;

    return (
        <div className="space-y-6">
            <section className="min-w-0 space-y-5 rounded-3xl border border-border bg-card p-5 shadow-md sm:p-6">
                <div className="space-y-2">
                    <h2 className="text-xl font-bold">
                        Waktu untuk berkolaborasi
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Tambahkan waktu yang benar-benar memungkinkan. Jadwal
                        boleh kosong; pencocokan waktu belum siap sampai kamu
                        mengisinya. Maksimal 14 baris.
                    </p>
                </div>

                <InputError message={errors.availability_windows} />

                {availabilityWindows.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Belum ada jadwal. Kamu tetap dapat menyimpan profil dan
                        menelusuri peluang.
                    </p>
                )}

                <div className="space-y-4">
                    {availabilityWindows.map((window, index) => (
                        <div
                            key={index}
                            className="min-w-0 space-y-4 rounded-2xl border border-border bg-background/70 p-4"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="font-semibold">
                                    Jadwal {index + 1}
                                </h3>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={busy}
                                    aria-label={`Hapus jadwal ${index + 1}`}
                                    onClick={() =>
                                        actions.removeAvailabilityWindow(index)
                                    }
                                >
                                    <Trash2 aria-hidden="true" />
                                </Button>
                            </div>
                            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                                {(
                                    [
                                        'day_of_week',
                                        'starts_at',
                                        'ends_at',
                                        'timezone',
                                    ] as const
                                ).map((field) => {
                                    const id = `window-${index}-${field}`;
                                    const key = `availability_windows.${index}.${field}`;
                                    const label =
                                        field === 'day_of_week'
                                            ? 'Hari'
                                            : field === 'starts_at'
                                              ? 'Mulai'
                                              : field === 'ends_at'
                                                ? 'Selesai'
                                                : 'Zona waktu';

                                    return (
                                        <div
                                            key={field}
                                            className="min-w-0 space-y-2"
                                        >
                                            <Label htmlFor={id}>{label}</Label>
                                            {field === 'day_of_week' ? (
                                                <select
                                                    id={id}
                                                    value={window[field]}
                                                    disabled={busy}
                                                    className={selectClass}
                                                    onChange={(e) =>
                                                        actions.changeAvailabilityWindow(
                                                            index,
                                                            {
                                                                day_of_week:
                                                                    Number(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                            },
                                                        )
                                                    }
                                                    aria-invalid={Boolean(
                                                        errors[key],
                                                    )}
                                                    aria-describedby={`${id}-error`}
                                                >
                                                    {days.map((day, val) => (
                                                        <option
                                                            key={val}
                                                            value={val}
                                                        >
                                                            {day}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <Input
                                                    id={id}
                                                    type={
                                                        field === 'timezone'
                                                            ? 'text'
                                                            : 'time'
                                                    }
                                                    step={
                                                        field === 'timezone'
                                                            ? undefined
                                                            : 1
                                                    }
                                                    disabled={busy}
                                                    className="max-w-full min-w-0"
                                                    value={window[field]}
                                                    required
                                                    onChange={(e) =>
                                                        actions.changeAvailabilityWindow(
                                                            index,
                                                            {
                                                                [field]:
                                                                    e.target
                                                                        .value,
                                                            } as Partial<CapabilityWindow>,
                                                        )
                                                    }
                                                    aria-invalid={Boolean(
                                                        errors[key],
                                                    )}
                                                    aria-describedby={`${id}-error`}
                                                />
                                            )}
                                            <InputError
                                                id={`${id}-error`}
                                                message={errors[key]}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <Button
                    id="capability-add-window"
                    type="button"
                    variant="outline"
                    disabled={busy || availabilityWindows.length >= 14}
                    onClick={actions.addAvailabilityWindow}
                >
                    <Plus aria-hidden="true" />
                    Tambah jadwal
                </Button>
            </section>

            <footer className="space-y-3 rounded-3xl border border-primary/15 bg-linear-to-br from-card to-accent/50 p-5 shadow-sm">
                <div className="flex flex-wrap gap-3">
                    <Button
                        type="submit"
                        disabled={busy || mustReconcile}
                        data-test="capability-save"
                    >
                        {isProcessing
                            ? 'Menyimpan profil...'
                            : 'Simpan profil kemampuan'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={actions.reloadProfile}
                    >
                        <RefreshCw aria-hidden="true" />
                        Muat data tersimpan
                    </Button>
                    <Button asChild variant="ghost">
                        <Link
                            href={projectsIndex({
                                query: { institution_id: institution?.id },
                            })}
                        >
                            Jelajahi peluang
                        </Link>
                    </Button>
                </div>
                <p
                    role="status"
                    className="min-h-5 text-sm leading-6 text-muted-foreground"
                >
                    {isProcessing
                        ? 'Profil dan jadwal sedang disimpan. Tunggu konfirmasi server.'
                        : (message ??
                          (isDirty
                              ? 'Ada perubahan yang belum disimpan.'
                              : savedProfile
                                ? 'Menampilkan profil tersimpan.'
                                : 'Profil belum tersimpan.'))}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                    Simpan kemampuan tidak mengubah jangkauan portofolio.
                </p>
            </footer>
        </div>
    );
}
