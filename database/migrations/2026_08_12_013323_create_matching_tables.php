<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('match_score_versions', function (Blueprint $table): void {
            $table->id();
            $table->string('version', 50);
            $table->json('dimensions');
            $table->json('weights');
            $table->json('parameters');
            $table->timestamp('activated_at')->nullable();
            $table->foreignId('author_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique('version', 'match_score_versions_version_unique');
            $table->foreign('author_id', 'match_score_versions_author_fk')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
            $table->index('activated_at', 'match_score_versions_activated_idx');
        });

        Schema::create('match_runs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('institution_id');
            $table->foreignId('actor_id');
            $table->foreignId('project_id');
            $table->foreignId('version_id');
            $table->json('input_snapshot');
            $table->timestamp('computed_at');
            $table->timestamps();

            $table->foreign('institution_id', 'match_runs_institution_fk')
                ->references('id')
                ->on('institutions')
                ->restrictOnDelete();
            $table->foreign('actor_id', 'match_runs_actor_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->foreign('project_id', 'match_runs_project_fk')
                ->references('id')
                ->on('projects')
                ->restrictOnDelete();
            $table->foreign('version_id', 'match_runs_version_fk')
                ->references('id')
                ->on('match_score_versions')
                ->restrictOnDelete();
            $table->index(
                ['institution_id', 'actor_id', 'project_id'],
                'match_runs_tenant_actor_project_idx',
            );
            $table->index('version_id', 'match_runs_version_idx');
        });

        Schema::create('recommendations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('match_run_id');
            $table->foreignId('institution_id');
            $table->foreignId('project_id');
            $table->foreignId('candidate_id');
            $table->json('component_scores');
            $table->decimal('total_score', 6, 4);
            $table->json('reason_candidates');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->unique('match_run_id', 'recommendations_match_run_unique');
            $table->foreign('match_run_id', 'recommendations_match_run_fk')
                ->references('id')
                ->on('match_runs')
                ->cascadeOnDelete();
            $table->foreign('institution_id', 'recommendations_institution_fk')
                ->references('id')
                ->on('institutions')
                ->restrictOnDelete();
            $table->foreign('project_id', 'recommendations_project_fk')
                ->references('id')
                ->on('projects')
                ->restrictOnDelete();
            $table->foreign('candidate_id', 'recommendations_candidate_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->index(
                ['institution_id', 'candidate_id', 'total_score'],
                'recommendations_tenant_candidate_score_idx',
            );
            $table->index(
                ['institution_id', 'project_id', 'total_score'],
                'recommendations_tenant_project_score_idx',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recommendations');
        Schema::dropIfExists('match_runs');
        Schema::dropIfExists('match_score_versions');
    }
};
