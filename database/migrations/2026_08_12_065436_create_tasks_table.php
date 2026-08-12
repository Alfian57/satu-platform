<?php

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id');
            $table->foreignId('created_by_id');
            $table->string('title', 160);
            $table->text('description')->nullable();
            $table->enum('status', array_map(
                static fn (TaskStatus $status): string => $status->value,
                TaskStatus::cases(),
            ))->default(TaskStatus::Todo->value);
            $table->enum('priority', array_map(
                static fn (TaskPriority $priority): string => $priority->value,
                TaskPriority::cases(),
            ))->default(TaskPriority::Medium->value);
            $table->timestamp('due_at')->nullable();
            $table->timestamps();

            $table->foreign('project_id', 'tasks_project_fk')
                ->references('id')
                ->on('projects')
                ->cascadeOnDelete();
            $table->foreign('created_by_id', 'tasks_creator_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->index(
                ['project_id', 'status', 'priority', 'due_at'],
                'tasks_project_order_idx',
            );
            $table->index(
                ['project_id', 'status', 'due_at'],
                'tasks_project_status_due_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
