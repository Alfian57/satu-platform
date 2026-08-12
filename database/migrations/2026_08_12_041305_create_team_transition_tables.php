<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_memberships', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id');
            $table->foreignId('user_id');
            $table->foreignId('project_role_id')->nullable();
            $table->enum('status', ['active', 'left', 'removed'])->default('active');
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->timestamp('removed_at')->nullable();
            $table->foreignId('removed_by_id')->nullable();
            $table->string('removal_reason', 1000)->nullable();
            $table->timestamps();

            $table->foreign('project_id', 'team_memberships_project_fk')
                ->references('id')
                ->on('projects')
                ->cascadeOnDelete();
            $table->foreign('user_id', 'team_memberships_user_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->foreign('project_role_id', 'team_memberships_role_fk')
                ->references('id')
                ->on('project_roles')
                ->nullOnDelete();
            $table->foreign('removed_by_id', 'team_memberships_removed_by_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->unique(
                ['project_id', 'user_id'],
                'team_memberships_project_user_unique',
            );
            $table->index(
                ['project_id', 'status'],
                'team_memberships_project_status_idx',
            );
            $table->index(
                ['project_id', 'project_role_id', 'status'],
                'team_memberships_role_status_idx',
            );
        });

        Schema::create('team_membership_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('team_membership_id');
            $table->foreignId('actor_id')->nullable();
            $table->enum('event', ['joined', 'rejoined', 'left', 'removed']);
            $table->string('reason', 1000)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at');

            $table->foreign('team_membership_id', 'team_membership_events_membership_fk')
                ->references('id')
                ->on('team_memberships')
                ->cascadeOnDelete();
            $table->foreign('actor_id', 'team_membership_events_actor_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->index(
                ['team_membership_id', 'created_at'],
                'team_membership_events_history_idx',
            );
        });

        Schema::create('team_invitations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id');
            $table->foreignId('project_role_id')->nullable();
            $table->foreignId('inviter_id');
            $table->foreignId('invitee_id');
            $table->enum('status', ['pending', 'accepted', 'rejected', 'expired', 'revoked'])
                ->default('pending');
            $table->string('pending_key', 16)->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('responded_at')->nullable();
            $table->string('response_reason', 1000)->nullable();
            $table->timestamps();

            $table->foreign('project_id', 'team_invitations_project_fk')
                ->references('id')
                ->on('projects')
                ->cascadeOnDelete();
            $table->foreign('project_role_id', 'team_invitations_role_fk')
                ->references('id')
                ->on('project_roles')
                ->nullOnDelete();
            $table->foreign('inviter_id', 'team_invitations_inviter_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->foreign('invitee_id', 'team_invitations_invitee_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->unique(
                ['project_id', 'invitee_id', 'pending_key'],
                'team_invitations_pending_unique',
            );
            $table->index(
                ['project_id', 'status', 'expires_at'],
                'team_invitations_project_status_idx',
            );
            $table->index(
                ['invitee_id', 'status'],
                'team_invitations_invitee_status_idx',
            );
        });

        Schema::create('team_join_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id');
            $table->foreignId('project_role_id')->nullable();
            $table->foreignId('requester_id');
            $table->enum('status', ['pending', 'accepted', 'rejected', 'withdrawn', 'expired'])
                ->default('pending');
            $table->string('pending_key', 16)->nullable();
            $table->string('message', 1000)->nullable();
            $table->timestamp('requested_at');
            $table->timestamp('responded_at')->nullable();
            $table->string('response_reason', 1000)->nullable();
            $table->timestamps();

            $table->foreign('project_id', 'team_join_requests_project_fk')
                ->references('id')
                ->on('projects')
                ->cascadeOnDelete();
            $table->foreign('project_role_id', 'team_join_requests_role_fk')
                ->references('id')
                ->on('project_roles')
                ->nullOnDelete();
            $table->foreign('requester_id', 'team_join_requests_requester_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->unique(
                ['project_id', 'requester_id', 'pending_key'],
                'team_join_requests_pending_unique',
            );
            $table->index(
                ['project_id', 'status', 'requested_at'],
                'team_join_requests_project_status_idx',
            );
            $table->index(
                ['requester_id', 'status'],
                'team_join_requests_requester_status_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_join_requests');
        Schema::dropIfExists('team_invitations');
        Schema::dropIfExists('team_membership_events');
        Schema::dropIfExists('team_memberships');
    }
};
