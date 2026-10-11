<?php

namespace Tests\Feature\Auth;

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

    public function test_data_rights_page_and_actions(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('data-rights.edit'))
            ->assertOk();

        $this->actingAs($user)
            ->post(route('account.data-rights.export'))
            ->assertOk()
            ->assertHeader('content-disposition', 'attachment; filename="satu-data-export.json"');

        $this->actingAs($user)
            ->post(route('account.data-rights.correction'), [
                'reason' => 'Perbaikan nama dan prodi',
            ])
            ->assertSessionHas('status');

        $this->actingAs($user)
            ->post(route('account.data-rights.restriction'), [
                'reason' => 'Batasi pemrosesan sementara',
            ])
            ->assertSessionHas('status');

        $this->actingAs($user)
            ->post(route('account.data-rights.withdrawal'))
            ->assertSessionHas('status');
    }
}
