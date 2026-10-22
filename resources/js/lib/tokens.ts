/**
 * SATU Design Tokens - Canonical Color and Styling Constants
 * Single source of truth mirroring DESIGN.md and resources/css/app.css
 */

export const SATU_COLORS = {
    // Canvas & Surfaces
    canvas: '#F3F9FF',
    surface: '#FFFFFF',

    // Ink & Typography
    ink: '#17345A',
    muted: '#526B85',

    // Primary Cobalt Blue
    primary: '#1764E8',
    primaryHover: '#1454C4',
    primaryFocus: '#1746B0',
    blueSoft: '#E7F2FF',

    // Borders & Boundaries
    borderSoft: '#D9E8F5',
    borderContrast: '#BFD7EC',
    input: '#7892AE',

    // Orange Accents & Required Marks
    orange: '#FFB85C',
    orangeSoft: '#FFF4E5',
    orangeInk: '#C2410C',
    orangeBorder: '#F2D3A9',

    // Domain Status (Verified, Pending, Correction)
    verified: '#16734A',
    verifiedSubtle: '#E4F5EC',
    pending: '#8A5100',
    pendingSubtle: '#FFF1D6',
    correction: '#B42318',
    correctionSubtle: '#FDE8E7',
} as const;

export type SatuColorToken = keyof typeof SATU_COLORS;
