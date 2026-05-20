import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { loadFaceApiModels, detectFaces, euclideanDistance } from '@/lib/faceApi';

interface Photo {
  id: string;
  created_at: string;
  storage_path: string;
  thumbnail_path: string | null;
  filename: string;
  file_size: number | null;
  width: number | null;
  height: number | null;
  device_make: string | null;
  device_model: string | null;
  exif_date: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at: string | null;
  visible_from: string | null;
  likes_count: number;
  face_detection_done: boolean;
}

interface FaceTag {
  id: string;
  person_name: string | null;
  person_slug: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  face_descriptor: number[] | null;
}

interface KnownFace {
  id: string;
  person_slug: string;
  person_name: string;
  avg_descriptor: number[];
  sample_count: number;
}

interface PhotoReport {
  id: string;
  photo_id: string;
  reason: string | null;
  resolved: boolean;
  created_at: string;
}

interface BatchSuggestion {
  person_slug: string;
  person_name: string;
  faceTagIds: string[];
}

type PhotoFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'reports';

function formatBytes(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminPhotoSection() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [faceTags, setFaceTags] = useState<Record<string, FaceTag[]>>({});
  const [knownFaces, setKnownFaces] = useState<KnownFace[]>([]);
  const [reports, setReports] = useState<PhotoReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PhotoFilter>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [detailPhoto, setDetailPhoto] = useState<Photo | null>(null);
  const [detailTags, setDetailTags] = useState<FaceTag[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [reportsMap, setReportsMap] = useState<Record<string, PhotoReport[]>>({});
  const [detectingIds, setDetectingIds] = useState<Set<string>>(new Set());
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [batchSuggestions, setBatchSuggestions] = useState<BatchSuggestion[]>([]);
  const [namingTagId, setNamingTagId] = useState<string | null>(null);
  const [namingValue, setNamingValue] = useState('');
  const detectionQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  }, []);

  const fetchReports = useCallback(async () => {
    const { data } = await supabase
      .from('photo_reports')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false });
    const reps = data || [];
    setReports(reps);
    const map: Record<string, PhotoReport[]> = {};
    for (const r of reps) {
      if (!map[r.photo_id]) map[r.photo_id] = [];
      map[r.photo_id].push(r);
    }
    setReportsMap(map);
  }, []);

  const fetchKnownFaces = useCallback(async () => {
    const { data } = await supabase.from('known_faces').select('*');
    setKnownFaces(data || []);
  }, []);

  useEffect(() => {
    fetchPhotos();
    fetchReports();
    fetchKnownFaces();
  }, [fetchPhotos, fetchReports, fetchKnownFaces]);

  const fetchFaceTags = useCallback(async (photoIds: string[]) => {
    if (photoIds.length === 0) return;
    const { data } = await supabase
      .from('face_tags')
      .select('id, photo_id, person_name, person_slug, x, y, width, height, face_descriptor')
      .in('photo_id', photoIds);
    const map: Record<string, FaceTag[]> = {};
    for (const tag of data || []) {
      if (!map[tag.photo_id]) map[tag.photo_id] = [];
      map[tag.photo_id].push(tag);
    }
    setFaceTags((prev) => ({ ...prev, ...map }));
  }, []);

  useEffect(() => {
    const visibleIds = filteredPhotos.map((p) => p.id);
    const missing = visibleIds.filter((id) => !faceTags[id]);
    if (missing.length > 0) {
      fetchFaceTags(missing);
    }
  }, [photos, filter]);

  // Auto-start face detection
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setModelsLoading(true);
      try {
        await loadFaceApiModels();
        if (!cancelled) setModelsReady(true);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setModelsLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Background detection queue
  useEffect(() => {
    if (!modelsReady) return;

    const pendingDetection = photos
      .filter((p) => !p.face_detection_done && !detectingIds.has(p.id))
      .map((p) => p.id);

    if (pendingDetection.length > 0) {
      detectionQueueRef.current = pendingDetection;
      processQueue();
    }
  }, [modelsReady, photos]);

  async function processQueue() {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    while (detectionQueueRef.current.length > 0) {
      const photoId = detectionQueueRef.current.shift();
      if (!photoId) continue;

      const photo = photos.find((p) => p.id === photoId);
      if (!photo || photo.face_detection_done) continue;

      setDetectingIds((prev) => new Set(prev).add(photoId));

      try {
        const { data } = supabase.storage.from('wedding-photos').getPublicUrl(photo.storage_path);
        const detections = await detectFaces(data.publicUrl);

        if (detections.length > 0) {
          const rows = detections.map((d) => ({
            photo_id: photoId,
            x: d.x,
            y: d.y,
            width: d.width,
            height: d.height,
            face_descriptor: Array.from(d.descriptor) as number[],
          }));

          const { data: inserted } = await supabase.from('face_tags').insert(rows).select();

          // Try to match against known faces
          if (inserted && knownFaces.length > 0) {
            const updates: { id: string; person_name: string; person_slug: string }[] = [];
            for (const tag of inserted) {
              const desc = tag.face_descriptor as number[];
              let bestMatch: KnownFace | null = null;
              let bestDist = Infinity;
              for (const kf of knownFaces) {
                const dist = euclideanDistance(desc, kf.avg_descriptor);
                if (dist < 0.6 && dist < bestDist) {
                  bestDist = dist;
                  bestMatch = kf;
                }
              }
              if (bestMatch) {
                updates.push({
                  id: tag.id,
                  person_name: bestMatch.person_name,
                  person_slug: bestMatch.person_slug,
                });
              }
            }
            if (updates.length > 0) {
              for (const u of updates) {
                await supabase
                  .from('face_tags')
                  .update({ person_name: u.person_name, person_slug: u.person_slug })
                  .eq('id', u.id);
              }
            }
          }

          setFaceTags((prev) => ({
            ...prev,
            [photoId]: (inserted || []).map((t) => ({
              id: t.id,
              person_name: t.person_name,
              person_slug: t.person_slug,
              x: t.x,
              y: t.y,
              width: t.width,
              height: t.height,
              face_descriptor: t.face_descriptor as number[] | null,
            })),
          }));
        }

        await supabase.from('photos').update({ face_detection_done: true }).eq('id', photoId);
        setPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? { ...p, face_detection_done: true } : p))
        );
      } catch {
        // Detection failed for this photo, skip
      } finally {
        setDetectingIds((prev) => {
          const next = new Set(prev);
          next.delete(photoId);
          return next;
        });
      }

      // Yield to UI thread
      await new Promise((r) => setTimeout(r, 100));
    }

    isProcessingRef.current = false;
  }

  const filteredPhotos = photos.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'reports') return reportsMap[p.id]?.length > 0;
    return p.status === filter;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filteredPhotos.map((p) => p.id)));
  const selectNone = () => setSelectedIds(new Set());

  const getPublicUrl = (path: string | null) => {
    if (!path) return '';
    const { data } = supabase.storage.from('wedding-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const updateStatus = async (ids: string[], status: 'approved' | 'rejected') => {
    const newBusy = new Set(ids);
    setBusyIds((prev) => new Set([...prev, ...newBusy]));
    const updates = ids.map((id) =>
      supabase.from('photos').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id)
    );
    await Promise.all(updates);
    setPhotos((prev) =>
      prev.map((p) =>
        ids.includes(p.id) ? { ...p, status, reviewed_at: new Date().toISOString() } : p
      )
    );
    setBusyIds((prev) => {
      const next = new Set(prev);
      newBusy.forEach((id) => next.delete(id));
      return next;
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      newBusy.forEach((id) => next.delete(id));
      return next;
    });
  };

  const deletePhotos = async (ids: string[]) => {
    if (!confirm(`Permanently delete ${ids.length} photo(s)? This cannot be undone.`)) return;
    const newBusy = new Set(ids);
    setBusyIds((prev) => new Set([...prev, ...newBusy]));
    const paths = ids
      .map((id) => photos.find((p) => p.id === id)?.storage_path)
      .filter(Boolean) as string[];
    if (paths.length > 0) {
      await supabase.storage.from('wedding-photos').remove(paths);
    }
    await supabase.from('photos').delete().in('id', ids);
    setPhotos((prev) => prev.filter((p) => !ids.includes(p.id)));
    setBusyIds((prev) => {
      const next = new Set(prev);
      newBusy.forEach((id) => next.delete(id));
      return next;
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      newBusy.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    await updateStatus(Array.from(selectedIds), 'approved');
    setBulkBusy(false);
  };
  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    await updateStatus(Array.from(selectedIds), 'rejected');
    setBulkBusy(false);
  };
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    await deletePhotos(Array.from(selectedIds));
    setBulkBusy(false);
  };

  const openDetail = (photo: Photo) => {
    setDetailPhoto(photo);
    setDetailTags(faceTags[photo.id] || []);
    setBatchSuggestions([]);
    setNamingTagId(null);
    setNamingValue('');
  };

  const resolveReport = async (reportId: string, resolution: 'kept' | 'removed') => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;
    await supabase
      .from('photo_reports')
      .update({ resolved: true, resolved_at: new Date().toISOString(), resolution })
      .eq('id', reportId);
    if (resolution === 'removed') {
      await updateStatus([report.photo_id], 'rejected');
    }
    fetchReports();
  };

  const handleNameFace = async (tagId: string, name: string) => {
    const slug = name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!slug) return;

    await supabase
      .from('face_tags')
      .update({ person_name: name.trim(), person_slug: slug, named_by_admin: true })
      .eq('id', tagId);

    // Update known_faces
    const tag = detailTags.find((t) => t.id === tagId);
    if (tag?.face_descriptor) {
      const { data: existing } = await supabase
        .from('known_faces')
        .select('*')
        .eq('person_slug', slug)
        .maybeSingle();

      if (existing) {
        const avg = existing.avg_descriptor.map((v: number, i: number) =>
          (v * existing.sample_count + tag.face_descriptor![i]) / (existing.sample_count + 1)
        );
        await supabase
          .from('known_faces')
          .update({ avg_descriptor: avg, sample_count: existing.sample_count + 1 })
          .eq('id', existing.id);
      } else {
        await supabase.from('known_faces').insert({
          person_slug: slug,
          person_name: name.trim(),
          avg_descriptor: tag.face_descriptor,
          sample_count: 1,
        });
      }
      fetchKnownFaces();
    }

    setDetailTags((prev) =>
      prev.map((t) => (t.id === tagId ? { ...t, person_name: name.trim(), person_slug: slug } : t))
    );
    setFaceTags((prev) => {
      const photoId = detailPhoto?.id;
      if (!photoId || !prev[photoId]) return prev;
      return {
        ...prev,
        [photoId]: prev[photoId].map((t) =>
          t.id === tagId ? { ...t, person_name: name.trim(), person_slug: slug } : t
        ),
      };
    });
    setNamingTagId(null);
    setNamingValue('');

    // Find batch suggestions
    findBatchSuggestions(tagId, slug, name.trim());
  };

  const findBatchSuggestions = async (namedTagId: string, personSlug: string, personName: string) => {
    const namedTag = detailTags.find((t) => t.id === namedTagId);
    if (!namedTag?.face_descriptor) return;

    // Find all unnamed face tags across all photos
    const { data: unnamedTags } = await supabase
      .from('face_tags')
      .select('id, photo_id, face_descriptor')
      .is('person_name', null);

    const matches: string[] = [];
    for (const t of unnamedTags || []) {
      if (!t.face_descriptor) continue;
      const dist = euclideanDistance(namedTag.face_descriptor, t.face_descriptor as number[]);
      if (dist < 0.55) {
        matches.push(t.id);
      }
    }

    if (matches.length > 0) {
      setBatchSuggestions([{ person_slug: personSlug, person_name: personName, faceTagIds: matches }]);
    }
  };

  const confirmBatchSuggestion = async (suggestion: BatchSuggestion) => {
    const { data: unnamedTags } = await supabase
      .from('face_tags')
      .select('id, face_descriptor')
      .in('id', suggestion.faceTagIds);

    // Update all matching tags
    await supabase
      .from('face_tags')
      .update({
        person_name: suggestion.person_name,
        person_slug: suggestion.person_slug,
        named_by_admin: true,
      })
      .in('id', suggestion.faceTagIds);

    // Update known_faces with averaged descriptor
    const known = knownFaces.find((k) => k.person_slug === suggestion.person_slug);
    const allDescriptors: number[][] = [];
    if (known) allDescriptors.push(known.avg_descriptor);
    for (const t of unnamedTags || []) {
      if (t.face_descriptor) allDescriptors.push(t.face_descriptor as number[]);
    }

    if (allDescriptors.length > 0) {
      const len = allDescriptors[0].length;
      const avg = new Array(len).fill(0);
      for (const d of allDescriptors) {
        for (let i = 0; i < len; i++) avg[i] += d[i];
      }
      for (let i = 0; i < len; i++) avg[i] /= allDescriptors.length;

      await supabase
        .from('known_faces')
        .update({ avg_descriptor: avg, sample_count: allDescriptors.length })
        .eq('person_slug', suggestion.person_slug);
      fetchKnownFaces();
    }

    // Refresh face tags
    const photoIds = Array.from(new Set((unnamedTags || []).map((t) => t.id)));
    if (photoIds.length > 0) await fetchFaceTags(photoIds);
    setBatchSuggestions([]);
  };

  const pendingCount = photos.filter((p) => p.status === 'pending').length;
  const approvedCount = photos.filter((p) => p.status === 'approved').length;
  const rejectedCount = photos.filter((p) => p.status === 'rejected').length;
  const reportCount = reports.length;

  return (
    <div>
      {/* Models loading indicator */}
      {modelsLoading && (
        <div className="mb-4 p-3 bg-white border border-[rgba(59,47,47,0.1)] rounded-[2px] flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-[#C4A055]/30 border-t-[#C4A055] rounded-full animate-spin" />
          <p className="font-sans-body text-xs text-[#3B2F2F]/70">Loading face detection models...</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(
          [
            ['all', 'All', photos.length],
            ['pending', 'Pending', pendingCount],
            ['approved', 'Approved', approvedCount],
            ['rejected', 'Rejected', rejectedCount],
            ['reports', 'Reports', reportCount],
          ] as [PhotoFilter, string, number][]
        ).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => {
              setFilter(key);
              setSelectedIds(new Set());
            }}
            className={`font-sans-body text-xs font-semibold uppercase tracking-[0.1em] px-4 py-2 transition-colors duration-200 ${
              filter === key
                ? 'bg-[#3B2F2F] text-white'
                : 'bg-white text-[#3B2F2F]/70 hover:text-[#3B2F2F] border border-[rgba(59,47,47,0.15)]'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-white border border-[rgba(59,47,47,0.1)] rounded-[2px] flex flex-wrap items-center gap-3">
          <span className="font-sans-body text-sm text-[#3B2F2F]">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkApprove}
              disabled={bulkBusy}
              className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.1em] bg-[#3D6B5B] text-white px-4 py-2 hover:bg-[#3B2F2F] transition-colors disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={handleBulkReject}
              disabled={bulkBusy}
              className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.1em] bg-[#7B2D41] text-white px-4 py-2 hover:bg-[#3B2F2F] transition-colors disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkBusy}
              className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.1em] bg-[#3B2F2F] text-white px-4 py-2 hover:bg-[#7B2D41] transition-colors disabled:opacity-50"
            >
              Delete
            </button>
            <button
              onClick={selectNone}
              disabled={bulkBusy}
              className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.1em] text-[#3B2F2F]/60 hover:text-[#3B2F2F] px-3 py-2 transition-colors disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {filter !== 'reports' && selectedIds.size === 0 && filteredPhotos.length > 0 && (
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={selectAll}
            className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.1em] text-[#3B2F2F]/60 hover:text-[#3B2F2F] transition-colors"
          >
            Select all
          </button>
        </div>
      )}

      {loading && <p className="font-sans-body text-sm text-[#3B2F2F]/70">Loading photos...</p>}
      {error && (
        <div className="p-4 bg-[#7B2D41]/10 border border-[#7B2D41]/30 rounded-[2px]">
          <p className="font-sans-body text-sm text-[#7B2D41]">Error: {error}</p>
        </div>
      )}

      {!loading && !error && filter === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <p className="font-sans-body text-sm text-[#3B2F2F]/50">No unresolved reports.</p>
          ) : (
            reports.map((report) => {
              const photo = photos.find((p) => p.id === report.photo_id);
              if (!photo) return null;
              return (
                <div
                  key={report.id}
                  className="p-4 bg-white border border-[rgba(59,47,47,0.1)] rounded-[2px] flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <button onClick={() => openDetail(photo)} className="flex-shrink-0">
                    <img
                      src={getPublicUrl(photo.thumbnail_path || photo.storage_path)}
                      alt=""
                      className="w-24 h-24 object-cover rounded-[2px]"
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans-body text-sm text-[#3B2F2F] mb-1">Reported photo</p>
                    <p className="font-sans-body text-xs text-[#3B2F2F]/60">
                      {formatBytes(photo.file_size)} · {photo.device_make || 'Unknown device'}
                    </p>
                    {report.reason && (
                      <p className="font-sans-body text-xs text-[#7B2D41] mt-1">Reason: {report.reason}</p>
                    )}
                    <p className="font-sans-body text-[11px] text-[#3B2F2F]/40 mt-1">
                      Reported {formatDate(report.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => resolveReport(report.id, 'kept')}
                      className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.1em] bg-[#3D6B5B] text-white px-4 py-2 hover:bg-[#3B2F2F] transition-colors"
                    >
                      Keep
                    </button>
                    <button
                      onClick={() => resolveReport(report.id, 'removed')}
                      className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.1em] bg-[#7B2D41] text-white px-4 py-2 hover:bg-[#3B2F2F] transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {!loading && !error && filter !== 'reports' && (
        <>
          {filteredPhotos.length === 0 ? (
            <p className="font-sans-body text-sm text-[#3B2F2F]/50">No photos in this category.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredPhotos.map((photo) => {
                const isSelected = selectedIds.has(photo.id);
                const isBusy = busyIds.has(photo.id);
                const isDetecting = detectingIds.has(photo.id);
                const tags = faceTags[photo.id] || [];
                const photoReports = reportsMap[photo.id] || [];

                return (
                  <div
                    key={photo.id}
                    className={`relative group bg-white border rounded-[2px] overflow-hidden cursor-pointer transition-all duration-150 ${
                      isSelected ? 'border-[#C4A055] ring-1 ring-[#C4A055]' : 'border-[rgba(59,47,47,0.1)]'
                    } ${isBusy ? 'opacity-60' : ''}`}
                    onClick={() => toggleSelect(photo.id)}
                  >
                    {/* Checkbox */}
                    <div
                      className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-[2px] border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#C4A055] border-[#C4A055]'
                          : 'bg-white/80 border-[rgba(59,47,47,0.3)] opacity-0 group-hover:opacity-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(photo.id);
                      }}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </div>

                    {/* Report badge */}
                    {photoReports.length > 0 && (
                      <div className="absolute top-2 right-2 z-10 bg-[#7B2D41] text-white text-[10px] font-semibold px-2 py-0.5 rounded-[2px]">
                        🚩 {photoReports.length}
                      </div>
                    )}

                    {/* Thumbnail */}
                    <div className="aspect-square bg-[#F5F1EB]">
                      <img
                        src={getPublicUrl(photo.thumbnail_path || photo.storage_path)}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            photo.status === 'pending'
                              ? 'bg-[#C4A055]/10 text-[#C4A055]'
                              : photo.status === 'approved'
                              ? 'bg-[#3D6B5B]/10 text-[#3D6B5B]'
                              : 'bg-[#7B2D41]/10 text-[#7B2D41]'
                          }`}
                        >
                          {photo.status}
                        </span>
                        {tags.length > 0 && (
                          <span className="text-[10px] text-[#3B2F2F]/50">👤 {tags.length}</span>
                        )}
                        {isDetecting && (
                          <span className="text-[10px] text-[#C4A055]">🔍 ...</span>
                        )}
                        {!photo.face_detection_done && !isDetecting && (
                          <span className="text-[10px] text-[#3B2F2F]/30">—</span>
                        )}
                      </div>
                      <p className="font-sans-body text-[10px] text-[#3B2F2F]/60 truncate">
                        {formatBytes(photo.file_size)}
                      </p>
                      <p className="font-sans-body text-[10px] text-[#3B2F2F]/40 truncate">
                        {photo.device_make || 'Unknown'}
                      </p>
                    </div>

                    {/* Hover actions */}
                    <button
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#3B2F2F] text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-[2px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetail(photo);
                      }}
                    >
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {detailPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 md:p-10"
          onClick={() => setDetailPhoto(null)}
        >
          <div
            className="bg-[#F5F1EB] rounded-[4px] max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif-display text-lg text-[#3B2F2F]">Photo Details</h3>
                <button
                  onClick={() => setDetailPhoto(null)}
                  className="w-8 h-8 flex items-center justify-center text-[#3B2F2F]/60 hover:text-[#3B2F2F] transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Photo with face overlay */}
              <div className="mb-4 relative">
                <img
                  src={getPublicUrl(detailPhoto.storage_path)}
                  alt=""
                  className="w-full max-h-[50vh] object-contain rounded-[2px] bg-black/5"
                />
                {detailTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="absolute border-2 border-[#C4A055] rounded-[2px] cursor-pointer hover:bg-[#C4A055]/20 transition-colors"
                    style={{
                      left: `${tag.x * 100}%`,
                      top: `${tag.y * 100}%`,
                      width: `${tag.width * 100}%`,
                      height: `${tag.height * 100}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setNamingTagId(tag.id);
                      setNamingValue(tag.person_name || '');
                    }}
                  >
                    <div className="absolute -top-5 left-0 bg-[#C4A055] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-[2px] whitespace-nowrap">
                      {tag.person_name || '?'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Batch suggestions */}
              {batchSuggestions.length > 0 && (
                <div className="mb-4 p-3 bg-[#C4A055]/10 border border-[#C4A055]/30 rounded-[2px]">
                  <p className="font-sans-body text-sm text-[#3B2F2F] mb-2">
                    Found {batchSuggestions[0].faceTagIds.length} similar faces across photos
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => confirmBatchSuggestion(batchSuggestions[0])}
                      className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.1em] bg-[#3D6B5B] text-white px-4 py-2 hover:bg-[#3B2F2F] transition-colors"
                    >
                      Confirm all as {batchSuggestions[0].person_name}
                    </button>
                    <button
                      onClick={() => setBatchSuggestions([])}
                      className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.1em] text-[#3B2F2F]/60 hover:text-[#3B2F2F] transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Naming input */}
              {namingTagId && (
                <div className="mb-4 p-3 bg-white border border-[rgba(59,47,47,0.15)] rounded-[2px]">
                  <label className="block font-sans-body text-xs text-[#3B2F2F]/70 mb-1">Name this person</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={namingValue}
                      onChange={(e) => setNamingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNameFace(namingTagId, namingValue);
                        if (e.key === 'Escape') {
                          setNamingTagId(null);
                          setNamingValue('');
                        }
                      }}
                      placeholder="e.g. Akhil"
                      autoFocus
                      className="flex-1 bg-white border border-[rgba(59,47,47,0.15)] rounded-[2px] px-3 py-2 font-sans-body text-sm text-[#3B2F2F] placeholder:text-[#3B2F2F]/40 focus:border-[#C4A055] focus:outline-none focus:ring-2 focus:ring-[rgba(196,160,85,0.15)] transition-all duration-200"
                    />
                    <button
                      onClick={() => handleNameFace(namingTagId, namingValue)}
                      className="font-sans-body text-xs font-semibold uppercase tracking-[0.1em] bg-[#3D6B5B] text-white px-4 py-2 hover:bg-[#3B2F2F] transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setNamingTagId(null);
                        setNamingValue('');
                      }}
                      className="font-sans-body text-xs font-semibold uppercase tracking-[0.1em] text-[#3B2F2F]/60 hover:text-[#3B2F2F] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {knownFaces.map((kf) => (
                      <button
                        key={kf.person_slug}
                        onClick={() => {
                          setNamingValue(kf.person_name);
                          handleNameFace(namingTagId, kf.person_name);
                        }}
                        className="font-sans-body text-[11px] px-2 py-1 bg-[#3B2F2F]/5 text-[#3B2F2F]/70 rounded-full hover:bg-[#C4A055]/10 hover:text-[#C4A055] transition-colors"
                      >
                        {kf.person_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                <div>
                  <p className="font-sans-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/50">Status</p>
                  <p className="font-sans-body text-sm text-[#3B2F2F] capitalize">{detailPhoto.status}</p>
                </div>
                <div>
                  <p className="font-sans-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/50">Size</p>
                  <p className="font-sans-body text-sm text-[#3B2F2F]">{formatBytes(detailPhoto.file_size)}</p>
                </div>
                <div>
                  <p className="font-sans-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/50">Dimensions</p>
                  <p className="font-sans-body text-sm text-[#3B2F2F]">
                    {detailPhoto.width ?? '—'} × {detailPhoto.height ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="font-sans-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/50">Device</p>
                  <p className="font-sans-body text-sm text-[#3B2F2F]">
                    {detailPhoto.device_make || '—'} {detailPhoto.device_model || ''}
                  </p>
                </div>
                <div>
                  <p className="font-sans-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/50">Photo Date</p>
                  <p className="font-sans-body text-sm text-[#3B2F2F]">{formatDate(detailPhoto.exif_date)}</p>
                </div>
                <div>
                  <p className="font-sans-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/50">Uploaded</p>
                  <p className="font-sans-body text-sm text-[#3B2F2F]">{formatDate(detailPhoto.created_at)}</p>
                </div>
              </div>

              {detailTags.length > 0 && (
                <div className="mb-6">
                  <p className="font-sans-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/50 mb-2">
                    Tagged People ({detailTags.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {detailTags.map((tag) => (
                      <span
                        key={tag.id}
                        className={`font-sans-body text-xs px-3 py-1 rounded-full cursor-pointer ${
                          tag.person_name
                            ? 'bg-[#3D6B5B]/10 text-[#3D6B5B]'
                            : 'bg-[#C4A055]/10 text-[#C4A055]'
                        }`}
                        onClick={() => {
                          setNamingTagId(tag.id);
                          setNamingValue(tag.person_name || '');
                        }}
                      >
                        {tag.person_name || 'Unnamed face'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {detailPhoto.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        updateStatus([detailPhoto.id], 'approved');
                        setDetailPhoto(null);
                      }}
                      className="font-sans-body text-xs font-semibold uppercase tracking-[0.12em] bg-[#3D6B5B] text-white px-6 py-2.5 hover:bg-[#3B2F2F] transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        updateStatus([detailPhoto.id], 'rejected');
                        setDetailPhoto(null);
                      }}
                      className="font-sans-body text-xs font-semibold uppercase tracking-[0.12em] bg-[#7B2D41] text-white px-6 py-2.5 hover:bg-[#3B2F2F] transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                {detailPhoto.status === 'approved' && (
                  <button
                    onClick={() => {
                      updateStatus([detailPhoto.id], 'rejected');
                      setDetailPhoto(null);
                    }}
                    className="font-sans-body text-xs font-semibold uppercase tracking-[0.12em] bg-[#7B2D41] text-white px-6 py-2.5 hover:bg-[#3B2F2F] transition-colors"
                  >
                    Reject
                  </button>
                )}
                {detailPhoto.status === 'rejected' && (
                  <button
                    onClick={() => {
                      updateStatus([detailPhoto.id], 'approved');
                      setDetailPhoto(null);
                    }}
                    className="font-sans-body text-xs font-semibold uppercase tracking-[0.12em] bg-[#3D6B5B] text-white px-6 py-2.5 hover:bg-[#3B2F2F] transition-colors"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => {
                    deletePhotos([detailPhoto.id]);
                    setDetailPhoto(null);
                  }}
                  className="font-sans-body text-xs font-semibold uppercase tracking-[0.12em] text-[#7B2D41] border border-[#7B2D41]/30 px-6 py-2.5 hover:bg-[#7B2D41] hover:text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
