import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Photo {
  id: string;
  storage_path: string;
  thumbnail_path: string | null;
  width: number | null;
  height: number | null;
  reviewed_at: string | null;
}

const POLL_INTERVAL = 30000; // 30 seconds
const PHOTO_COUNT = 12;

export default function LivePage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const fetchPhotos = useCallback(async () => {
    const { data, error } = await supabase
      .from('photos')
      .select('id, storage_path, thumbnail_path, width, height, reviewed_at')
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: false })
      .limit(PHOTO_COUNT);

    if (error) {
      setError(error.message);
    } else {
      setPhotos(data || []);
      setFeaturedIndex(0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPhotos();
    const interval = setInterval(fetchPhotos, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPhotos]);

  const featured = photos[featuredIndex] || null;
  const thumbs = photos.slice(0, PHOTO_COUNT);

  const getPublicUrl = (path: string | null) => {
    if (!path) return '';
    const { data } = supabase.storage.from('wedding-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="px-5 md:px-10 py-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C4A055] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C4A055]" />
          </span>
          <h1 className="font-serif-display text-lg text-white">Live Moments</h1>
        </div>
        <Link
          to="/"
          className="font-sans-body text-xs font-semibold uppercase tracking-[0.1em] text-white/60 hover:text-[#C4A055] transition-colors"
        >
          Wedding Site
        </Link>
      </header>

      <main className="px-5 md:px-10 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="w-6 h-6 border-2 border-white/20 border-t-[#C4A055] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="font-sans-body text-sm text-white/60">Could not load photos.</p>
            <button
              onClick={fetchPhotos}
              className="mt-4 font-sans-body text-xs font-semibold uppercase tracking-[0.12em] text-[#C4A055] hover:text-white transition-colors"
            >
              Retry
            </button>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-sans-body text-sm text-white/60">No approved photos yet.</p>
            <p className="font-sans-body text-xs text-white/40 mt-2">
              Photos will appear here once they're approved.
            </p>
          </div>
        ) : (
          <>
            {/* Featured photo */}
            {featured && (
              <div className="mb-6 flex items-center justify-center">
                <div className="relative max-w-4xl w-full">
                  <img
                    src={getPublicUrl(featured.storage_path)}
                    alt=""
                    className="w-full max-h-[60vh] object-contain rounded-[4px]"
                  />
                </div>
              </div>
            )}

            {/* Thumbnail strip */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {thumbs.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setFeaturedIndex(idx)}
                  className={`flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-[2px] overflow-hidden transition-all duration-200 ${
                    idx === featuredIndex
                      ? 'ring-2 ring-[#C4A055] ring-offset-2 ring-offset-[#0a0a0a]'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getPublicUrl(photo.thumbnail_path || photo.storage_path)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/upload"
                className="inline-block font-sans-body text-xs font-semibold uppercase tracking-[0.12em] bg-[#C4A055] text-[#3B2F2F] px-6 py-2.5 hover:bg-white transition-colors duration-300"
              >
                Upload Your Photos
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
