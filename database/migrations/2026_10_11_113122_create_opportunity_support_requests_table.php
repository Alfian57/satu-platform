<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opportunity_support_requests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('institution_id')->constrained()->restrictOnDelete();
            $table->foreignId('owner_id')->constrained('users')->restrictOnDelete();
            $table->uuid('command_key');
            $table->string('need', 40);
            $table->text('explanation')->nullable();
            $table->string('status', 30)->default('requested');
            $table->unsignedInteger('revision')->default(1);
            $table->string('purpose', 160);
            $table->string('consent_purpose', 100)->unique();
            $table->string('notice_version', 100);
            $table->string('approval_reference', 160);
            $table->string('dataset_kind', 20);
            $table->string('dataset_manifest', 160);
            $table->timestamp('expires_at');
            $table->timestamps();
            $table->unique(['institution_id', 'owner_id', 'command_key'], 'support_command_unique');
            $table->index(['institution_id', 'status', 'expires_at'], 'support_queue_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_support_requests');
    }
};
