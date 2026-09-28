import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Konfirmasi password" />

            <Form
                action={store.url()}
                method="post"
                resetOnSuccess={['password']}
            >
                {({ processing, errors }) => (
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                placeholder="Password"
                                autoComplete="current-password"
                                autoFocus
                                required
                                disabled={processing}
                                aria-invalid={Boolean(errors.password)}
                                aria-describedby={
                                    errors.password
                                        ? 'confirm-password-password-error'
                                        : undefined
                                }
                            />

                            <InputError
                                id="confirm-password-password-error"
                                message={errors.password}
                            />
                        </div>

                        <div className="flex items-center">
                            <Button
                                className="w-full cursor-pointer disabled:cursor-not-allowed"
                                disabled={processing}
                                data-test="confirm-password-button"
                            >
                                {processing && <Spinner />}
                                Konfirmasi password
                            </Button>
                        </div>
                    </div>
                )}
            </Form>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Konfirmasi password',
    description:
        'Area ini dilindungi. Konfirmasikan password sebelum melanjutkan.',
};
