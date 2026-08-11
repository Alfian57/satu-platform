import type { ChangeEvent, ClipboardEvent } from 'react';

const OTP_LENGTH = 6;

type Props = {
    id: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    describedBy?: string;
    disabled?: boolean;
    autoFocus?: boolean;
};

function sanitizeOtp(value: string): string {
    return value.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export default function OtpInput({
    id,
    name,
    value,
    onChange,
    describedBy,
    disabled = false,
    autoFocus = false,
}: Props) {
    const digits = Array.from(
        { length: OTP_LENGTH },
        (_, index) => value[index] ?? '',
    );

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(sanitizeOtp(event.target.value));
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        onChange(sanitizeOtp(event.clipboardData.getData('text')));
    };

    return (
        <div
            role="group"
            aria-labelledby={`${id}-label`}
            aria-describedby={describedBy}
            className="grid gap-2"
        >
            <span id={`${id}-label`} className="sr-only">
                Kode verifikasi 6 digit
            </span>

            <div className="relative grid grid-cols-6 gap-2">
                {digits.map((digit, index) => (
                    <span
                        key={`${id}-${index}`}
                        aria-hidden="true"
                        className="flex h-control-lg min-w-0 items-center justify-center rounded-md border border-input bg-background text-lg font-semibold text-foreground tabular-nums"
                    >
                        {digit}
                    </span>
                ))}

                <input
                    id={id}
                    name={name}
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onPaste={handlePaste}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={OTP_LENGTH}
                    required
                    autoFocus={autoFocus}
                    disabled={disabled}
                    aria-label="Kode verifikasi 6 digit"
                    className="absolute inset-0 z-10 h-control-lg w-full cursor-text rounded-md bg-transparent text-transparent caret-primary outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed motion-reduce:transition-none"
                />
            </div>
        </div>
    );
}
