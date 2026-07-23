import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { home } from '@/routes';
import { send } from '@/routes/verification';

type Props = {
    status?: string;
};

export default function VerifyEmail({ status }: Props) {
    return (
        <>
            <Head title="Verifikasi email" />

            <div className="flex flex-col gap-6">
                <div className="space-y-2 text-center">
                    <p className="text-sm leading-6 text-muted-foreground">
                        Kami sudah mengirim tautan verifikasi ke alamat emailmu.
                        Buka email tersebut untuk melanjutkan ke SATU.
                    </p>
                </div>

                {status === 'verification-link-sent' && (
                    <p
                        className="text-center text-sm font-medium text-green-600"
                        role="status"
                    >
                        Tautan verifikasi baru sudah dikirim.
                    </p>
                )}

                <Form
                    {...send.form()}
                    disableWhileProcessing
                    className="flex flex-col gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            {Object.keys(errors).length > 0 && (
                                <InputError
                                    message="Tautan belum dapat dikirim. Coba lagi."
                                    role="alert"
                                />
                            )}

                            <Button
                                type="submit"
                                className="w-full cursor-pointer"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Kirim ulang tautan
                            </Button>
                        </>
                    )}
                </Form>

                <TextLink href={home()} className="text-center text-sm">
                    Kembali ke beranda
                </TextLink>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verifikasi emailmu',
    description: 'Verifikasi email sebelum mulai berkolaborasi.',
};
