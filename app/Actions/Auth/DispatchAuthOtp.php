<?php

namespace App\Actions\Auth;

use App\Actions\Otp\GenerateOtp;
use App\Enums\MessagePurpose;
use App\Enums\OtpPurpose;
use App\Jobs\SendWhatsAppMessage;
use App\Models\MessageOutbox;
use Illuminate\Support\Facades\Crypt;

final class DispatchAuthOtp
{
    public function __construct(
        private readonly GenerateOtp $generateOtp,
    ) {}

    /**
     * Create a purpose-bound OTP and queue its WhatsApp delivery.
     *
     * The encrypted outbox payload keeps the plaintext code out of the
     * database while still allowing the server-side delivery job to send it.
     *
     * @param  array<string, mixed>|null  $requestContext
     */
    public function handle(
        OtpPurpose $purpose,
        string $phone,
        ?array $requestContext = null,
    ): MessageOutbox {
        $plainOtp = $this->generateOtp->handle($purpose, $phone, $requestContext);

        $payload = Crypt::encryptString(json_encode([
            'message' => sprintf(
                'Kode verifikasi SATU: %s. Berlaku 5 menit. Jangan bagikan kode ini kepada siapa pun.',
                $plainOtp,
            ),
        ], JSON_THROW_ON_ERROR));

        $outbox = MessageOutbox::query()->create([
            'purpose' => MessagePurpose::Otp,
            'recipient' => $phone,
            'template_name' => 'auth_otp',
            'template_version' => '1.0.0',
            'payload' => $payload,
            'status_history' => [],
            'metadata' => [
                'otp_purpose' => $purpose->value,
                'payload_hash' => hash('sha256', $payload),
            ],
        ]);

        SendWhatsAppMessage::dispatch($outbox->id);

        return $outbox->fresh() ?? $outbox;
    }
}
