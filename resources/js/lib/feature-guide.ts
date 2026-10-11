const seenInSession = new Set<string>();
const guideSeenEvent = 'satu:feature-guide-seen';

export function featureGuideKey(userId: number, guideId: string): string {
    return `satu:feature-guide:${guideId}:user:${userId}`;
}

export function hasSeenFeatureGuide(key: string): boolean {
    if (seenInSession.has(key)) {
        return true;
    }

    if (typeof window === 'undefined') {
        return false;
    }

    try {
        return window.localStorage.getItem(key) === 'seen';
    } catch {
        return false;
    }
}

export function markFeatureGuideSeen(key: string): void {
    seenInSession.add(key);

    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(key, 'seen');
    } catch {
        // Penanda sesi tetap tersedia ketika penyimpanan browser dibatasi.
    }

    window.dispatchEvent(new Event(guideSeenEvent));
}

export function subscribeToFeatureGuides(onChange: () => void): () => void {
    window.addEventListener('storage', onChange);
    window.addEventListener(guideSeenEvent, onChange);

    return () => {
        window.removeEventListener('storage', onChange);
        window.removeEventListener(guideSeenEvent, onChange);
    };
}
