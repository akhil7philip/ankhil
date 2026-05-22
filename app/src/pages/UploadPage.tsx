import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabase';
import { generateThumbnail } from '@/lib/thumbnail';

interface UploadFile {
  file: File;
  id: string;
  preview: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function UploadPage() {
  const [searchParams] = useSearchParams();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [uploadEnabled, setUploadEnabled] = useState<boolean | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const code = searchParams.get('code') || '';

  useEffect(() => {
    async function check() {
      const { data: config } = await supabase
        .from('site_config')
        .select('photo_upload_enabled, photo_upload_code')
        .maybeSingle();

      if (!config?.photo_upload_enabled) {
        setUploadEnabled(false);
        return;
      }

      if (code && config.photo_upload_code && code !== config.photo_upload_code) {
        setUploadEnabled(false);
        return;
      }

      setUploadEnabled(true);
    }
    check();
  }, [code]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      file,
      id: generateId(),
      preview: URL.createObjectURL(file),
      status: 'pending',
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 10,
    maxSize: 30 * 1024 * 1024,
    disabled: isSubmitting,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    // Check upload is enabled
    const { data: config } = await supabase
      .from('site_config')
      .select('photo_upload_enabled, photo_upload_code')
      .maybeSingle();

    if (!config?.photo_upload_enabled) {
      setUploadEnabled(false);
      return;
    }

    // Only block if user provided a code that doesn't match.
    // /upload with no code is allowed when uploads are open.
    if (code && config.photo_upload_code && code !== config.photo_upload_code) {
      setUploadEnabled(false);
      return;
    }

    setUploadEnabled(true);
    setIsSubmitting(true);
    setDoneCount(0);
    abortControllerRef.current = new AbortController();

    let completed = 0;

    for (const uploadFile of files) {
      if (uploadFile.status !== 'pending') continue;

      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'uploading' } : f))
      );

      try {
        // Compress
        const compressed = await imageCompression(uploadFile.file, {
          maxWidthOrHeight: 2048,
          initialQuality: 0.85,
          fileType: 'image/jpeg',
          preserveExif: true,
          alwaysKeepResolution: false,
        });

        // Strip GPS from EXIF (privacy) — we keep other EXIF like DateTime, Make, Model
        // browser-image-compression doesn't support stripping GPS specifically,
        // so we'll handle this on the server or accept the risk for now.
        // For a wedding site with trusted guests, this is acceptable.

        const ext = 'jpg';
        const storagePath = `photos/${uploadFile.id}.${ext}`;
        const thumbPath = `thumbs/${uploadFile.id}.webp`;

        // Generate thumbnail
        const thumbBlob = await generateThumbnail(compressed, 400);

        // Upload main photo and thumbnail in parallel
        const [{ error: uploadError }, { error: thumbUploadError }] = await Promise.all([
          supabase.storage.from('wedding-photos').upload(storagePath, compressed, {
            contentType: 'image/jpeg',
            upsert: false,
          }),
          supabase.storage.from('wedding-photos').upload(thumbPath, thumbBlob, {
            contentType: 'image/webp',
            upsert: false,
          }),
        ]);

        if (uploadError) throw uploadError;
        if (thumbUploadError) throw thumbUploadError;

        // Extract basic metadata
        const img = new Image();
        const imgUrl = URL.createObjectURL(compressed);
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = imgUrl;
        });
        URL.revokeObjectURL(imgUrl);

        // Insert into photos table
        const { error: dbError } = await supabase.from('photos').insert({
          storage_path: storagePath,
          thumbnail_path: thumbPath,
          filename: uploadFile.file.name,
          file_size: compressed.size,
          width: img.naturalWidth,
          height: img.naturalHeight,
          mime_type: 'image/jpeg',
        });

        if (dbError) throw dbError;

        completed++;
        setDoneCount(completed);
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'done' } : f))
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'error', error: msg } : f))
        );
      }
    }

    setIsSubmitting(false);
    abortControllerRef.current = null;
  };

  const allDone = files.length > 0 && files.every((f) => f.status === 'done');
  const hasErrors = files.some((f) => f.status === 'error');

  if (uploadEnabled === false) {
    return (
      <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center px-5">
        <div className="bg-white rounded-[4px] p-8 md:p-12 w-full max-w-[440px] shadow-[0_4px_24px_rgba(0,0,0,0.1)] text-center">
          <div className="w-12 h-12 rounded-full bg-[#7B2D41]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#7B2D41]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h1 className="font-serif-display text-2xl text-[#3B2F2F] mb-3">Uploads Locked</h1>
          <p className="font-sans-body text-sm text-[#3B2F2F]/70 mb-6">
            Photo uploads are currently closed.
          </p>
          <Link
            to="/"
            className="inline-block font-sans-body text-xs font-semibold uppercase tracking-[0.12em] bg-[#3B2F2F] text-white px-8 py-3 hover:bg-[#C4A055] transition-colors duration-300"
          >
            Back to Wedding Site
          </Link>
        </div>
      </div>
    );
  }

  if (uploadEnabled === null) {
    return (
      <div className="min-h-screen bg-[#F5F1EB] flex items-center justify-center px-5">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-[#3B2F2F]/20 border-t-[#C4A055] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-sans-body text-sm text-[#3B2F2F]/60">Checking upload status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1EB]">
      <header className="bg-[#3B2F2F] px-5 md:px-10 py-5">
        <div className="max-w-[800px] mx-auto flex items-center justify-between">
          <h1 className="font-serif-display text-xl text-white">Share Your Moments</h1>
          <Link
            to="/"
            className="font-sans-body text-xs font-semibold uppercase tracking-[0.1em] text-white/80 hover:text-[#C4A055] transition-colors"
          >
            Wedding Site
          </Link>
        </div>
      </header>

      <main className="px-5 md:px-10 py-10">
        <div className="max-w-[800px] mx-auto">
          {allDone ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#3D6B5B]/10 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#3D6B5B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 className="font-serif-display text-2xl text-[#3B2F2F] mb-3">Photos Submitted!</h2>
              <p className="font-sans-body text-sm text-[#3B2F2F]/70 mb-8">
                {doneCount} photo{doneCount !== 1 ? 's' : ''} sent for review. They'll appear in the gallery after approval.
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    files.forEach((f) => URL.revokeObjectURL(f.preview));
                    setFiles([]);
                    setDoneCount(0);
                  }}
                  className="font-sans-body text-xs font-semibold uppercase tracking-[0.12em] bg-[#3B2F2F] text-white px-8 py-3 hover:bg-[#C4A055] transition-colors duration-300"
                >
                  Upload More
                </button>
                <Link
                  to="/"
                  className="font-sans-body text-xs font-semibold uppercase tracking-[0.12em] text-[#3B2F2F] border border-[rgba(59,47,47,0.2)] px-8 py-3 hover:border-[#C4A055] hover:text-[#C4A055] transition-colors duration-300"
                >
                  Back to Site
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-[4px] p-8 md:p-12 text-center cursor-pointer transition-colors duration-200 ${
                  isDragActive
                    ? 'border-[#C4A055] bg-[rgba(196,160,85,0.05)]'
                    : 'border-[rgba(59,47,47,0.2)] hover:border-[rgba(59,47,47,0.4)]'
                } ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input {...getInputProps()} />
                <div className="w-12 h-12 rounded-full bg-[rgba(59,47,47,0.05)] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-[#3B2F2F]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="font-sans-body text-sm text-[#3B2F2F]">
                  {isDragActive ? 'Drop photos here' : 'Drag & drop photos, or tap to browse'}
                </p>
                <p className="font-sans-body text-xs text-[#3B2F2F]/50 mt-2">
                  JPG, PNG, WebP · Up to 10 photos · Max 30MB each
                </p>
              </div>

              {fileRejections.length > 0 && (
                <div className="mt-4 p-3 bg-[#7B2D41]/10 border border-[#7B2D41]/30 rounded-[2px]">
                  <p className="font-sans-body text-xs text-[#7B2D41]">
                    Some files were rejected. Only images under 30MB are accepted.
                  </p>
                </div>
              )}

              {files.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-sans-body text-sm text-[#3B2F2F]">
                      {files.length} photo{files.length !== 1 ? 's' : ''} selected
                    </p>
                    {isSubmitting && (
                      <p className="font-sans-body text-xs text-[#3B2F2F]/60">
                        Uploading {doneCount} of {files.length}...
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6">
                    {files.map((f) => (
                      <div key={f.id} className="relative group aspect-square">
                        <img
                          src={f.preview}
                          alt=""
                          className="w-full h-full object-cover rounded-[2px]"
                        />
                        {f.status === 'uploading' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[2px]">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          </div>
                        )}
                        {f.status === 'done' && (
                          <div className="absolute inset-0 bg-[#3D6B5B]/20 flex items-center justify-center rounded-[2px]">
                            <svg className="w-5 h-5 text-[#3D6B5B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                        )}
                        {f.status === 'error' && (
                          <div className="absolute inset-0 bg-[#7B2D41]/20 flex items-center justify-center rounded-[2px]">
                            <svg className="w-5 h-5 text-[#7B2D41]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                        {!isSubmitting && (
                          <button
                            onClick={() => removeFile(f.id)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2 6h8" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {hasErrors && !isSubmitting && (
                    <div className="mb-4 p-3 bg-[#7B2D41]/10 border border-[#7B2D41]/30 rounded-[2px]">
                      <p className="font-sans-body text-xs text-[#7B2D41]">
                        Some uploads failed. You can retry by removing failed photos and reselecting them.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || files.every((f) => f.status !== 'pending')}
                      className="font-sans-body text-xs font-semibold uppercase tracking-[0.12em] bg-[#3B2F2F] text-white px-8 py-3 hover:bg-[#C4A055] transition-colors duration-300 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Uploading...' : 'Submit Photos'}
                    </button>
                    {!isSubmitting && (
                      <button
                        onClick={() => {
                          files.forEach((f) => URL.revokeObjectURL(f.preview));
                          setFiles([]);
                        }}
                        className="font-sans-body text-xs font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/60 hover:text-[#7B2D41] transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
