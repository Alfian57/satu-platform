<?php

namespace Tests\Feature\Auth;

use App\Models\ConsentRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationConsentTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_requires_terms_acceptance(): void
    {
        $response = $this->post('/register/otp', [
            'name' => 'Budi Santoso',
            'username' => 'budisantoso',
            'phone' => '+6281234567890',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertSessionHasErrors(['terms_accepted']);
    }
}
