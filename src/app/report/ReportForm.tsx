"use client";

import React from "react";
import { buildReportFormData } from "@/lib/reportForm";

export default function ReportForm({ onSubmitted }: { onSubmitted?: (id: string) => void }) {
  const [description, setDescription] = React.useState("");
  const [lat, setLat] = React.useState<string>("");
  const [lng, setLng] = React.useState<string>("");
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string>("");
  const [reportId, setReportId] = React.useState<string | null>(null);

  // Camera state
  const [cameraOpen, setCameraOpen] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const stopCamera = React.useCallback(() => {
    try {
      streamRef.current?.getTracks?.().forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;
    setCameraOpen(false);
  }, []);

  // Helpers
  async function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = (e) => reject(e);
      fr.readAsDataURL(blob);
    });
  }
  function dataURLToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }
  function toRational(num: number, den = 1): [number, number] { return [Math.round(num * den), den]; }
  function degToDmsRational(dec: number): [[number, number], [number, number], [number, number]] {
    const abs = Math.abs(dec);
    const deg = Math.floor(abs);
    const minFloat = (abs - deg) * 60;
    const min = Math.floor(minFloat);
    const secFloat = (minFloat - min) * 60;
    // keep two decimals on seconds => denominator 100
    return [toRational(deg, 1), toRational(min, 1), toRational(secFloat, 100)];
  }

  async function getLocationWithFallback(): Promise<{ lat: number; lng: number }> {
    if (!navigator.geolocation) throw new Error('Geolocation unsupported');
    const getPosition = (opts: PositionOptions) => new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, opts));
    try {
      setMessage('Getting your location…');
      const pos = await getPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (e1: any) {
      const pos2 = await getPosition({ enableHighAccuracy: false, timeout: 3000, maximumAge: 600000 }).catch((e2) => { throw e2 || e1; });
      return { lat: pos2.coords.latitude, lng: pos2.coords.longitude };
    } finally {
      setMessage('');
    }
  }

  async function embedGpsInJpegDataURL(dataUrl: string, latNum: number, lngNum: number, date?: Date) {
    // @ts-ignore - no official types
    const piexif = await import('piexifjs');
    const gps: any = {};
    gps[piexif.GPSIFD.GPSLatitudeRef] = latNum >= 0 ? 'N' : 'S';
    gps[piexif.GPSIFD.GPSLatitude] = degToDmsRational(latNum);
    gps[piexif.GPSIFD.GPSLongitudeRef] = lngNum >= 0 ? 'E' : 'W';
    gps[piexif.GPSIFD.GPSLongitude] = degToDmsRational(lngNum);
    if (date) {
      const h = date.getUTCHours();
      const m = date.getUTCMinutes();
      const s = date.getUTCSeconds();
      gps[piexif.GPSIFD.GPSTimeStamp] = [toRational(h, 1), toRational(m, 1), toRational(s, 1)];
      const ds = `${date.getUTCFullYear()}:${String(date.getUTCMonth() + 1).padStart(2, '0')}:${String(date.getUTCDate()).padStart(2, '0')}`;
      gps[piexif.GPSIFD.GPSDateStamp] = ds;
    }
    const exifObj = { '0th': {}, Exif: {}, GPS: gps };
    const exifStr = piexif.dump(exifObj);
    const newDataURL = piexif.insert(exifStr, dataUrl);
    return newDataURL as string;
  }

  // Geolocation with fallback: try high accuracy, then low-accuracy/cached
  const onUseMyLocation = React.useCallback(async () => {
    try {
      const { lat: la, lng: ln } = await getLocationWithFallback();
      setLat(String(la));
      setLng(String(ln));
    } catch (e: any) {
      setMessage(`Location error: ${e?.message || 'unable to get location'}`);
    }
  }, []);

  const onStartCamera = React.useCallback(async () => {
    if (!("mediaDevices" in navigator) || !navigator.mediaDevices?.getUserMedia) {
      // Fallback to file upload on unsupported devices
      fileInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      // Attach to video element
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // play() can reject if not allowed; ignore here
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (err: any) {
      setMessage(err?.message || "Camera access failed. Falling back to file upload.");
      fileInputRef.current?.click();
    }
  }, []);

  const onCapturePhoto = React.useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to capture"))), "image/jpeg", 0.92)
    );

    // Get location (reuse if already present)
    let laNum = Number(lat), lnNum = Number(lng);
    if (Number.isNaN(laNum) || Number.isNaN(lnNum)) {
      try {
        const loc = await getLocationWithFallback();
        laNum = loc.lat; lnNum = loc.lng;
        setLat(String(laNum));
        setLng(String(lnNum));
      } catch (e: any) {
        setMessage(`Location error: ${e?.message || 'unable to get location'}`);
      }
    }

    // Embed GPS EXIF into JPEG
    let dataUrl = '';
    try {
      dataUrl = await blobToDataURL(blob);
      if (!Number.isNaN(laNum) && !Number.isNaN(lnNum)) {
        dataUrl = await embedGpsInJpegDataURL(dataUrl, laNum, lnNum, new Date());
      }
    } catch (e) {
      // If EXIF embedding fails, proceed with raw image
      dataUrl = await blobToDataURL(blob);
    }

    const finalBlob = dataURLToBlob(dataUrl);
    const finalFile = new File([finalBlob], `report_${Date.now()}_gps.jpg`, { type: "image/jpeg" });
    setFile(finalFile);
    setPreviewUrl(dataUrl);
    stopCamera();
  }, [stopCamera, lat, lng]);

  React.useEffect(() => {
    return () => {
      // Cleanup camera on unmount if open
      stopCamera();
    };
  }, [stopCamera]);

  const onSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setReportId(null);

    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (!description || !file) {
      setMessage("Please provide description and a photo.");
      return;
    }
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      // Try one last location attempt before submit to keep backend consistent
      try {
        const loc = await getLocationWithFallback();
        setLat(String(loc.lat));
        setLng(String(loc.lng));
      } catch {}
    }

    try {
      setSubmitting(true);
      const fd = buildReportFormData({ description, lat: latNum, lng: lngNum, file });
      const res = await fetch("/api/reports", { method: "POST", body: fd });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b?.error || `Request failed: ${res.status}`);
      }
      const body = await res.json();
      setReportId(body.id);
      onSubmitted?.(body.id);
      setMessage("Report submitted successfully.");
      // Minimal reset (keep lat/lng for convenience)
      setDescription("");
      setFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      setMessage(err?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  }, [description, lat, lng, file, onSubmitted]);

  return (
    <form onSubmit={onSubmit} className="grid gap-4" aria-live="polite">
      {/* Camera & GPS row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onStartCamera}
          className="h-12 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-left px-4"
        >
          <div className="text-sm text-neutral-300">Take photo (camera)</div>
          <div className="text-xs text-neutral-400">Open device camera</div>
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="h-12 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-left px-4"
        >
          <div className="text-sm text-neutral-300">Upload from files</div>
          <div className="text-xs text-neutral-400">Choose an image</div>
        </button>
        <button type="button" onClick={onUseMyLocation} className="h-12 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-left px-4">
          <div className="text-sm text-neutral-300">Use location</div>
          <div className="text-xs text-neutral-400">Get your current coordinates</div>
        </button>
      </div>

      {/* Camera preview */}
      {cameraOpen && (
        <div className="rounded-lg border border-neutral-800 overflow-hidden">
          <div className="bg-black">
            <video ref={videoRef} playsInline autoPlay muted className="w-full max-h-80 object-contain" />
          </div>
          <div className="flex gap-2 p-2 bg-neutral-900/60 border-t border-neutral-800">
            <button type="button" onClick={onCapturePhoto} className="h-10 px-4 rounded-md border border-neutral-700 bg-neutral-100 text-neutral-900 font-medium hover:bg-white">
              Capture
            </button>
            <button type="button" onClick={stopCamera} className="h-10 px-4 rounded-md border border-neutral-700 bg-neutral-800 hover:bg-neutral-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Photo input (hidden) + preview */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={async (e) => {
          const f = e.target.files?.[0] || null;
          if (!f) {
            setFile(null); setPreviewUrl(null); return;
          }
          // If location available, try embedding; else keep original to avoid blocking UX
          try {
            let laNum = Number(lat), lnNum = Number(lng);
            if (Number.isNaN(laNum) || Number.isNaN(lnNum)) {
              const loc = await getLocationWithFallback().catch(() => null);
              if (loc) { laNum = loc.lat; lnNum = loc.lng; setLat(String(laNum)); setLng(String(lnNum)); }
            }
            const dataUrl = await blobToDataURL(f);
            const withExif = (!Number.isNaN(laNum) && !Number.isNaN(lnNum))
              ? await embedGpsInJpegDataURL(dataUrl, laNum, lnNum, new Date())
              : dataUrl;
            const finalBlob = dataURLToBlob(withExif);
            const finalFile = new File([finalBlob], `report_${Date.now()}_gps.jpg`, { type: "image/jpeg" });
            setFile(finalFile);
            setPreviewUrl(withExif);
          } catch {
            setFile(f);
            setPreviewUrl(URL.createObjectURL(f));
          }
        }}
        className="hidden"
        required
      />
      {previewUrl && (
        <div className="border border-neutral-800 rounded-lg overflow-hidden">
          <img src={previewUrl} alt="preview" className="w-full max-h-72 object-cover" />
        </div>
      )}
      {/* Read-only location display */}
      {(lat && lng) && (
        <div className="text-xs text-neutral-400">Location set: {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)} (embedded in photo)</div>
      )}

      {/* Description */}
      <label className="grid gap-1">
        <span className="text-sm text-neutral-300">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          placeholder="Briefly describe the issue (e.g., pothole, broken light)"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder:text-neutral-500 p-3"
        />
      </label>

      {/* Coordinates inputs removed: we embed GPS into photo and fill the state automatically */}

      <button type="submit" disabled={submitting} className="h-11 rounded-md border border-neutral-700 bg-neutral-100 text-neutral-900 font-medium hover:bg-white disabled:opacity-60">
        {submitting ? "Submitting..." : "Submit report"}
      </button>

      {message && (
        <div className={reportId ? "text-emerald-400" : "text-red-400"}>{message}</div>
      )}
      {reportId && (
        <div className="text-neutral-300">
          Saved report id: <code className="text-neutral-100">{reportId}</code>
        </div>
      )}
    </form>
  );
}
