export type StudentHeroTheme =
    | 'home'
    | 'projects'
    | 'contributions'
    | 'portfolio'
    | 'rankings'
    | 'settings';

type StudentHeroBackdropProps = {
    theme: StudentHeroTheme;
};

export default function StudentHeroBackdrop({
    theme,
}: StudentHeroBackdropProps) {
    const image = `/images/student-hero-${theme}`;

    return (
        <div
            className="student-hero-backdrop"
            data-hero-theme={theme}
            aria-hidden="true"
        >
            <img
                className="student-hero-backdrop__image"
                src={`${image}-1280.webp`}
                srcSet={`${image}-768.webp 768w, ${image}-1280.webp 1280w, ${image}.webp 2048w`}
                sizes="(min-width: 1280px) calc(100vw - 20rem), 100vw"
                alt=""
                width={2048}
                height={683}
                loading="eager"
                decoding="async"
                fetchPriority="low"
                draggable={false}
            />
        </div>
    );
}
