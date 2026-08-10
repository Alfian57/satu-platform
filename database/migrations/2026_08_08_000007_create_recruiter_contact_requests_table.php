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
        Schema::create('recruiter_contact_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruiter_organization_id')->constrained('recruiter_organizations')->cascadeOnDelete();
            $table->foreignId('recruiter_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('talent_candidate_projection_id')->constrained('talent_candidate_projections')->cascadeOnDelete();
            $table->foreignId('candidate_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('purpose');
            $table->text('message')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['recruiter_organization_id', 'status']);
            $table->index(['candidate_user_id', 'status']);
            $table->index(['expires_at', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recruiter_contact_requests');
    }
};
