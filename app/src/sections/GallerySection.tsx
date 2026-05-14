import { useState } from 'react';
import ScrollReveal from '@/components/ScrollReveal';

interface GalleryImage {
  src: string;
  alt: string;
  aspectRatio: string;
}

const galleryImages: GalleryImage[] = [
  { src: '/images/college_onam.jpg', alt: 'Akhil and Ankita celebrating Onam in college', aspectRatio: '5/6' },
  { src: '/images/lego_comp.jpg', alt: 'Akhil and Ankita with a New York Lego set', aspectRatio: '4/5' },
  { src: '/images/walking_pondy_lane.jpg', alt: 'Akhil and Ankita walking after a dinner date in Puducherry', aspectRatio: '2/3' },
  { src: '/images/auto_ride_comp.jpg', alt: 'A selfie during an auto ride', aspectRatio: '1/1' },
];

interface GallerySectionProps {
  /** When true, the section renders on dark-brown background with light
   * heading/label. Used to preserve the cream/dark alternation when the
   * FAQ section directly above is hidden — otherwise Travel → Gallery →
   * Footer would all be cream. */
  darkBackground?: boolean;
}

export default function GallerySection({ darkBackground = false }: GallerySectionProps = {}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const remainingCount = Math.max(0, galleryImages.length - 2);

  const sectionBg = darkBackground ? 'bg-[#3B2F2F]' : 'bg-[#F5F1EB]';
  const labelClass = darkBackground ? 'section-label-light' : 'section-label';
  const headingClass = darkBackground ? 'section-heading-light' : 'section-heading';
  // Mobile "View all" button — needs an inverted treatment on dark backgrounds.
  const expandButtonClass = darkBackground
    ? 'px-6 py-2.5 border border-white/60 text-white text-sm tracking-widest uppercase rounded-[4px] transition-colors duration-300 hover:bg-white hover:text-[#3B2F2F]'
    : 'px-6 py-2.5 border border-[#3B2F2F] text-[#3B2F2F] text-sm tracking-widest uppercase rounded-[4px] transition-colors duration-300 hover:bg-[#3B2F2F] hover:text-white';

  return (
    <section id="gallery" className={`${sectionBg} py-[60px] md:py-[100px] px-5 md:px-10`}>
      <div className="max-w-[1200px] mx-auto">
        <ScrollReveal>
          <p className={`${labelClass} mb-3 md:mb-4`}>Gallery</p>
          <h2 className={`${headingClass} mb-10 md:mb-12`}>Moments So Far</h2>
        </ScrollReveal>

        {/* Masonry grid using CSS columns */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-5 space-y-4 md:space-y-5">
          {galleryImages.map((img, i) => (
            <ScrollReveal
              key={img.src}
              delay={i * 0.12}
              className={i >= 2 ? (isExpanded ? 'block' : 'hidden sm:block') : 'block'}
            >
              <div className="break-inside-avoid relative group overflow-hidden rounded-[4px]">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full object-cover transition-all duration-400 group-hover:brightness-105"
                  style={{ aspectRatio: img.aspectRatio }}
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[rgba(59,47,47,0.25)] opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-end">
                  <div className="w-full h-px bg-[#C4A055]" />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Mobile expand/collapse toggle */}
        {remainingCount > 0 && (
          <div className="mt-6 flex justify-center sm:hidden">
            <button
              type="button"
              onClick={() => setIsExpanded((p) => !p)}
              className={expandButtonClass}
            >
              {isExpanded ? 'Show less' : `View all (+${remainingCount})`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
