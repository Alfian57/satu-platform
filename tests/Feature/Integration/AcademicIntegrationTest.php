<?php

declare(strict_types=1);

namespace Tests\Feature\Integration;

use App\Enums\CreditMappingStatus;
use App\Enums\InstitutionMembershipRole;
use App\Enums\InstitutionMembershipStatus;
use App\Enums\InstitutionStatus;
use App\Enums\IntegrationConnectionStatus;
use App\Enums\IntegrationProviderMode;
use App\Events\ContributionApproved;
use App\Listeners\TriggerAcademicSyncOnContributionApproved;
use App\Models\AcademicCreditMapping;
use App\Models\Contribution;
use App\Models\ContributionVersion;
use App\Models\Institution;
use App\Models\InstitutionMembership;
use App\Models\IntegrationConnection;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_campus_admin_can_create_integration_connection(): void
    {
        $admin = User::factory()->create();
        $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);

        InstitutionMembership::factory()->create([
            'institution_id' => $institution->id,
            'user_id' => $admin->id,
            'role' => InstitutionMembershipRole::CampusAdmin,
            'status' => InstitutionMembershipStatus::Verified,
        ]);

        $response = $this->actingAs($admin)->post("/campus/{$institution->id}/integrations", [
            'provider_key' => 'siakad_main',
            'mode' => 'sandbox',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('integration_connections', [
            'institution_id' => $institution->id,
            'provider_key' => 'siakad_main',
            'mode' => IntegrationProviderMode::Sandbox->value,
            'status' => IntegrationConnectionStatus::Disconnected->value,
        ]);
    }

    public function test_non_admin_cannot_create_integration_connection(): void
    {
        $user = User::factory()->create();
        $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);

        $response = $this->actingAs($user)->post("/campus/{$institution->id}/integrations", [
            'provider_key' => 'siakad_main',
            'mode' => 'sandbox',
        ]);

        $response->assertStatus(403);
    }

    public function test_contribution_approved_event_triggers_academic_sync(): void
    {
        $institution = Institution::factory()->create(['status' => InstitutionStatus::Active]);
        $student = User::factory()->create();
        $reviewer = User::factory()->create();

        $connection = IntegrationConnection::query()->create([
            'institution_id' => $institution->id,
            'provider_key' => 'test_sandbox',
            'mode' => IntegrationProviderMode::Sandbox->value,
            'status' => IntegrationConnectionStatus::Connected->value,
        ]);

        $mapping = AcademicCreditMapping::query()->create([
            'institution_id' => $institution->id,
            'activity_type' => 'contribution_approved',
            'version' => 1,
            'credit_amount' => 3.0,
            'status' => CreditMappingStatus::Active,
        ]);

        $project = Project::factory()->create(['institution_id' => $institution->id]);
        $task = Task::factory()->create(['project_id' => $project->id]);

        $contribution = Contribution::factory()->create([
            'institution_id' => $institution->id,
            'owner_id' => $student->id,
            'project_id' => $project->id,
        ]);

        $version = ContributionVersion::factory()->create([
            'contribution_id' => $contribution->id,
            'created_by_id' => $student->id,
            'task_id' => $task->id,
            'version_number' => 1,
        ]);

        $contribution->forceFill(['current_version_id' => $version->id])->save();

        $event = new ContributionApproved(
            contributionId: $contribution->id,
            contributionVersionId: $version->id,
            reviewId: 999,
            reviewerId: $reviewer->id,
            institutionId: $institution->id,
            policyVersion: 'v1.0',
        );

        $listener = app(TriggerAcademicSyncOnContributionApproved::class);
        $listener->handle($event);

        $this->assertDatabaseHas('integration_syncs', [
            'integration_connection_id' => $connection->id,
            'source' => 'contribution_approved',
            'mapping_version' => '1',
        ]);
    }
}
