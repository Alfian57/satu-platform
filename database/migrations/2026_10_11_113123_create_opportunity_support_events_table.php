<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('opportunity_support_events')) {
            $columns = ['id', 'opportunity_support_request_id', 'actor_id', 'action', 'reason', 'project_role_id', 'revision', 'created_at'];
            if (! Schema::hasColumns('opportunity_support_events', $columns)) {
                throw new RuntimeException('Struktur tabel bantuan parsial tidak sesuai. Periksa sebelum melanjutkan.');
            }
            $foreignColumns = array_map(
                static fn (array $key): string => implode(',', $key['columns']),
                Schema::getForeignKeys('opportunity_support_events'),
            );
            $hasRevisionIndex = Schema::hasIndex('opportunity_support_events', 'support_event_revision_unique', 'unique');
            Schema::table('opportunity_support_events', function (Blueprint $table) use ($foreignColumns, $hasRevisionIndex): void {
                if (! in_array('opportunity_support_request_id', $foreignColumns, true)) {
                    $table->foreign('opportunity_support_request_id', 'support_events_request_fk')->references('id')->on('opportunity_support_requests')->restrictOnDelete();
                }
                if (! in_array('actor_id', $foreignColumns, true)) {
                    $table->foreign('actor_id')->references('id')->on('users')->restrictOnDelete();
                }
                if (! in_array('project_role_id', $foreignColumns, true)) {
                    $table->foreign('project_role_id')->references('id')->on('project_roles')->restrictOnDelete();
                }
                if (! $hasRevisionIndex) {
                    $table->unique(['opportunity_support_request_id', 'revision'], 'support_event_revision_unique');
                }
            });

            return;
        }
        Schema::create('opportunity_support_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('opportunity_support_request_id')->constrained(indexName: 'support_events_request_fk')->restrictOnDelete();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->string('action', 30);
            $table->text('reason')->nullable();
            $table->foreignId('project_role_id')->nullable()->constrained()->restrictOnDelete();
            $table->unsignedInteger('revision');
            $table->timestamp('created_at');
            $table->unique(['opportunity_support_request_id', 'revision'], 'support_event_revision_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opportunity_support_events');
    }
};
