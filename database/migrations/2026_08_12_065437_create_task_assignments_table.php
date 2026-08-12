<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id');
            $table->foreignId('user_id');
            $table->foreignId('assigned_by_id')->nullable();
            $table->timestamps();

            $table->foreign('task_id', 'task_assignments_task_fk')
                ->references('id')
                ->on('tasks')
                ->cascadeOnDelete();
            $table->foreign('user_id', 'task_assignments_user_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->foreign('assigned_by_id', 'task_assignments_assigner_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->unique(
                ['task_id', 'user_id'],
                'task_assignments_task_user_unique',
            );
            $table->index(['user_id', 'created_at'], 'task_assignments_user_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_assignments');
    }
};
