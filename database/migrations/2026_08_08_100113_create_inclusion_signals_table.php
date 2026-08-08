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
        Schema::create('inclusion_signals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('version_id')->constrained('inclusion_signal_versions')->cascadeOnDelete();
            $table->string('period'); // e.g. '2026-S1'
            $table->boolean('restricted_feature_state')->default(false); // Indicates restricted human-review candidate
            $table->boolean('data_sufficiency_met')->default(true);
            $table->json('evidence_summary');
            $table->timestamps();

            // Unique constraint to avoid duplicating signals per student per period per version
            $table->unique(['institution_id', 'subject_id', 'version_id', 'period'], 'inc_signal_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inclusion_signals');
    }
};
