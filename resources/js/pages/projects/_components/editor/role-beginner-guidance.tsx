import { Button } from '@/components/ui/button';

type Props = {
    index: number;
    description: string;
    selectionCriteria: string;
    isProcessing: boolean;
    onApplyExample: (description: string, selectionCriteria: string) => void;
};

export function RoleBeginnerGuidance({
    index,
    description,
    selectionCriteria,
    isProcessing,
    onApplyExample,
}: Props) {
    const hasExistingContent = Boolean(
        description?.trim() && selectionCriteria?.trim(),
    );

    return (
        <div
            className="grid gap-3 rounded-2xl border border-primary/15 bg-accent/50 p-4"
            data-test={`project-role-${index}-beginner-guidance`}
        >
            <div>
                <h4 className="text-sm font-semibold">
                    Siapkan pekerjaan pertama yang jelas
                </h4>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Tuliskan satu hasil awal yang dapat diperiksa, bekal dasar,
                    waktu dan pendampingan yang benar-benar kamu sediakan.
                    Mahasiswa dapat mulai tanpa karya terdahulu.
                </p>
            </div>
            <Button
                type="button"
                variant="outline"
                className="min-h-11 w-fit max-w-full bg-white whitespace-normal"
                disabled={isProcessing || hasExistingContent}
                onClick={() =>
                    onApplyExample(
                        description?.trim()
                            ? description
                            : 'Hasil awal: satu bagian pekerjaan yang dapat diperiksa bersama.\nPendampingan: pemilik menjelaskan kebutuhan dan memberi masukan pada hasil awal.\nKoordinasi: sepakati pembagian pekerjaan dan waktu dengan rekan satu tim.',
                        selectionCriteria?.trim()
                            ? selectionCriteria
                            : 'Minat belajar pada peran ini, bekal dasar yang relevan dan waktu yang disepakati. Karya terdahulu tidak wajib. Sesuaikan kebutuhan awal bersama pemilik proyek.',
                    )
                }
                data-test={`project-role-${index}-beginner-example`}
            >
                Isi contoh pada kolom kosong
            </Button>
            <p className="text-xs leading-5 text-muted-foreground">
                Contoh hanya mengisi catatan atau kriteria yang masih kosong.
                Sesuaikan isinya sebelum menyimpan proyek.
            </p>
        </div>
    );
}
