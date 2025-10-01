"use client";

import React from "react";

type ReportItem = {
  id: string;
  createdAt: string;
  description: string;
  lat: number;
  lng: number;
  status: string;
  category?: string | null;
  severity?: string | null;
  emailedAt?: string | null;
  emailMessageId?: string | null;
  tweetedAt?: string | null;
  tweetId?: string | null;
};

type BudgetItem = {
  id: string;
  department: string;
  contractor: string;
  budgetLine: string;
  wardId?: number;
  amount: number;
};

export default function DashboardView({ refreshToken }: { refreshToken?: string | number } = {}) {
  const mapRef = React.useRef<any>(null);
  const mapElRef = React.useRef<HTMLDivElement | null>(null);
  const mapInnerRef = React.useRef<HTMLDivElement | null>(null);
  const initLockRef = React.useRef<boolean>(false);

  const [reports, setReports] = React.useState<ReportItem[]>([]);
  const [budgets, setBudgets] = React.useState<BudgetItem[]>([]);
  const [depFilter, setDepFilter] = React.useState<string>("");

  // fetch data (re-run when filter or external refreshToken changes)
  React.useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [r, b] = await Promise.all([
          fetch("/api/reports?limit=200").then((x) => x.json()),
          fetch('/api/transparency/budgets' + (depFilter ? `?department=${encodeURIComponent(depFilter)}` : "")).then((x) => x.json()),
        ]);
        if (!active) return;
        setReports(Array.isArray(r.items) ? r.items : []);
        setBudgets(Array.isArray(b.items) ? b.items : []);
      } catch {
        // noop for demo
      }
    }
    load();

    // short polling for fresh status for ~30s after a submit
    const endAt = Date.now() + 30000;
    const interval = setInterval(() => {
      if (Date.now() > endAt) { clearInterval(interval); return; }
      load();
    }, 3000);
    return () => { active = false; clearInterval(interval); };
  }, [depFilter, refreshToken]);

  // create map once on client (guard against StrictMode double-invoke)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!mapElRef.current) return;
      if (mapRef.current) return;
      if (initLockRef.current) return; // synchronous guard
      // If either outer or existing inner is already initialized, skip
      if ((mapElRef.current as any)?._leaflet_id || (mapInnerRef.current as any)?._leaflet_id) return;
      initLockRef.current = true;

      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled) { initLockRef.current = false; return; }
      // Fix default icon paths in Next bundles
      //@ts-ignore
      const iconRetinaUrl = (await import('leaflet/dist/images/marker-icon-2x.png')).default;
      //@ts-ignore
      const iconUrl = (await import('leaflet/dist/images/marker-icon.png')).default;
      //@ts-ignore
      const shadowUrl = (await import('leaflet/dist/images/marker-shadow.png')).default;
      //@ts-ignore
      L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

      // Ensure a fresh inner container to avoid "already initialized" on the same element
      if (!mapInnerRef.current && mapElRef.current) {
        const inner = document.createElement('div');
        inner.style.height = '100%';
        inner.style.width = '100%';
        mapElRef.current.appendChild(inner);
        mapInnerRef.current = inner;
      }

      // If a concurrent effect has already created a map, bail out
      if (cancelled || mapRef.current || (mapInnerRef.current as any)?._leaflet_id) {
        initLockRef.current = false;
        return;
      }

      const map = L.map(mapInnerRef.current!).setView([12.9716, 77.5946], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      if (!cancelled) mapRef.current = map;
      initLockRef.current = false;
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (mapInnerRef.current && mapElRef.current?.contains(mapInnerRef.current)) {
        try { mapElRef.current.removeChild(mapInnerRef.current); } catch {}
        mapInnerRef.current = null;
      }
      initLockRef.current = false;
    };
  }, []);

  // draw markers when reports change
  React.useEffect(() => {
    (async () => {
      if (!mapRef.current) return;
      const L = await import("leaflet");
      // Clear existing layer group by recreating map markers layer
      // For simplicity, remove all marker layers by resetting the map (quick & dirty for POC)
      // A production app should manage a layer group.
      // We'll just add markers anew without heavy cleanup; acceptable for POC scale.
      reports.forEach((r) => {
        const m = L.marker([r.lat, r.lng]).addTo(mapRef.current);
        m.bindPopup(`<strong>${escapeHtml(r.description)}</strong><br/>${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`);
      });
    })();
  }, [reports]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", padding: "1rem" }}>
      <section>
        <h2>Map</h2>
        <div ref={mapElRef} style={{ height: "60vh", width: "100%", border: "1px solid #ddd", borderRadius: 8 }} />
        <div style={{ marginTop: 8, color: "#666" }}>
          Showing {reports.length} report{reports.length === 1 ? "" : "s"}
        </div>

        {/* Recent reports with status */}
        <div style={{ marginTop: 16 }}>
          <h3 style={{ marginBottom: 8 }}>Recent reports</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {reports.map((r) => (
              <li key={r.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, border: '1px solid #222', background: '#0b0b0b', borderRadius: 8, padding: 8 }}>
                <img src={`/api/reports/${r.id}/photo`} alt="photo" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: '#ddd' }}>{r.description}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12 }}>
                    {r.category && r.severity && (
                      <span style={{ color: '#9ae6b4' }}>Classified: {r.category} / {r.severity}</span>
                    )}
                    {r.emailedAt && (
                      <span style={{ color: '#9ae6b4' }}>Emailed ✓</span>
                    )}
                    {r.tweetedAt && (
                      r.tweetId ? (
                        <a href={`https://x.com/i/web/status/${r.tweetId}`} target="_blank" rel="noreferrer" style={{ color: '#9ae6b4' }}>Tweeted ✓ (view)</a>
                      ) : (
                        <span style={{ color: '#9ae6b4' }}>Tweeted ✓</span>
                      )
                    )}
                    {!r.emailedAt && !r.tweetedAt && (
                      <span style={{ color: '#999' }}>Processing…</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#777', marginTop: 4 }}>{new Date(r.createdAt).toLocaleString()}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <aside>
        <h2>Transparency</h2>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Department filter
          <select value={depFilter} onChange={(e) => setDepFilter(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            <option value="Roads">Roads</option>
            <option value="Lighting">Lighting</option>
            <option value="Waste">Waste</option>
            <option value="Water">Water</option>
            <option value="Parks">Parks</option>
          </select>
        </label>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: "50vh", overflow: "auto", border: "1px solid #eee", borderRadius: 6 }}>
          {budgets.map((b) => (
            <li key={b.id} style={{ padding: "8px 10px", borderBottom: "1px solid #f3f3f3" }}>
              <div style={{ fontWeight: 600 }}>{b.budgetLine}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{b.department} • {b.contractor} • ₹{b.amount.toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}