"use client";

import React from "react";
import { buildReportFormData } from "@/lib/reportForm";

export default function ReportForm() {
  const [description, setDescription] = React.useState("");
  const [lat, setLat] = React.useState<string>("");
  const [lng, setLng] = React.useState<string>("");
  const [file, setFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string>("");
  const [reportId, setReportId] = React.useState<string | null>(null);

  const onUseMyLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        setMessage("");
      },
      (err) => {
        setMessage(`Location error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const onSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setReportId(null);

    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (!description || Number.isNaN(latNum) || Number.isNaN(lngNum) || !file) {
      setMessage("Please provide description, valid location, and a photo.");
      return;
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
      setMessage("Report submitted successfully.");
      // Minimal reset (keep lat/lng for convenience)
      setDescription("");
      setFile(null);
    } catch (err: any) {
      setMessage(err?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  }, [description, lat, lng, file]);

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
      <label>
        <div>Description</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          placeholder="Briefly describe the issue (e.g., pothole, broken light)"
          style={{ width: "100%" }}
        />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.5rem", alignItems: "end" }}>
        <label>
          <div>Latitude</div>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="12.97"
            required
            style={{ width: "100%" }}
          />
        </label>
        <label>
          <div>Longitude</div>
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="77.59"
            required
            style={{ width: "100%" }}
          />
        </label>
        <button type="button" onClick={onUseMyLocation} style={{ height: 36 }}>
          Use my location
        </button>
      </div>

      <label>
        <div>Photo</div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
      </label>

      <button type="submit" disabled={submitting} style={{ height: 40 }}>
        {submitting ? "Submitting..." : "Submit report"}
      </button>

      {message && (
        <div style={{ color: reportId ? "#0a0" : "#a00" }}>{message}</div>
      )}
      {reportId && (
        <div style={{ color: "#333" }}>
          Saved report id: <code>{reportId}</code>
        </div>
      )}
    </form>
  );
}