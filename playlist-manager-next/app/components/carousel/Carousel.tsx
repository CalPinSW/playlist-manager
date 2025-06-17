'use client';

import React, { FC, ReactNode, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

interface SlideProps {
  children: ReactNode;
}

const Slide: FC<SlideProps> = ({ children }) => {
  return (
    <div className="flex-grow-0 flex-shrink-0 flex-basis-[30%] min-w-0 [transform-style:preserve-3d]">{children}</div>
  );
};

interface CarouselProps {
  slides: ReactNode[];
  startIndex?: number;
  selectedIndex?: number;
}

const Carousel: FC<CarouselProps> = ({ slides, startIndex = 0, selectedIndex }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ skipSnaps: true, startIndex });

  useEffect(() => {
    if (emblaApi && selectedIndex) {
      emblaApi.scrollTo(selectedIndex);
    }
  }, [selectedIndex, emblaApi]);

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex space-x-2">
        {slides.map((slide, index) => (
          <Slide key={index}>{slide}</Slide>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
