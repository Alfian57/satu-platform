<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_outboxes', function (Blueprint $table) {
            $table->id();
            $table->string('purpose');
            $table->string('recipient')->comment('normalized E.164 phone');
            $table->string('template_name')->nullable();
            $table->string('template_version')->nullable();
            $table->text('payload')->nullable()->comment('sanitized payload hash');
            $table->string('status')->default('pending');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->unsignedTinyInteger('max_attempts')->default(3);
            $table->timestamp('next_attempt_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->json('status_history')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['purpose', 'recipient']);
            $table->index(['status', 'next_attempt_at']);
        });

        Schema::create('message_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_outbox_id')->constrained('message_outboxes')->cascadeOnDelete();
            $table->string('provider');
            $table->string('external_id')->nullable();
            $table->string('status');
            $table->json('status_history')->nullable();
            $table->string('error_message')->nullable()->comment('sanitized');
            $table->timestamp('callback_at')->nullable();
            $table->timestamps();

            $table->unique(['provider', 'external_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_deliveries');
        Schema::dropIfExists('message_outboxes');
    }
};
