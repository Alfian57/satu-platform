export type Proficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type EvidenceLink = { title: string; url: string };
export type CapabilitySkill = {
    taxonomy_id: number;
    proficiency: Proficiency;
    evidence_metadata?: EvidenceLink[];
};
export type CapabilityWindow = {
    day_of_week: number;
    starts_at: string;
    ends_at: string;
    timezone: string;
};
export type CapabilityProfile = {
    id: number;
    updated_at: string;
    revision: string;
    bio: string | null;
    study_program: string | null;
    faculty: string | null;
    admission_year: number | null;
    skills: (Omit<CapabilitySkill, 'evidence_metadata'> & {
        name: string;
        evidence_metadata: unknown;
    })[];
    interests: { taxonomy_id: number; name: string }[];
    availability_windows: CapabilityWindow[];
};
export type CapabilityPayload = {
    institution_id: number;
    bio: string;
    study_program: string;
    faculty: string;
    admission_year: number | null;
    skills: CapabilitySkill[];
    interests: number[];
    availability_windows: CapabilityWindow[];
    expected_updated_at?: string;
    expected_profile_revision?: string;
};

export function safeEvidenceUrl(value: unknown): value is string {
    if (typeof value !== 'string' || value !== value.trim()) {
        return false;
    }

    if (
        Array.from(value).some((character) => {
            const code = character.charCodeAt(0);

            return code <= 32 || code === 127;
        })
    ) {
        return false;
    }

    try {
        const url = new URL(value);

        for (const key of url.searchParams.keys()) {
            if (
                /^(?:token|access_token|password|secret|api_key|key|signature|authorization|auth|x-amz-.+|x-goog-.+)$/i.test(
                    key,
                )
            ) {
                return false;
            }
        }

        return (
            url.protocol === 'https:' &&
            !url.username &&
            !url.password &&
            url.hostname.includes('.') &&
            !url.hostname.endsWith('.') &&
            !/^\d+(?:\.\d+){3}$/.test(url.hostname) &&
            !url.hostname.includes(':') &&
            !/(?:^|\.)(?:localhost|local|internal|lan|test|invalid)$/i.test(
                url.hostname,
            )
        );
    } catch {
        return false;
    }
}

export function editableEvidence(value: unknown): EvidenceLink[] | undefined {
    if (value === null || value === undefined) {
        return [];
    }

    if (
        !Array.isArray(value) ||
        value.length > 10 ||
        !value.every(
            (item) =>
                item &&
                typeof item === 'object' &&
                Object.keys(item).every(
                    (key) => key === 'title' || key === 'url',
                ) &&
                typeof item.title === 'string' &&
                item.title.trim().length > 0 &&
                item.title.length <= 120 &&
                typeof item.url === 'string' &&
                item.url.length <= 2048 &&
                safeEvidenceUrl(item.url),
        )
    ) {
        return undefined;
    }

    return value.map((item) => ({ title: item.title, url: item.url }));
}

export function capabilityDraft(
    profile: CapabilityProfile | null,
    institutionId: number,
    academicDraft?: {
        study_program?: string;
        faculty?: string;
        admission_year?: number | null;
    } | null,
): CapabilityPayload {
    return {
        institution_id: institutionId,
        bio: profile?.bio ?? '',
        study_program:
            profile?.study_program ?? academicDraft?.study_program ?? '',
        faculty: profile?.faculty ?? academicDraft?.faculty ?? '',
        admission_year:
            profile?.admission_year ?? academicDraft?.admission_year ?? null,
        skills:
            profile?.skills.map((skill) => {
                const evidence = editableEvidence(skill.evidence_metadata);

                return {
                    taxonomy_id: skill.taxonomy_id,
                    proficiency: skill.proficiency,
                    ...(evidence === undefined
                        ? {}
                        : { evidence_metadata: evidence }),
                };
            }) ?? [],
        interests:
            profile?.interests.map((interest) => interest.taxonomy_id) ?? [],
        availability_windows:
            profile?.availability_windows.map((window) => ({
                day_of_week: window.day_of_week,
                starts_at: window.starts_at,
                ends_at: window.ends_at,
                timezone: window.timezone,
            })) ?? [],
        expected_updated_at: profile?.updated_at,
        expected_profile_revision: profile?.revision,
    };
}

export function matchingReadiness(profile: CapabilityProfile | null): string[] {
    const missing: string[] = [];

    if (!profile?.skills.length) {
        missing.push('keahlian');
    }

    if (!profile?.availability_windows.length) {
        missing.push('jadwal');
    }

    return missing;
}
