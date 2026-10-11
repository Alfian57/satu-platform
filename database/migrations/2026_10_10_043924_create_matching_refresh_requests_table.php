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
        Schema::create('matching_refresh_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('institution_id')->constrained()->restrictOnDelete();
            $table->foreignId('candidate_id')->constrained('users')->restrictOnDelete();
            $table->uuid('revision');
            $table->string('status', 30);
            $table->foreignId('version_id')->nullable()->constrained('match_score_versions')->restrictOnDelete();
            $table->timestamp('requested_at');
            $table->timestamp('completed_at')->nullable();
            $table->string('outcome', 40)->nullable();
            $table->timestamps();
            $table->unique(['institution_id', 'candidate_id'], 'matching_refresh_tenant_candidate_unique');
            $table->index(['status', 'requested_at'], 'matching_refresh_status_requested_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matching_refresh_requests');
    }
};
