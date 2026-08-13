<?php

declare(strict_types=1);

namespace App\Support\Notification;

use App\Enums\MessagePurpose;

final class NotificationCatalog
{
    /**
     * @var array<string, string>
     */
    private const CATEGORY_LABELS = [
        'all' => 'Semua',
        'project' => 'Project',
        'contribution' => 'Contribution',
        'invitation' => 'Undangan dan kontak',
        'security' => 'Keamanan',
    ];

    /**
     * @var array<string, string>
     */
    private const PURPOSE_CATEGORIES = [
        'contribution_submitted' => 'contribution',
        'contribution_reviewed' => 'contribution',
        'portfolio_projection' => 'contribution',
        'team_invitation' => 'project',
        'team_join_request' => 'project',
        'team_membership' => 'project',
        'invitation' => 'invitation',
        'contact' => 'invitation',
        'deadline' => 'project',
        'revision' => 'contribution',
        'otp' => 'security',
        'security' => 'security',
    ];

    /**
     * @return list<array{key: string, label: string}>
     */
    public static function categories(): array
    {
        return array_values(collect(self::CATEGORY_LABELS)
            ->map(fn (string $label, string $key): array => [
                'key' => $key,
                'label' => $label,
            ])
            ->values()
            ->all());
    }

    public static function normalizeCategory(?string $category): string
    {
        return array_key_exists($category, self::CATEGORY_LABELS)
            ? (string) $category
            : 'all';
    }

    public static function categoryForPurpose(?string $purpose): string
    {
        return self::PURPOSE_CATEGORIES[$purpose ?? ''] ?? 'project';
    }

    public static function categoryLabel(string $category): string
    {
        return self::CATEGORY_LABELS[$category] ?? self::CATEGORY_LABELS['project'];
    }

    /**
     * @return list<string>
     */
    public static function purposesForCategory(string $category): array
    {
        if ($category === 'all') {
            return [];
        }

        return array_keys(array_filter(
            self::PURPOSE_CATEGORIES,
            static fn (string $value): bool => $value === $category,
        ));
    }

    /**
     * @param  array<string, bool>  $savedPreferences
     * @return list<array{purpose: string, label: string, enabled: bool, mandatory: bool}>
     */
    public static function whatsappPreferences(array $savedPreferences): array
    {
        $labels = [
            MessagePurpose::Invitation->value => 'Undangan dan akses project',
            MessagePurpose::Deadline->value => 'Deadline atau revision penting',
            MessagePurpose::Revision->value => 'Perubahan pada contribution',
            MessagePurpose::Contact->value => 'Permintaan kontak',
            MessagePurpose::Security->value => 'Keamanan akun',
        ];

        return array_values(collect($labels)
            ->map(function (string $label, string $purpose) use ($savedPreferences): array {
                $mandatory = in_array($purpose, [
                    MessagePurpose::Security->value,
                ], true);

                return [
                    'purpose' => $purpose,
                    'label' => $label,
                    'enabled' => $savedPreferences[$purpose] ?? true,
                    'mandatory' => $mandatory,
                ];
            })
            ->values()
            ->all());
    }
}
