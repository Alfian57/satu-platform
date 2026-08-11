<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otp_challenges', function (Blueprint $table) {
            $table->id();
            $table->string('purpose');
            $table->string('target')->comment('normalized E.164 phone');
            $table->string('token', 255)->comment('hashed OTP');
            $table->string('status')->default('pending');
            $table->timestamp('expires_at');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->unsignedTinyInteger('max_attempts')->default(3);
            $table->unsignedTinyInteger('resend_count')->default(0);
            $table->unsignedTinyInteger('max_resends')->default(2);
            $table->timestamp('consumed_at')->nullable();
            $table->timestamp('invalidated_at')->nullable();
            $table->json('request_context')->nullable()->comment('IP, user-agent, device fingerprint');
            $table->timestamps();

            $table->index(['purpose', 'target', 'status']);
            $table->index(['purpose', 'target', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_challenges');
    }
};
