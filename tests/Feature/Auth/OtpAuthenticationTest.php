<?php

namespace Tests\Feature\Auth;

use App\Enums\OtpPurpose;
use App\Support\PhoneIdentity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OtpAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_request_registration_otp(): void
    {
        $response = $this->post('/register/otp', [
            'name' => 'Budi Santoso',
            'username' => 'budisantoso',
            'phone' => '+6281234567890',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'terms_accepted' => true,
        ]);

        $response->assertRedirect('/register/verify');

        $this->assertDatabaseHas('otp_challenges', [
            'purpose' => OtpPurpose::Registration->value,
            'target_hash' => PhoneIdentity::hash('+6281234567890'),
        ]);
    }
}
