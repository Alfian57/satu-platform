<?php

declare(strict_types=1);

use App\Models\Institution;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Gate;

$canAccessWorkspace = static function (User $user, Institution $institution, Project $project): bool {
    return $institution->exists
        && ! $institution->isDirty($institution->getKeyName())
        && (int) $project->institution_id === (int) $institution->getKey()
        && Gate::forUser($user)->allows('viewAny', [Task::class, $project]);
};

Broadcast::channel('institutions.{institution}.projects.{project}.workspace', $canAccessWorkspace);

Broadcast::channel(
    'institutions.{institution}.projects.{project}.presence',
    static function (User $user, Institution $institution, Project $project) use ($canAccessWorkspace): array|false {
        if (! $canAccessWorkspace($user, $institution, $project)) {
            return false;
        }

        return [
            'id' => (string) $user->getKey(),
            'name' => $user->name,
        ];
    },
);
