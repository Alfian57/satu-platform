<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attachments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id');
            $table->foreignId('message_id')->nullable();
            $table->foreignId('uploaded_by_id');
            $table->enum('purpose', ['attachment', 'evidence'])->default('attachment');
            $table->string('disk', 32);
            $table->string('path', 512);
            $table->string('original_name', 255);
            $table->string('mime_type', 191);
            $table->unsignedBigInteger('size_bytes');
            $table->char('sha256', 64);
            $table->char('deduplication_key', 64);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('project_id', 'attachments_project_fk')
                ->references('id')
                ->on('projects')
                ->cascadeOnDelete();
            $table->foreign('message_id', 'attachments_message_fk')
                ->references('id')
                ->on('messages')
                ->nullOnDelete();
            $table->foreign('uploaded_by_id', 'attachments_uploader_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->index(
                ['project_id', 'message_id', 'created_at'],
                'attachments_project_message_created_idx',
            );
            $table->index(
                ['project_id', 'sha256', 'deleted_at'],
                'attachments_project_checksum_deleted_idx',
            );
            $table->index(
                ['uploaded_by_id', 'created_at'],
                'attachments_uploader_created_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
