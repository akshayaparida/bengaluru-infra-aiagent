"use client";

import { useEffect } from 'react';

export default function ServiceWorkerClient() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // Register only on localhost demo to avoid surprises
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isLocal) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}