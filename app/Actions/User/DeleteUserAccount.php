<?php

namespace App\Actions\User;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DeleteUserAccount
{
    /**
     * Anonymize subject-facing user account while preserving append-only audit records.
     */
    public function handle(User $user): void
    {
        DB::transaction(function () use ($user): void {
            $user->forceFill([
                'name' => 'Pengguna Dihapus',
                'username' => 'deleted_'.Str::lower(Str::random(12)),
                'password' => bcrypt(Str::random(32)),
            ])->save();

            if ($user->studentProfile) {
                $user->studentProfile->delete();
            }
        });
    }
}
