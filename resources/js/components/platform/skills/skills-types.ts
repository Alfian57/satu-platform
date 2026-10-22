import type { University } from '@/components/university-settings-nav';

export type Skill = {
    id: number;
    name: string;
    category: string;
    description: string | null;
    isVerified: boolean;
    profileSkillsCount: number;
    projectRoleSkillsCount: number;
    updatedAt: string;
};

export type SkillsFilters = {
    q: string;
    category: string;
    status: string;
};

export type SkillsSummary = {
    totalSkills: number;
    verifiedSkills: number;
    unverifiedSkills: number;
    categoriesCount: number;
};

export type SkillsProps = {
    institution: University;
    filters: SkillsFilters;
    categories: string[];
    skills: Skill[];
    summary: SkillsSummary;
};

export type Selection = {
    mode: 'create' | 'edit' | 'delete';
    skill?: Skill;
};

export const sheetClass =
    'min-w-0 rounded-3xl border border-primary/15 bg-card p-5 shadow-sm sm:p-6';
