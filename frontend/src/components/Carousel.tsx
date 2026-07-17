import { useCallback, useEffect, useState } from "react";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

interface CarouselProps {
    images: string[];
    title: string;
    index: number;
}

export default function ImageCarousel({ images, title, index }: CarouselProps) {
    const [current, setCurrent] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);

    const onTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const diff = touchStart - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
        setTouchStart(null);
    };

    // Add to wrapper: onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}

    const next = useCallback(() => {
        setCurrent(prev => (prev + 1) % images.length);
    }, [images.length]);

    const prev = useCallback(() => {
        setCurrent(prev => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [next, prev]);

    // Auto-advance every 4 seconds
    useEffect(() => {
        if (images.length <= 1) return;
        const timer = setInterval(next, 4000);
        return () => clearInterval(timer);
    }, [images.length, next]);

    if (images.length === 0) {
        return (
            <div className="image-placeholder">
                <span>Project {index + 1}</span>
            </div>
        );
    }

    return (
        <div className="carousel-container" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className="carousel-track" style={{ transform: `translateX(-${current * 100}%)` }}>
                {images.map((img, i) => (
                    <div key={i} className="carousel-slide">
                        <img
                            src={img}
                            alt={`${title} - ${i + 1}`}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                ))}
            </div>

            {images.length > 1 && (
                <>
                    <button className="carousel-btn carousel-prev" onClick={prev} aria-label="Previous image">
                        <FaChevronLeft />
                    </button>
                    <button className="carousel-btn carousel-next" onClick={next} aria-label="Next image">
                        <FaChevronRight />
                    </button>

                    <div className="carousel-dots">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                className={`carousel-dot ${i === current ? 'active' : ''}`}
                                onClick={() => setCurrent(i)}
                                aria-label={`Go to image ${i + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}