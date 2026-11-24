import { useEffect, useRef, useState } from 'react';
import {
  AlertOctagon,
  Camera,
  CheckCircle2,
  ImagePlus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { InjuryAssessment, PetProfile } from '../types/pawheal';

interface InjuryScannerViewProps {
  pets: PetProfile[];
  initialPetId: string;
  assessments: InjuryAssessment[];
  onAssessmentsChanged: () => Promise<void>;
  onOpenNearbyVets: () => void;
}

const BODY_AREAS = [
  'Paw / Pad / Claws',
  'Leg / Joint',
  'Ear / Ear Canal',
  'Eye / Eyelid',
  'Skin / Coat',
  'Mouth / Gums / Teeth',
  'Abdomen / Chest',
  'Tail / Back',
  'Other Area',
];

function createThumbnailDataUrl(file: File): Promise<{
  base64: string;
  mimeType: string;
  previewDataUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      reject(new Error('Unsupported image format. Please choose JPEG, PNG, or WEBP.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Image exceeds 5 MB. Please upload a smaller photo.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the selected image file.'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.split(',')[1] || '';
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 360;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({
          base64,
          mimeType: file.type,
          previewDataUrl: canvas.toDataURL('image/jpeg', 0.72),
        });
      };
      img.onerror = () =>
        resolve({
          base64,
          mimeType: file.type,
          previewDataUrl: dataUrl,
        });
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function InjuryScannerView({
  pets,
  initialPetId,
  assessments,
  onAssessmentsChanged,
  onOpenNearbyVets,
}: InjuryScannerViewProps) {
  const [petId, setPetId] = useState(initialPetId || pets[0]?.id || '');
  const [bodyArea, setBodyArea] = useState(BODY_AREAS[0]);
  const [symptoms, setSymptoms] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<InjuryAssessment | null>(
    assessments[0] ?? null,
  );

  useEffect(() => {
    if (initialPetId) setPetId(initialPetId);
    else if (!petId && pets[0]) setPetId(pets[0].id);
  }, [initialPetId, pets, petId]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }

  async function startCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is unavailable in this browser. Use Upload Photo instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 60);
    } catch {
      setError('Camera permission was denied or unavailable. You can upload an image from your device.');
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setImageBase64(dataUrl.split(',')[1] || '');
    setMimeType('image/jpeg');
    setPreviewUrl(dataUrl);
    stopCamera();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const processed = await createThumbnailDataUrl(file);
      setImageBase64(processed.base64);
      setMimeType(processed.mimeType);
      setPreviewUrl(processed.previewDataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process image.');
    }
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!imageBase64) {
      setError('Please capture or upload a clear photo of the affected area first.');
      return;
    }
    setError(null);
    setAnalyzing(true);
    try {
      const res = await apiRequest<{ assessment: InjuryAssessment }>('/api/injury/analyze', {
        method: 'POST',
        body: JSON.stringify({
          petId,
          bodyArea,
          symptoms,
          imageBase64,
          mimeType,
          imagePreviewDataUrl: previewUrl,
        }),
      });
      setActiveResult(res.assessment);
      await onAssessmentsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Injury analysis failed. Please retry.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDeleteAssessment(id: string) {
    await apiRequest(`/api/injury/history/${id}`, { method: 'DELETE' });
    if (activeResult?.id === id) {
      setActiveResult(null);
    }
    await onAssessmentsChanged();
  }

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#E2E8E2]">
        <h1 className="font-display text-2xl font-bold text-[#111817]">AI Injury Scanner</h1>
        <p className="text-sm text-[#4A5553] mt-1">
          Capture or upload a clear photo of a visible wound, rash, or swelling for structured first-aid triage. Never a substitute for a veterinary exam.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleAnalyze}
          className="lg:col-span-5 bg-white rounded-xl border border-[#E2E8E2] p-6 space-y-5"
        >
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={cameraOpen ? stopCamera : startCamera}
              className="h-10 px-3.5 rounded-lg border border-[#D4DDD4] bg-white hover:bg-[#F3F5F3] text-sm font-medium text-[#111817] flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-[#0F766E]" />
              <span>{cameraOpen ? 'Close Camera' : 'Use Camera'}</span>
            </button>
            <label className="h-10 px-3.5 rounded-lg border border-[#D4DDD4] bg-white hover:bg-[#F3F5F3] text-sm font-medium text-[#111817] inline-flex items-center gap-2 cursor-pointer">
              <ImagePlus className="w-4 h-4 text-[#0F766E]" />
              <span>Upload Photo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {cameraOpen && (
            <div className="rounded-xl overflow-hidden border border-[#E2E8E2] bg-black space-y-2 p-2">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg max-h-60 object-cover" />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/80 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-4 py-1.5 rounded-lg bg-[#0F766E] text-white text-xs font-semibold cursor-pointer"
                >
                  Capture Snapshot
                </button>
              </div>
            </div>
          )}

          {previewUrl && !cameraOpen && (
            <div className="relative rounded-xl overflow-hidden border border-[#E2E8E2] bg-[#F3F5F3]">
              <img
                src={previewUrl}
                alt="Injury preview"
                referrerPolicy="no-referrer"
                className="w-full max-h-56 object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  setImageBase64(null);
                }}
                aria-label="Remove photo"
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-[#111817] border border-[#E2E8E2] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#111817] mb-1">Pet Profile</label>
            <select
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] bg-white text-sm"
            >
              <option value="">General assessment (no pet selected)</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111817] mb-1">
              Affected Body Area
            </label>
            <select
              value={bodyArea}
              onChange={(e) => setBodyArea(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] bg-white text-sm"
            >
              {BODY_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111817] mb-1">
              Observed Symptoms & Timeline
            </label>
            <textarea
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g., Licking paw since this morning, slight limp, noticed small scrape after park walk."
              className="w-full p-3 rounded-lg border border-[#D4DDD4] text-sm"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800 flex items-start justify-between gap-2">
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={analyzing}
            className="w-full h-11 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing Photo...</span>
              </>
            ) : (
              <span>Run First-Aid Assessment</span>
            )}
          </button>
        </form>

        <div className="lg:col-span-7 space-y-6">
          {activeResult ? (
            <section className="bg-white rounded-xl border border-[#E2E8E2] p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#E2E8E2]">
                <div>
                  <p className="text-xs text-[#4A5553]">
                    {activeResult.petName} · {activeResult.bodyArea} ·{' '}
                    <span className="font-mono-tabular">
                      {new Date(activeResult.createdAt).toLocaleString()}
                    </span>
                  </p>
                  <h2 className="font-display text-xl font-bold text-[#111817] mt-1">
                    {activeResult.possibleCategory}
                  </h2>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                    activeResult.urgencyLevel === 'emergency' ||
                    activeResult.urgencyLevel === 'urgent'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : activeResult.urgencyLevel === 'moderate'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  Urgency: {activeResult.urgencyLevel.toUpperCase()}
                </span>
              </div>

              {(activeResult.urgencyLevel === 'emergency' ||
                activeResult.urgencyLevel === 'urgent') && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-sm font-medium text-red-900">
                    Prompt veterinary care is strongly recommended based on these signs.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenNearbyVets}
                    className="h-9 px-3.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Find Nearby Vet Clinic
                  </button>
                </div>
              )}

              <div>
                <h3 className="font-display text-sm font-semibold text-[#111817] mb-2">
                  Visible Observations
                </h3>
                <ul className="space-y-1.5 text-sm text-[#4A5553]">
                  {activeResult.visibleObservations.map((obs) => (
                    <li key={obs}>• {obs}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div>
                  <h3 className="font-display text-sm font-semibold text-[#111817] flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                    <span>Safe Immediate Actions</span>
                  </h3>
                  <ul className="space-y-1.5 text-sm text-[#111817]">
                    {activeResult.safeImmediateActions.map((act) => (
                      <li key={act}>• {act}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-display text-sm font-semibold text-[#111817] flex items-center gap-1.5 mb-2">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    <span>Actions to Avoid</span>
                  </h3>
                  <ul className="space-y-1.5 text-sm text-[#4A5553]">
                    {activeResult.actionsToAvoid.map((avoid) => (
                      <li key={avoid}>• {avoid}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E8E2] space-y-2">
                <h3 className="font-display text-sm font-semibold text-[#111817]">
                  Veterinary Attention Recommendation
                </h3>
                <p className="text-sm text-[#4A5553] leading-relaxed">
                  {activeResult.veterinaryRecommendation}
                </p>
              </div>

              {activeResult.emergencyWarningSigns.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950 space-y-1">
                  <p className="font-semibold">Seek emergency care immediately if you notice:</p>
                  {activeResult.emergencyWarningSigns.map((sign) => (
                    <p key={sign}>• {sign}</p>
                  ))}
                </div>
              )}

              <p className="text-xs text-[#64716E] leading-relaxed">{activeResult.disclaimer}</p>
            </section>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2E8E2] p-8 text-center text-sm text-[#4A5553]">
              Upload or capture a clear, well-lit photo on the left to view structured AI first-aid triage results.
            </div>
          )}

          <section className="bg-white rounded-xl border border-[#E2E8E2] p-5 space-y-3">
            <h3 className="font-display text-base font-semibold text-[#111817]">
              Saved Assessment History
            </h3>
            {assessments.length === 0 ? (
              <p className="text-sm text-[#4A5553]">No past scans saved yet.</p>
            ) : (
              <div className="divide-y divide-[#E2E8E2]">
                {assessments.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveResult(item)}
                      className="text-left min-w-0 flex-1 cursor-pointer"
                    >
                      <p className="text-sm font-medium text-[#111817] truncate">
                        {item.petName} — {item.possibleCategory}
                      </p>
                      <p className="text-xs text-[#4A5553]">
                        {item.bodyArea} · {item.urgencyLevel.toUpperCase()} ·{' '}
                        <span className="font-mono-tabular">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAssessment(item.id)}
                      className="p-2 text-[#4A5553] hover:text-red-700 cursor-pointer"
                      aria-label="Delete assessment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
