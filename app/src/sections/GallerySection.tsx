import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ScrollReveal from '@/components/ScrollReveal';
import { supabase } from '@/lib/supabase';

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

interface GuestPhoto {
  id: string;
  storage_path: string;
  thumbnail_path: string | null;
  width: number | null;
  height: number | null;
  likes_count: number;
}

interface FaceTag {
  photo_id: string;
  person_name: string | null;
  person_slug: string | null;
}

interface GallerySectionProps {
  darkBackground?: boolean;
}

function getClientIpLikeKey(photoId: string) {
  return `ankhil-photo-like-${photoId}`;
}

export default function GallerySection({ darkBackground = false }: GallerySectionProps = {}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [guestPhotos, setGuestPhotos] = useState<GuestPhoto[]>([]);
  const [faceTags, setFaceTags] = useState<FaceTag[]>([]);
  const [faceFilter, setFaceFilter] = useState<string>('');
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [detailPhoto, setDetailPhoto] = useState<GuestPhoto | null>(null);
  const [reportPhoto, setReportPhoto] = useState<GuestPhoto | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [hideDefaults, setHideDefaults] = useState(false);

  const remainingCount = Math.max(0, galleryImages.length - 2);

  const sectionBg = darkBackground ? 'bg-[#3B2F2F]' : 'bg-[#F5F1EB]';
  const labelClass = darkBackground ? 'section-label-light' : 'section-label';
  const headingClass = darkBackground ? 'section-heading-light' : 'section-heading';
  const expandButtonClass = darkBackground
    ? 'px-6 py-2.5 border border-white/60 text-white text-sm tracking-widest uppercase rounded-[4px] transition-colors duration-300 hover:bg-white hover:text-[#3B2F2F]'
    : 'px-6 py-2.5 border border-[#3B2F2F] text-[#3B2F2F] text-sm tracking-widest uppercase rounded-[4px] transition-colors duration-300 hover:bg-[#3B2F2F] hover:text-white';

  useEffect(() => {
    async function load() {
      const [{ data: photos }, { data: config }] = await Promise.all([
        supabase
          .from('photos')
          .select('id, storage_path, thumbnail_path, width, height, likes_count')
          .eq('status', 'approved')
          .order('reviewed_at', { ascending: false }),
        supabase.from('site_config').select('hide_default_photos').maybeSingle(),
      ]);

      setGuestPhotos(photos || []);
      if (config?.hide_default_photos) setHideDefaults(true);

      if (photos && photos.length > 0) {
        const { data: tags } = await supabase
          .from('face_tags')
          .select('photo_id, person_name, person_slug')
          .in(
            'photo_id',
            photos.map((p) => p.id)
          )
          .not('person_name', 'is', null);

        setFaceTags(tags || []);
      }
    }
    load();
  }, []);

  // Restore liked state from localStorage
  useEffect(() => {
    const liked = new Set<string>();
    for (const photo of guestPhotos) {
      if (localStorage.getItem(getClientIpLikeKey(photo.id)) === '1') {
        liked.add(photo.id);
      }
    }
    setLikedSet(liked);
  }, [guestPhotos]);

  const uniquePeople = Array.from(
    new Map(
      faceTags
        .filter((t): t is typeof t & { person_slug: string; person_name: string } => !!t.person_slug && !!t.person_name)
        .map((t) => [t.person_slug, t.person_name])
    ).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const filteredGuestPhotos = faceFilter
    ? guestPhotos.filter((p) => faceTags.some((t) => t.photo_id === p.id && t.person_slug === faceFilter))
    : guestPhotos;

  const getPublicUrl = (path: string | null) => {
    if (!path) return '';
    const { data } = supabase.storage.from('wedding-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleLike = async (photo: GuestPhoto) => {
    if (likedSet.has(photo.id)) return;

    // Optimistic update
    setLikedSet((prev) => new Set(prev).add(photo.id));
    setGuestPhotos((prev) =>
      prev.map((p) => (p.id === photo.id ? { ...p, likes_count: p.likes_count + 1 } : p))
    );
    localStorage.setItem(getClientIpLikeKey(photo.id), '1');

    // Server update
    await supabase.rpc('increment_photo_likes', { photo_id: photo.id });
  };

  const submitReport = async () => {
    if (!reportPhoto) return;
    setReportBusy(true);
    await supabase.from('photo_reports').insert({
      photo_id: reportPhoto.id,
      reason: reportReason.trim() || null,
    });
    setReportBusy(false);
    setReportDone(true);
    setTimeout(() => {
      setReportPhoto(null);
      setReportReason('');
      setReportDone(false);
    }, 2000);
  };

  const hasGuestPhotos = guestPhotos.length > 0;

  return (
    <section id="gallery" className={`${sectionBg} py-[60px] md:py-[100px] px-5 md:px-10`}>
      <div className="max-w-[1200px] mx-auto">
        <ScrollReveal>
          <p className={`${labelClass} mb-3 md:mb-4`}>Gallery</p>
          <h2 className={`${headingClass} mb-6 md:mb-8`}>
            {hasGuestPhotos ? 'Wedding Moments' : 'Moments So Far'}
          </h2>
        </ScrollReveal>

        {/* Upload CTA */}
        <ScrollReveal>
          <div className="mb-8 md:mb-10">
            <Link
              to="/upload"
              className={`inline-flex items-center gap-2 font-sans-body text-xs font-semibold uppercase tracking-[0.12em] px-5 py-2.5 transition-colors duration-300 ${
                darkBackground
                  ? 'bg-[#C4A055] text-[#3B2F2F] hover:bg-white'
                  : 'bg-[#3B2F2F] text-white hover:bg-[#C4A055]'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload Your Photos
            </Link>
            <span className="mx-3 text-[#3B2F2F]/20">|</span>
            <Link
              to="/live"
              className={`inline-flex items-center gap-2 font-sans-body text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-300 ${
                darkBackground ? 'text-white/70 hover:text-[#C4A055]' : 'text-[#3B2F2F]/60 hover:text-[#C4A055]'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C4A055] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C4A055]" />
              </span>
              Live Moments
            </Link>
          </div>
        </ScrollReveal>

        {/* Face filter */}
        {hasGuestPhotos && uniquePeople.length > 0 && (
          <ScrollReveal>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className={`font-sans-body text-xs ${darkBackground ? 'text-white/60' : 'text-[#3B2F2F]/60'}`}>
                Filter:
              </span>
              <button
                onClick={() => setFaceFilter('')}
                className={`font-sans-body text-xs px-3 py-1.5 rounded-full transition-colors ${
                  faceFilter === ''
                    ? 'bg-[#C4A055] text-white'
                    : darkBackground
                    ? 'bg-white/10 text-white/70 hover:bg-white/20'
                    : 'bg-[#3B2F2F]/5 text-[#3B2F2F]/70 hover:bg-[#3B2F2F]/10'
                }`}
              >
                All
              </button>
              {uniquePeople.map(([slug, name]) => (
                <button
                  key={slug}
                  onClick={() => setFaceFilter(slug === faceFilter ? '' : slug)}
                  className={`font-sans-body text-xs px-3 py-1.5 rounded-full transition-colors ${
                    faceFilter === slug
                      ? 'bg-[#C4A055] text-white'
                      : darkBackground
                      ? 'bg-white/10 text-white/70 hover:bg-white/20'
                      : 'bg-[#3B2F2F]/5 text-[#3B2F2F]/70 hover:bg-[#3B2F2F]/10'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Static pre-wedding photos */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-5 space-y-4 md:space-y-5">
          {!hideDefaults && galleryImages.map((img, i) => (
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
                <div className="absolute inset-0 bg-[rgba(59,47,47,0.25)] opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-end">
                  <div className="w-full h-px bg-[#C4A055]" />
                </div>
              </div>
            </ScrollReveal>
          ))}

          {/* Guest photos mixed in */}
          {filteredGuestPhotos.map((photo, i) => (
            <ScrollReveal key={photo.id} delay={i * 0.08}>
              <div className="break-inside-avoid relative group overflow-hidden rounded-[4px]">
                <img
                  src={getPublicUrl(photo.thumbnail_path || photo.storage_path)}
                  alt=""
                  className="w-full object-cover transition-all duration-400 group-hover:brightness-105 cursor-pointer"
                  style={{ aspectRatio: photo.width && photo.height ? `${photo.width}/${photo.height}` : '4/3' }}
                  loading="lazy"
                  onClick={() => setDetailPhoto(photo)}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(photo);
                      }}
                      className="flex items-center gap-1.5 text-white/90 hover:text-[#C4A055] transition-colors"
                    >
                      <svg
                        className={`w-4 h-4 ${likedSet.has(photo.id) ? 'fill-current text-[#C4A055]' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                      <span className="font-sans-body text-xs">{photo.likes_count}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportPhoto(photo);
                      }}
                      className="text-white/60 hover:text-[#7B2D41] transition-colors"
                      title="Report photo"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Mobile expand/collapse toggle */}
        {remainingCount > 0 && !hideDefaults && !hasGuestPhotos && (
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

      {/* Detail modal */}
      {detailPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-10"
          onClick={() => setDetailPhoto(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setDetailPhoto(null)}
              className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={getPublicUrl(detailPhoto.storage_path)}
              alt=""
              className="max-w-full max-h-[80vh] object-contain rounded-[4px]"
            />
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={() => handleLike(detailPhoto)}
                className={`flex items-center gap-2 text-white/80 hover:text-[#C4A055] transition-colors ${
                  likedSet.has(detailPhoto.id) ? 'text-[#C4A055]' : ''
                }`}
              >
                <svg
                  className={`w-5 h-5 ${likedSet.has(detailPhoto.id) ? 'fill-current' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                <span className="font-sans-body text-sm">{detailPhoto.likes_count}</span>
              </button>
              <button
                onClick={() => {
                  setReportPhoto(detailPhoto);
                  setDetailPhoto(null);
                }}
                className="flex items-center gap-2 text-white/50 hover:text-[#7B2D41] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                <span className="font-sans-body text-xs">Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {reportPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setReportPhoto(null)}
        >
          <div
            className="bg-[#F5F1EB] rounded-[4px] p-6 w-full max-w-[400px]"
            onClick={(e) => e.stopPropagation()}
          >
            {reportDone ? (
              <div className="text-center py-4">
                <p className="font-sans-body text-sm text-[#3D6B5B]">Report submitted. Thank you.</p>
              </div>
            ) : (
              <>
                <h3 className="font-serif-display text-lg text-[#3B2F2F] mb-4">Report this photo?</h3>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Optional reason..."
                  rows={3}
                  className="w-full bg-white border border-[rgba(59,47,47,0.15)] rounded-[2px] px-3 py-2 font-sans-body text-sm text-[#3B2F2F] placeholder:text-[#3B2F2F]/40 focus:border-[#C4A055] focus:outline-none focus:ring-2 focus:ring-[rgba(196,160,85,0.15)] transition-all duration-200 resize-y mb-4"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={submitReport}
                    disabled={reportBusy}
                    className="font-sans-body text-xs font-semibold uppercase tracking-[0.12em] bg-[#3B2F2F] text-white px-6 py-2.5 hover:bg-[#C4A055] transition-colors disabled:opacity-50"
                  >
                    {reportBusy ? 'Submitting...' : 'Submit Report'}
                  </button>
                  <button
                    onClick={() => setReportPhoto(null)}
                    className="font-sans-body text-xs font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/60 hover:text-[#3B2F2F] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
