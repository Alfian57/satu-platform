<?php

return [
    'slug' => env('SATU_UNIVERSITY_SLUG', 'universitas-teknologi-yogyakarta'),
    'faculties' => [
        'Fakultas Sains & Teknologi' => [
            'Informatika (S1)', 'Sistem Informasi (S1)', 'Teknik Sipil (S1)',
            'Teknik Elektro (S1)', 'Teknik Komputer (S1)', 'Teknik Industri (S1)',
            'Perencanaan Wilayah Kota (S1)', 'Arsitektur (S1)',
            'Informatika Medis (S1)', 'Data Sains (S1)',
        ],
        'Fakultas Bisnis & Humaniora' => [
            'Akuntansi (S1)', 'Akuntansi (D3)', 'Manajemen (S1)',
            'Ilmu Komunikasi (S1)', 'Ilmu Hubungan Internasional (S1)',
            'Bimbingan dan Konseling (S1)', 'Pendidikan Bahasa Inggris (S1)',
            'Pendidikan Teknologi Informasi (S1)', 'Pariwisata (S1)',
        ],
    ],
    'advanced_administration' => [
        'gamification' => env('SATU_GAMIFICATION_ADMINISTRATION_ENABLED', false),
    ],
];
