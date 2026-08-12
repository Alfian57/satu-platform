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
        Schema::create('institution_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained()
                ->restrictOnDelete();
            $table->foreignId('institution_id')
                ->constrained()
                ->restrictOnDelete();
            $table->enum('role', ['student', 'campus_admin'])
                ->default('student');
            $table->enum('status', ['unverified', 'pending', 'verified', 'suspended'])
                ->default('unverified');
            $table->string('institutional_identifier')->nullable();
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by_id')
                ->nullable()
                ->constrained('users')
                ->restrictOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->enum('verification_method', ['approved_domain', 'roster_exact_match', 'campus_admin_review'])
                ->nullable();
            $table->enum('last_review_outcome', ['approved', 'rejected'])
                ->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'institution_id', 'role']);
            $table->index(['institution_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['institution_id', 'status', 'requested_at'], 'institution_memberships_queue_order_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('institution_memberships');
    }
};
