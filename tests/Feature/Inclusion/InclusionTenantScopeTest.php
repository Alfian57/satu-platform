<?php

namespace Tests\Feature\Inclusion;

use App\Models\InclusionSignal;
use App\Models\Institution;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InclusionTenantScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_inclusion_signals_are_tenant_scoped(): void
    {
        $institutionA = Institution::factory()->create();
        $institutionB = Institution::factory()->create();

        $signalA = InclusionSignal::factory()->create([
            'institution_id' => $institutionA->id,
            'is_synthetic' => false,
        ]);

        $this->assertTrue(InclusionSignal::where('institution_id', $institutionA->id)->exists());
        $this->assertFalse(InclusionSignal::where('institution_id', $institutionB->id)->exists());
    }
}
