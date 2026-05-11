import { useState } from 'react';
import ScrollReveal from '@/components/ScrollReveal';

interface GalleryImage {
  src: string;
  alt: string;
  aspectRatio: string;
}

const galleryImages: GalleryImage[] = [
  { src: '/images/college_onam.jpg', alt: 'Akhil and Ankita celebrating Onam in college', aspectRatio: '5/6' },
  { src: '/images/lego.jpg', alt: 'Akhil and Ankita with a New York Lego set', aspectRatio: '4/5' },
  { src: '/images/walking_pondy_lane.jpg', alt: 'Akhil and Ankita walking after a dinner date in Puducherry', aspectRatio: '2/3' },
  { src: '/images/auto_ride.jpg', alt: 'A selfie during an auto ride', aspectRatio: '1/1' },
];

export default function GallerySection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const remainingCount = Math.max(0, galleryImages.length - 2);

  return (
    <section id="gallery" className="bg-[#F5F1EB] py-[60px] md:py-[100px] px-5 md:px-10">
      <div className="max-w-[1200px] mx-auto">
        <ScrollReveal>
          <p className="section-label mb-3 md:mb-4">Gallery</p>
          <h2 className="section-heading mb-10 md:mb-12">Moments So Far</h2>
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
              className="px-6 py-2.5 border border-[#3B2F2F] text-[#3B2F2F] text-sm tracking-widest uppercase rounded-[4px] transition-colors duration-300 hover:bg-[#3B2F2F] hover:text-white"
            >
              {isExpanded ? 'Show less' : `View all (+${remainingCount})`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
