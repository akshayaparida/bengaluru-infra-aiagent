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
    <div className="p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Live Map</h2>
          </div>
          <div 
            ref={mapElRef} 
            className="h-[50vh] md:h-[60vh] lg:h-[65vh] w-full border border-neutral-700 rounded-xl shadow-lg overflow-hidden"
          />
          <div className="text-sm text-neutral-400">
            Showing {reports.length} report{reports.length === 1 ? "" : "s"}
          </div>

          {/* Recent reports with status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">Recent Reports</h3>
            </div>
            <ul className="space-y-3">
              {reports.map((r) => (
                <li 
                  key={r.id} 
                  className="grid grid-cols-[100px_1fr] md:grid-cols-[140px_1fr] lg:grid-cols-[160px_1fr] gap-3 md:gap-4 border border-neutral-800 bg-neutral-900/80 rounded-xl p-3 md:p-4 shadow-sm hover:bg-neutral-900/90 transition-colors"
                >
                  <img 
                    src={`/api/reports/${r.id}/photo`} 
                    alt="photo" 
                    className="w-full h-20 md:h-24 lg:h-28 object-cover rounded-lg bg-neutral-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'flex';
                      (e.target as HTMLImageElement).style.alignItems = 'center';
                      (e.target as HTMLImageElement).style.justifyContent = 'center';
                      (e.target as HTMLImageElement).alt = '📷';
                    }}
                  />
                  <div className="min-w-0 space-y-2">
                    <div className="font-semibold text-sm md:text-base text-neutral-100 line-clamp-2">{r.description}</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {r.category && r.severity && (
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md">
                          {r.category} / {r.severity}
                        </span>
                      )}
                      {r.emailedAt && (
                        <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded-md inline-flex items-center gap-1">
                          Emailed ✓
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                        </span>
                      )}
                      {r.tweetedAt && (
                        (r.tweetId && !r.tweetId.startsWith('sim-')) ? (
                          <a 
                            href={`https://x.com/i/web/status/${r.tweetId}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md hover:bg-blue-500/20 transition-colors inline-flex items-center gap-1"
                          >
                            Tweeted ✓
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            (view)
                          </a>
                        ) : (
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md inline-flex items-center gap-1">
                            Tweeted ✓
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            (sim)
                          </span>
                        )
                      )}
                      {!r.emailedAt && !r.tweetedAt && (
                        <span className="px-2 py-1 bg-neutral-700 text-neutral-400 rounded-md animate-pulse">Processing…</span>
                      )}
                    </div>
                    <div className="text-[10px] md:text-xs text-neutral-500">{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
        
        <aside className="space-y-4 lg:space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Budget Transparency</h2>
          </div>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-neutral-300">Department filter</span>
            <select 
              value={depFilter} 
              onChange={(e) => setDepFilter(e.target.value)} 
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-600"
            >
              <option value="">All</option>
              <option value="Roads">Roads</option>
              <option value="Lighting">Lighting</option>
              <option value="Waste">Waste</option>
              <option value="Water">Water</option>
              <option value="Parks">Parks</option>
            </select>
          </label>
          <ul className="max-h-[50vh] lg:max-h-[60vh] overflow-auto border border-neutral-800 rounded-xl bg-neutral-900/50 divide-y divide-neutral-800">
            {budgets.map((b) => (
              <li key={b.id} className="p-3 md:p-4 hover:bg-neutral-900/70 transition-colors">
                <div className="font-semibold text-sm text-neutral-100 mb-1">{b.budgetLine}</div>
                <div className="text-xs text-neutral-400 space-x-2">
                  <span>{b.department}</span>
                  <span>•</span>
                  <span>{b.contractor}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">₹{b.amount.toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}