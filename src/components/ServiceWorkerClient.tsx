"use client";

import { useEffect } from 'react';

export default function ServiceWorkerClient() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // In development: make sure no SW is active (prevents stale HTML/asset cache causing blank screens)
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations?.().then(regs => {
        regs.forEach(r => r.unregister().catch(() => {}));
      });
      return; // don't register in dev
    }

    // In production: register only on localhost demo to avoid surprises
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isLocal) return;

    // Append a cache-busting query so clients fetch updated SW on deploys
    const swUrl = `/sw.js?v=${Date.now()}`;
    navigator.serviceWorker.register(swUrl).catch(() => {});
  }, []);
  return null;
}
