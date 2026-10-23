export interface UniversityProfileCardProps {
    institution: {
        name: string;
        timezone: string;
        locale: string;
    };
}

export function UniversityProfileCard({
    institution,
}: UniversityProfileCardProps) {
    return (
        <section
            className="min-w-0 rounded-3xl border border-primary/15 bg-card p-5 shadow-sm sm:p-6"
            aria-labelledby="university-profile"
        >
            <h2 id="university-profile" className="text-xl font-bold">
                Profil universitas
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Informasi universitas yang digunakan SATU. Hubungi pengelola
                teknis jika ada informasi yang perlu diperbaiki.
            </p>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                    ['Universitas', institution.name],
                    ['Zona waktu', institution.timezone],
                    [
                        'Bahasa',
                        institution.locale === 'id'
                            ? 'Bahasa Indonesia'
                            : institution.locale,
                    ],
                ].map(([label, value]) => (
                    <div
                        key={label}
                        className="min-w-0 border-t border-border pt-3"
                    >
                        <dt className="text-sm text-muted-foreground">
                            {label}
                        </dt>
                        <dd className="mt-1 font-semibold wrap-anywhere">
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
