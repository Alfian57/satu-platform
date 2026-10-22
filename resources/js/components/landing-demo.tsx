import { Component, Suspense, lazy } from 'react';
import LandingDemoFallback from '@/components/landing/landing-demo-fallback';

export default class LandingDemo extends Component {
    state = { hasError: false };
    private DemoGraph = lazy(() => import('@/components/LandingDemoGraph'));

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    role="alert"
                    className="rounded-3xl border border-satu-border-soft bg-satu-canvas p-8 text-center"
                >
                    <h3 className="text-xl font-bold">
                        Demo belum dapat dimuat.
                    </h3>
                    <p className="mx-auto mt-3 max-w-md text-base leading-7 text-satu-muted">
                        Muat ulang halaman untuk mencoba lagi. Penjelasan alur
                        dan tombol mulai tetap dapat digunakan.
                    </p>
                    <button
                        type="button"
                        className="landing-control mt-5 cursor-pointer"
                        onClick={() => window.location.reload()}
                    >
                        Muat ulang halaman
                    </button>
                </div>
            );
        }

        const DemoGraph = this.DemoGraph;

        return (
            <Suspense fallback={<LandingDemoFallback />}>
                <DemoGraph />
            </Suspense>
        );
    }
}
