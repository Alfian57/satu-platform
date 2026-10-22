import { Button } from '@/components/ui/button';

type Props = {
    currentPage: number;
    lastPage: number;
    disabled: boolean;
    isReadProcessing: boolean;
    isUploadProcessing: boolean;
    onPageChange: (page: number) => void;
};

export function EvidencePagination({
    currentPage,
    lastPage,
    disabled,
    isReadProcessing,
    isUploadProcessing,
    onPageChange,
}: Props) {
    if (lastPage <= 1) {
        return null;
    }

    return (
        <nav
            aria-label="Halaman bukti privat"
            className="flex flex-wrap items-center gap-2"
        >
            <Button
                variant="outline"
                disabled={
                    disabled ||
                    isReadProcessing ||
                    isUploadProcessing ||
                    currentPage <= 1
                }
                onClick={() => onPageChange(currentPage - 1)}
            >
                Sebelumnya
            </Button>
            <span className="text-xs">
                {currentPage} / {lastPage}
            </span>
            <Button
                variant="outline"
                disabled={
                    disabled ||
                    isReadProcessing ||
                    isUploadProcessing ||
                    currentPage >= lastPage
                }
                onClick={() => onPageChange(currentPage + 1)}
            >
                Berikutnya
            </Button>
        </nav>
    );
}
