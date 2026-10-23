import { Label } from '@/components/ui/label';

export interface OnboardingProfileStepProps {
    bio: string;
    onBioChange: (bio: string) => void;
    busy: boolean;
}

export function OnboardingProfileStep({
    bio,
    onBioChange,
    busy,
}: OnboardingProfileStepProps) {
    return (
        <div className="grid gap-2">
            <Label htmlFor="bio">Tentang dirimu</Label>
            <textarea
                id="bio"
                value={bio}
                disabled={busy}
                onChange={(event) => onBioChange(event.target.value)}
                rows={3}
                className="w-full resize-y rounded-xl border border-input bg-white p-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                placeholder="Apa yang ingin kamu pelajari atau bangun bersama?"
            />
        </div>
    );
}
