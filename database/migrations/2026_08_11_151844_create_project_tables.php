<?php

use App\Enums\ProjectStatus;
use App\Enums\ProjectVisibility;
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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('institution_id');
            $table->foreignId('owner_id');
            $table->string('title', 160);
            $table->text('description')->nullable();
            $table->enum('status', array_map(
                static fn (ProjectStatus $status): string => $status->value,
                ProjectStatus::cases(),
            ))->default(ProjectStatus::Open->value);
            $table->enum('visibility', array_map(
                static fn (ProjectVisibility $visibility): string => $visibility->value,
                ProjectVisibility::cases(),
            ))->default(ProjectVisibility::Institution->value);
            $table->unsignedTinyInteger('capacity');
            $table->timestamp('deadline');
            $table->timestamps();

            $table->foreign('institution_id', 'projects_institution_fk')
                ->references('id')
                ->on('institutions')
                ->restrictOnDelete();
            $table->foreign('owner_id', 'projects_owner_fk')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
            $table->index(
                ['institution_id', 'status', 'deadline'],
                'projects_institution_status_deadline_idx',
            );
            $table->index(['institution_id', 'visibility'], 'projects_institution_visibility_idx');
            $table->index(['owner_id', 'status'], 'projects_owner_status_idx');
        });

        Schema::create('project_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id');
            $table->string('title', 120);
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('capacity')->default(1);
            $table->timestamps();

            $table->foreign('project_id', 'project_roles_project_fk')
                ->references('id')
                ->on('projects')
                ->cascadeOnDelete();
            $table->unique(
                ['project_id', 'title'],
                'project_roles_project_title_unique',
            );
            $table->index(
                ['project_id', 'capacity'],
                'project_roles_project_capacity_idx',
            );
        });

        Schema::create('project_role_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_role_id');
            $table->foreignId('skill_taxonomy_id');
            $table->enum('proficiency', ['beginner', 'intermediate', 'advanced', 'expert'])
                ->default('intermediate');
            $table->timestamps();

            $table->foreign('project_role_id', 'project_role_skills_role_fk')
                ->references('id')
                ->on('project_roles')
                ->cascadeOnDelete();
            $table->foreign('skill_taxonomy_id', 'project_role_skills_taxonomy_fk')
                ->references('id')
                ->on('skill_taxonomies')
                ->restrictOnDelete();
            $table->unique(
                ['project_role_id', 'skill_taxonomy_id'],
                'project_role_skills_role_taxonomy_unique',
            );
            $table->index(
                ['skill_taxonomy_id', 'proficiency'],
                'project_role_skills_taxonomy_prof_idx',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_role_skills');
        Schema::dropIfExists('project_roles');
        Schema::dropIfExists('projects');
    }
};
