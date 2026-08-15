import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Clock3, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { home, login, register } from '@/routes';

type Invitation = {
    status: 'valid' | 'expired';
    institutionName?: string | null;
    maskedPhone?: string | null;
    intendedRole?: string | null;
    expiresAt?: string | null;
};

type Props = {
    invitation: Invitation;
};

function formatRole(role?: string | null): string {
    return role === 'campus_admin' ? 'Admin kampus' : 'Operator terundang';
}

export default function Invitation({ invitation }: Props) {
    const isExpired = invitation.status === 'expired';

    return (
        <>
            <Head
                title={isExpired ? 'Undangan tidak tersedia' : 'Undangan SATU'}
            />

            <main
                className="grid gap-6"
                data-test="invitation-page"
                data-status={invitation.status}
            >
                <div className="grid gap-3 border-y border-border py-5">
                    <div className="flex items-center gap-3">
                        {isExpired ? (
                            <Clock3
                                aria-hidden="true"
                                className="size-5 text-pending"
                            />
                        ) : (
                            <ShieldCheck
                                aria-hidden="true"
                                className="size-5 text-verified"
                            />
                        )}
                        <p className="font-label text-label text-muted-foreground">
                            {isExpired ? 'Status undangan' : 'Bukti undangan'}
                        </p>
                    </div>

                    <h1 className="text-title font-bold">
                        {isExpired
                            ? 'Undangan ini sudah tidak berlaku'
                            : 'Kamu menerima undangan SATU'}
                    </h1>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {isExpired
                            ? 'Minta pengelola platform mengirim undangan baru agar akses dapat diproses dengan aman.'
                            : 'Masuk atau buat akun menggunakan nomor WhatsApp yang sesuai untuk melanjutkan proses undangan.'}
                    </p>
                </div>

                {isExpired ? (
                    <Button
                        asChild
                        variant="outline"
                        className="w-full cursor-pointer"
                    >
                        <Link href={home()}>
                            Kembali ke beranda
                            <ArrowRight />
                        </Link>
                    </Button>
                ) : (
                    <>
                        <dl className="grid gap-3 border-b border-border pb-5 text-sm">
                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-muted-foreground">
                                    Kampus
                                </dt>
                                <dd className="text-right font-semibold">
                                    {invitation.institutionName ??
                                        'Kampus terverifikasi'}
                                </dd>
                            </div>
                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-muted-foreground">Peran</dt>
                                <dd className="text-right font-semibold">
                                    {formatRole(invitation.intendedRole)}
                                </dd>
                            </div>
                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-muted-foreground">Nomor</dt>
                                <dd className="text-right font-semibold">
                                    {invitation.maskedPhone ?? 'Nomor tersamar'}
                                </dd>
                            </div>
                        </dl>

                        <div className="grid gap-3">
                            <Button asChild className="w-full cursor-pointer">
                                <Link href={login()}>
                                    Masuk untuk melanjutkan
                                    <ArrowRight />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="w-full cursor-pointer"
                            >
                                <Link href={register()}>
                                    Buat akun mahasiswa
                                </Link>
                            </Button>
                        </div>
                    </>
                )}
            </main>
        </>
    );
}

Invitation.layout = {
    title: 'Undangan akses SATU',
    description: 'Periksa detail undangan sebelum melanjutkan.',
};
