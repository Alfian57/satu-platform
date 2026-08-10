<?php

declare(strict_types=1);

namespace App\Actions\Recruiter;

use App\Enums\RecruiterOrganizationStatus;
use App\Models\RecruiterOrganization;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use InvalidArgumentException;

final class RecruiterVerificationQueue
{
    /**
     * Return paginated recruiter organization verification queue for platform admin.
     *
     * @return LengthAwarePaginator<int, RecruiterOrganization>
     */
    public function paginate(
        User $admin,
        ?string $status = null,
        int $perPage = 25,
        ?int $page = null,
    ): LengthAwarePaginator {
        if ($perPage < 1 || $perPage > 100) {
            throw new InvalidArgumentException('Page size must be between 1 and 100.');
        }

        return $this->query($admin, $status)
            ->paginate($perPage, ['*'], 'page', $page);
    }

    /**
     * @return Builder<RecruiterOrganization>
     */
    public function query(User $admin, ?string $status = null): Builder
    {
        if (! $admin->is_platform_admin) {
            throw new AuthorizationException('Only platform administrators can access the recruiter verification queue.');
        }

        $query = RecruiterOrganization::query()
            ->with(['reviews.reviewer:id,name', 'memberships.user:id,name,email']);

        if ($status !== null && $status !== '') {
            $enumStatus = RecruiterOrganizationStatus::tryFrom($status);
            if ($enumStatus !== null) {
                $query->where('status', $enumStatus->value);
            }
        }

        return $query->orderByDesc('created_at')->orderByDesc('id');
    }
}
