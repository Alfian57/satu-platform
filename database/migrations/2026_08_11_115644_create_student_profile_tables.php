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
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->foreignId('institution_id');
            $table->string('public_identifier', 26);
            $table->text('bio')->nullable();
            $table->string('study_program')->nullable();
            $table->unsignedTinyInteger('study_year')->nullable();
            $table->string('portfolio_visibility', 20)->default('private');
            $table->boolean('recruiter_discoverable')->default(false);
            $table->timestamps();

            $table->foreign('user_id', 'student_profiles_user_fk')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();
            $table->foreign('institution_id', 'student_profiles_institution_fk')
                ->references('id')
                ->on('institutions')
                ->restrictOnDelete();
            $table->unique(
                ['institution_id', 'user_id'],
                'student_profiles_institution_user_unique',
            );
            $table->unique('public_identifier', 'student_profiles_public_identifier_unique');
            $table->index(
                ['institution_id', 'recruiter_discoverable', 'portfolio_visibility'],
                'student_profiles_discovery_idx',
            );
        });

        Schema::create('profile_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id');
            $table->foreignId('skill_taxonomy_id');
            $table->string('proficiency', 20);
            $table->json('evidence_metadata')->nullable();
            $table->timestamps();

            $table->foreign('student_profile_id', 'profile_skills_profile_fk')
                ->references('id')
                ->on('student_profiles')
                ->cascadeOnDelete();
            $table->foreign('skill_taxonomy_id', 'profile_skills_taxonomy_fk')
                ->references('id')
                ->on('skill_taxonomies')
                ->restrictOnDelete();
            $table->unique(
                ['student_profile_id', 'skill_taxonomy_id'],
                'profile_skills_profile_taxonomy_unique',
            );
            $table->index(['skill_taxonomy_id', 'proficiency'], 'profile_skills_taxonomy_prof_idx');
        });

        Schema::create('profile_interests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id');
            $table->foreignId('skill_taxonomy_id');
            $table->timestamps();

            $table->foreign('student_profile_id', 'profile_interests_profile_fk')
                ->references('id')
                ->on('student_profiles')
                ->cascadeOnDelete();
            $table->foreign('skill_taxonomy_id', 'profile_interests_taxonomy_fk')
                ->references('id')
                ->on('skill_taxonomies')
                ->restrictOnDelete();
            $table->unique(
                ['student_profile_id', 'skill_taxonomy_id'],
                'profile_interests_profile_taxonomy_unique',
            );
            $table->index('skill_taxonomy_id', 'profile_interests_taxonomy_idx');
        });

        Schema::create('availability_windows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id');
            $table->unsignedTinyInteger('day_of_week');
            $table->time('starts_at');
            $table->time('ends_at');
            $table->string('timezone', 64)->default('UTC');
            $table->timestamps();

            $table->foreign('student_profile_id', 'availability_windows_profile_fk')
                ->references('id')
                ->on('student_profiles')
                ->cascadeOnDelete();
            $table->unique(
                ['student_profile_id', 'day_of_week', 'starts_at', 'ends_at', 'timezone'],
                'availability_windows_unique',
            );
            $table->index(
                ['student_profile_id', 'day_of_week'],
                'availability_windows_profile_day_idx',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('availability_windows');
        Schema::dropIfExists('profile_interests');
        Schema::dropIfExists('profile_skills');
        Schema::dropIfExists('student_profiles');
    }
};
