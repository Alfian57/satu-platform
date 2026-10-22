import { textAreaClassName } from '@/components/contributions/contribution-helpers';
import { Label } from '@/components/ui/label';

export interface ComposerDeclarationSectionProps {
    mode: 'create' | 'revision';
    declaration: string;
    processing: boolean;
    blocked: boolean;
    declarationError?: string;
    onDeclarationChange: (declaration: string) => void;
}

export function ComposerDeclarationSection({
    mode,
    declaration,
    processing,
    blocked,
    declarationError,
    onDeclarationChange,
}: ComposerDeclarationSectionProps) {
    return (
        <div className="grid min-w-0 gap-2 border-t border-border/70 pt-5">
            <Label htmlFor={`contribution-${mode}-declaration`}>
                Pernyataan pemilik (privat)
            </Label>
            <textarea
                id={`contribution-${mode}-declaration`}
                className={textAreaClassName}
                value={declaration}
                maxLength={2000}
                onChange={(event) => onDeclarationChange(event.target.value)}
                disabled={processing || blocked}
                aria-invalid={Boolean(declarationError)}
                aria-describedby={
                    declarationError
                        ? `contribution-${mode}-declaration-error`
                        : undefined
                }
                data-test="contribution-declaration"
            />
            {declarationError && (
                <p
                    id={`contribution-${mode}-declaration-error`}
                    className="text-sm text-correction-subtle-foreground"
                >
                    {declarationError}
                </p>
            )}
        </div>
    );
}
