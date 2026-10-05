<?php

namespace Tests\Feature\Tenant;

use App\Models\Institution;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_access_other_institution_data(): void
    {
        $user = User::factory()->create();
        $institutionA = Institution::factory()->create();
        $institutionB = Institution::factory()->create();

        $response = $this->actingAs($user)->get("/campus/{$institutionB->id}/overview");

        $response->assertStatus(403);
    }
}
