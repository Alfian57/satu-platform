import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import Mascot from '@/components/mascot';

type Props = {
    mascotPose: 'welcome' | 'peek' | 'guide';
    usesEntryLayout?: boolean;
};

export default function AuthSideIntro({
    mascotPose,
    usesEntryLayout = false,
}: Props) {
    return (
        <>
            <div className="hidden lg:block">
                <h2 className="max-w-[12ch] text-3xl leading-[1.06] font-bold tracking-[-0.04em] text-slate-950 xl:text-4xl">
                    Langkah kecil.
                    <br />
                    <span className="text-blue-600">Cerita besar.</span>
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
                    Temukan teman berkarya, bangun kontribusi, dan ceritakan
                    kemampuanmu lewat bukti nyata.
                </p>
            </div>

            <div className="relative mx-auto mt-4 h-28 w-full max-w-sm lg:mt-6 lg:h-40 lg:max-w-none">
                <div
                    aria-hidden="true"
                    className="absolute inset-x-5 bottom-0 h-20 rounded-[2rem] border border-white/80 bg-gradient-to-br from-satu-blue-soft to-satu-border-contrast shadow-md lg:inset-x-0 lg:h-32"
                />
                <Mascot
                    pose={mascotPose}
                    interactive
                    priority
                    className="absolute -top-8 left-1/2 z-10 w-36 -translate-x-1/2 lg:-top-14 lg:left-[56%] lg:w-[14rem] xl:w-[16rem]"
                />
                <div className="absolute bottom-3 left-3 z-20 hidden max-w-40 -rotate-3 rounded-2xl border border-white bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm lg:block">
                    {usesEntryLayout
                        ? 'Siap mulai cerita kolaborasimu?'
                        : 'Pelan-pelan, kita lanjutkan bersama.'}
                    <ArrowUpRight
                        aria-hidden="true"
                        className="mt-1.5 size-3.5 text-blue-600"
                    />
                </div>
            </div>
            <p className="mt-4 hidden items-center gap-2 text-xs leading-5 text-slate-600 lg:flex">
                <ShieldCheck
                    aria-hidden="true"
                    className="size-4 shrink-0 text-blue-700"
                />
                Kamu yang menentukan siapa yang melihat portofoliomu.
            </p>
        </>
    );
}
