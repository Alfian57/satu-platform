<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaderboard_periods', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('institution_id');
            $table->string('semester', 100);
            $table->string('rule_version', 32);
            $table->char('latest_snapshot_digest', 64)->nullable();
            $table->timestamp('computed_at')->nullable();
            $table->timestamps();

            $table->foreign('institution_id', 'leaderboard_periods_institution_fk')
                ->references('id')
                ->on('institutions')
                ->restrictOnDelete();
            $table->unique(
                ['institution_id', 'semester', 'rule_version'],
                'leaderboard_periods_tenant_rule_unique',
            );
            $table->index(
                ['institution_id', 'semester', 'created_at'],
                'leaderboard_periods_tenant_period_idx',
            );
            $table->index(
                ['institution_id', 'semester', 'computed_at'],
                'leaderboard_periods_freshness_idx',
            );
        });

        Schema::create('leaderboard_preferences', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('institution_id');
            $table->foreignId('user_id');
            $table->string('scope_type', 32);
            $table->boolean('is_opted_in')->default(false);
            $table->unsignedInteger('version')->default(1);
            $table->timestamp('changed_at');
            $table->timestamps();

            $table->foreign('institution_id', 'leaderboard_preferences_institution_fk')
                ->references('id')
                ->on('institutions')
                ->restrictOnDelete();
            $table->foreign('user_id', 'leaderboard_preferences_user_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->unique(
                ['institution_id', 'user_id', 'scope_type'],
                'leaderboard_preferences_current_unique',
            );
            $table->index(
                ['institution_id', 'scope_type', 'is_opted_in'],
                'leaderboard_preferences_scope_idx',
            );
        });

        Schema::create('leaderboard_projections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('leaderboard_period_id');
            $table->foreignId('institution_id');
            $table->string('scope_type', 32);
            $table->unsignedBigInteger('scope_id')->nullable();
            $table->string('scope_key', 191)->nullable();
            $table->string('scope_label', 160)->nullable();
            $table->unsignedInteger('rank')->nullable();
            $table->unsignedInteger('shared_rank_group')->nullable();
            $table->decimal('score', 12, 4);
            $table->bigInteger('verified_xp_total');
            $table->unsignedInteger('active_member_denominator');
            $table->unsignedInteger('cohort_size');
            $table->boolean('suppressed')->default(false);
            $table->string('suppression_reason', 64)->nullable();
            $table->char('snapshot_digest', 64);
            $table->char('snapshot_key', 64);
            $table->timestamp('computed_at');
            $table->timestamps();

            $table->foreign('leaderboard_period_id', 'leaderboard_projections_period_fk')
                ->references('id')
                ->on('leaderboard_periods')
                ->cascadeOnDelete();
            $table->foreign('institution_id', 'leaderboard_projections_institution_fk')
                ->references('id')
                ->on('institutions')
                ->restrictOnDelete();
            $table->unique('snapshot_key', 'leaderboard_projections_snapshot_unique');
            $table->index(
                ['leaderboard_period_id', 'scope_type', 'scope_id'],
                'leaderboard_projections_period_scope_idx',
            );
            $table->index(
                ['leaderboard_period_id', 'scope_type', 'scope_key'],
                'leaderboard_projections_period_key_idx',
            );
            $table->index(
                ['institution_id', 'computed_at'],
                'leaderboard_projections_tenant_freshness_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaderboard_projections');
        Schema::dropIfExists('leaderboard_preferences');
        Schema::dropIfExists('leaderboard_periods');
    }
};
