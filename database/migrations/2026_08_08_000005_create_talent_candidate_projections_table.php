<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('talent_candidate_projections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->string('headline')->nullable();
            $table->text('bio')->nullable();
            $table->json('skills')->nullable();
            $table->json('badges')->nullable();
            $table->json('contributions')->nullable();
            $table->boolean('is_visible')->default(true);
            $table->string('availability_status', 50)->default('available');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['is_visible', 'availability_status'], 'talent_proj_visible_avail_idx');
            $table->index('institution_id', 'talent_proj_inst_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('talent_candidate_projections');
    }
};
