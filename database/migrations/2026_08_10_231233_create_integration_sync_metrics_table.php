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
        Schema::create('integration_sync_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_connection_id')->constrained()->restrictOnDelete();
            $table->foreignId('institution_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('total_syncs')->default(0);
            $table->unsignedInteger('succeeded_count')->default(0);
            $table->unsignedInteger('reconciled_count')->default(0);
            $table->unsignedInteger('dead_letter_count')->default(0);
            $table->unsignedInteger('total_retries')->default(0);
            $table->unsignedInteger('queue_age_seconds')->default(0);
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();

            $table->unique('integration_connection_id');
            $table->index(
                ['institution_id', 'integration_connection_id'],
                'integration_metrics_institution_connection_idx',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('integration_sync_metrics');
    }
};
