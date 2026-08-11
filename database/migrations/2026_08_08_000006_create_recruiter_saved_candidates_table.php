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
        Schema::create('recruiter_saved_candidates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruiter_organization_id')->constrained('recruiter_organizations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('talent_candidate_projection_id');
            $table->foreign('talent_candidate_projection_id', 'saved_candidates_projection_fk')
                ->references('id')
                ->on('talent_candidate_projections')
                ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(
                ['recruiter_organization_id', 'user_id', 'talent_candidate_projection_id'],
                'recruiter_saved_candidate_unique'
            );
            $table->index(
                ['recruiter_organization_id', 'created_at'],
                'saved_candidates_org_created_idx',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recruiter_saved_candidates');
    }
};
