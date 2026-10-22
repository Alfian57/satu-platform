import { ArrowRight } from 'lucide-react';

export default function BorrowingSketch() {
    return (
        <div className="journey-sketch" aria-hidden="true">
            <div className="journey-sketch-page">
                <span className="journey-sketch-caption">RUANG BACA</span>
                <div className="journey-book-spines">
                    <span />
                    <span />
                    <span />
                </div>
                <span className="journey-sketch-line" />
                <span className="journey-sketch-line journey-sketch-line--short" />
            </div>
            <div className="journey-sketch-flow">
                <span>
                    01 <strong>Pilih buku</strong>
                </span>
                <ArrowRight className="size-4" />
                <span>
                    02 <strong>Ajukan pinjam</strong>
                </span>
                <ArrowRight className="size-4" />
                <span>
                    03 <strong>Ambil buku</strong>
                </span>
            </div>
        </div>
    );
}
