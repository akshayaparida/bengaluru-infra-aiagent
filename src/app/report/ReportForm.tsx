"use client";

import React from "react";
import { buildReportFormData } from "@/lib/reportForm";

export default function ReportForm({ onSubmitted }: { onSubmitted?: (id: string) => void }) {
  const [description, setDescription] = React.useState("");
  const [lat, setLat] = React.useState<string>("");
  const [lng, setLng] = React.useState<string>("");
  const [accuracy, setAccuracy] = React.useState<number | null>(null);
  const [locationLoading, setLocationLoading] = React.useState(false);
  const [locationName, setLocationName] = React.useState<string>("");
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

  // Reverse geocoding to get location name from coordinates
  async function getLocationName(lat: number, lng: number): Promise<string> {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'BengaluruInfraAgent/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data.address) {
        // Build a readable address for Bengaluru
        const parts = [];
        
        // Add road/area name
        if (data.address.road) parts.push(data.address.road);
        else if (data.address.pedestrian) parts.push(data.address.pedestrian);
        else if (data.address.residential) parts.push(data.address.residential);
        
        // Add neighbourhood/suburb
        if (data.address.neighbourhood) parts.push(data.address.neighbourhood);
        else if (data.address.suburb) parts.push(data.address.suburb);
        else if (data.address.quarter) parts.push(data.address.quarter);
        
        // Add city area
        if (data.address.city_district) parts.push(data.address.city_district);
        
        // Always add Bengaluru
        parts.push('Bengaluru');
        
        return parts.slice(0, 3).join(', '); // Limit to 3 parts for readability
      }
      
      return data.display_name?.split(',').slice(0, 3).join(', ') || 'Bengaluru';
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return 'Bengaluru'; // Fallback
    }
  }

  async function getLocationWithFallback(): Promise<{ lat: number; lng: number; accuracy: number; locationName: string }> {
    if (!navigator.geolocation) throw new Error('Geolocation unsupported');
    const getPosition = (opts: PositionOptions) => new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, opts));
    
    setLocationLoading(true);
    try {
      setMessage('🛰️ Getting high-accuracy GPS location...');
      // Try multiple attempts for better accuracy
      let bestPosition: GeolocationPosition | null = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const pos = await getPosition({ 
            enableHighAccuracy: true, 
            timeout: 8000, 
            maximumAge: 0 // Force fresh location, no cache
          });
          
          // Keep the most accurate reading
          if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = pos;
          }
          
          // If we get good accuracy (< 50m), use it immediately
          if (pos.coords.accuracy < 50) {
            break;
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            setMessage(`🛰️ Attempt ${attempts + 1}/${maxAttempts} for better accuracy...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between attempts
          }
        } catch (e) {
          attempts++;
          if (attempts >= maxAttempts) throw e;
        }
      }
      
      if (bestPosition) {
        setAccuracy(bestPosition.coords.accuracy);
        
        // Get location name
        setMessage('📍 Getting location name...');
        const locationName = await getLocationName(bestPosition.coords.latitude, bestPosition.coords.longitude);
        
        return { 
          lat: bestPosition.coords.latitude, 
          lng: bestPosition.coords.longitude, 
          accuracy: bestPosition.coords.accuracy,
          locationName
        };
      }
      throw new Error('No valid GPS reading obtained');
      
    } catch (e1: any) {
      setMessage('📍 Falling back to network-based location...');
      try {
        // Fallback to network-based location
        const pos2 = await getPosition({ 
          enableHighAccuracy: false, 
          timeout: 10000, 
          maximumAge: 60000 // Allow 1 minute old cache for network location
        });
        setAccuracy(pos2.coords.accuracy);
        
        // Get location name even for network location
        setMessage('📍 Getting location name...');
        const locationName = await getLocationName(pos2.coords.latitude, pos2.coords.longitude);
        
        return { 
          lat: pos2.coords.latitude, 
          lng: pos2.coords.longitude, 
          accuracy: pos2.coords.accuracy,
          locationName
        };
      } catch (e2) {
        throw new Error(`GPS failed: ${e1?.message || 'Unable to get location'}`);
      }
    } finally {
      setLocationLoading(false);
      setTimeout(() => setMessage(''), 3000);
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
      const { lat: la, lng: ln, accuracy: acc, locationName } = await getLocationWithFallback();
      setLat(String(la));
      setLng(String(ln));
      setAccuracy(acc);
      setLocationName(locationName);
      setMessage(`✅ Location: ${locationName} (accuracy: ${acc.toFixed(0)}m)`);
      setTimeout(() => setMessage(''), 5000);
    } catch (e: any) {
      setMessage(`❌ Location error: ${e?.message || 'unable to get location'}`);
      setAccuracy(null);
      setLocationName("");
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

    // ALWAYS get fresh high-accuracy location when capturing photo
    let laNum = 0, lnNum = 0, accNum = 0, locName = "";
    try {
      setMessage('🛰️ Acquiring GPS location for photo...');
      const loc = await getLocationWithFallback();
      laNum = loc.lat; 
      lnNum = loc.lng;
      accNum = loc.accuracy;
      locName = loc.locationName;
      setLat(String(laNum));
      setLng(String(lnNum));
      setAccuracy(accNum);
      setLocationName(locName);
      setMessage(`✅ Photo captured at ${locName} (accuracy: ${accNum.toFixed(0)}m)`);
      setTimeout(() => setMessage(''), 5000);
    } catch (e: any) {
      setMessage(`❌ GPS error: ${e?.message || 'unable to get location'}`);
      // Don't proceed without location
      return;
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

    let latNum = Number(lat);
    let lngNum = Number(lng);

    if (!description || !file) {
      setMessage("Please provide description and a photo.");
      return;
    }
    if (Number.isNaN(latNum) || Number.isNaN(lngNum) || !lat || !lng) {
      // Must have location before submitting
      setMessage('⚠️ Getting GPS location before submission...');
      try {
        const loc = await getLocationWithFallback();
        setLat(String(loc.lat));
        setLng(String(loc.lng));
        setAccuracy(loc.accuracy);
        setLocationName(loc.locationName);
        latNum = loc.lat;
        lngNum = loc.lng;
        setMessage(`✅ Report location: ${loc.locationName}`);
      } catch (e: any) {
        setMessage(`❌ Cannot submit without GPS location. ${e?.message}`);
        setSubmitting(false);
        return;
      }
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
        <button 
          type="button" 
          onClick={onUseMyLocation} 
          disabled={locationLoading}
          className="h-12 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-left px-4 disabled:opacity-50"
        >
          <div className="text-sm text-neutral-300">
            {locationLoading ? '🛰️ Getting GPS...' : '📍 Get GPS location'}
          </div>
          <div className="text-xs text-neutral-400">
            {locationLoading ? 'Please wait...' : 'Detect current coordinates'}
          </div>
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
        name="photo"
        accept="image/*"
        onChange={async (e) => {
          const f = e.target.files?.[0] || null;
          if (!f) {
            setFile(null); setPreviewUrl(null); return;
          }
          // Always try to get fresh location when uploading a file
          try {
            setMessage('🛰️ Getting GPS location for uploaded photo...');
            const loc = await getLocationWithFallback();
            const laNum = loc.lat; 
            const lnNum = loc.lng;
            setLat(String(laNum)); 
            setLng(String(lnNum));
            setAccuracy(loc.accuracy);
            setLocationName(loc.locationName);
            setMessage(`✅ Photo location: ${loc.locationName} (accuracy: ${loc.accuracy.toFixed(0)}m)`);
            setTimeout(() => setMessage(''), 5000);
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
      />
      {previewUrl && (
        <div className="border border-neutral-800 rounded-lg overflow-hidden">
          <img src={previewUrl} alt="preview" className="w-full max-h-72 object-cover" />
        </div>
      )}
      {/* Location display with name and accuracy */}
      {(lat && lng) && (
        <div className="p-3 border border-neutral-700 rounded-lg bg-neutral-900/50 space-y-2">
          {/* Location Name */}
          {locationName && (
            <div className="text-sm font-medium text-neutral-200">
              📍 {locationName}
            </div>
          )}
          
          {/* Coordinates */}
          <div className="text-xs text-neutral-400">
            Coordinates: {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
          </div>
          
          {/* Accuracy Indicator */}
          {accuracy && (
            <div className={`flex items-center gap-2 text-xs ${
              accuracy <= 20 ? 'text-green-400' : 
              accuracy <= 50 ? 'text-yellow-400' : 
              accuracy <= 1000 ? 'text-orange-400' : 
              'text-red-400'
            }`}>
              <span>
                {accuracy <= 20 ? '✅ Excellent GPS' : 
                 accuracy <= 50 ? '🟡 Good GPS' : 
                 accuracy <= 1000 ? '⚠️ Fair GPS' : 
                 '❌ Network Location'}
              </span>
              <span>(±{accuracy > 1000 ? `${(accuracy/1000).toFixed(1)}km` : `${accuracy.toFixed(0)}m`})</span>
            </div>
          )}
          
          {/* Recommendations for poor accuracy */}
          {accuracy && accuracy > 50 && (
            <div className="text-amber-300 text-xs">
              💡 For better accuracy: Use mobile device outdoors with GPS enabled
            </div>
          )}
        </div>
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
