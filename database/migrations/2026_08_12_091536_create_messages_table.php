<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id');
            $table->foreignId('author_id');
            $table->text('body');
            $table->timestamps();

            $table->foreign('project_id', 'messages_project_fk')
                ->references('id')
                ->on('projects')
                ->cascadeOnDelete();
            $table->foreign('author_id', 'messages_author_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->index(
                ['project_id', 'created_at', 'id'],
                'messages_project_created_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
