import React, { FC, ReactNode } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

interface SlideProps {
    children: ReactNode
}

const Slide: FC<SlideProps> = ({children}) => {
    return (
        <div className="flex-grow-0 flex-shrink-0 flex-basis-[30%] min-w-0 [transform-style:preserve-3d]">{children}</div>
  )}

interface CarouselProps {
    slides: ReactNode[]
}

const Carousel: FC<CarouselProps> = ({slides}) => {
  const [emblaRef] = useEmblaCarousel({skipSnaps: true})

  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex space-x-2">
        {slides.map((slide, index) => <Slide key={index}>{slide}</Slide>)}
      </div>
    </div>
  )}

export default Carousel
