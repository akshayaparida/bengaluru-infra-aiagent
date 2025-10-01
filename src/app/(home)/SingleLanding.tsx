"use client";

import React from "react";
import dynamic from "next/dynamic";
import ReportForm from "../report/ReportForm";

const DashboardView = dynamic(() => import("../dashboard/DashboardView"), { ssr: false });

export default function SingleLanding() {
  const [reportId, setReportId] = React.useState<string | null>(null);
  const [notifyMsg, setNotifyMsg] = React.useState<string>("");
  const [tweetMsg, setTweetMsg] = React.useState<string>("");
  const [loading, setLoading] = React.useState<{ notify: boolean; tweet: boolean; classify: boolean }>({ notify: false, tweet: false, classify: false });
  const [classification, setClassification] = React.useState<{ category: string; severity: string; simulated: boolean } | null>(null);
  const [classifyMsg, setClassifyMsg] = React.useState<string>("");

  const onNotify = React.useCallback(async () => {
    if (!reportId) return;
    setNotifyMsg("");
    setLoading((s) => ({ ...s, notify: true }));
    try {
      const res = await fetch(`/api/reports/${reportId}/notify`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "notify failed");
      setNotifyMsg(body?.simulated ? "Email simulated (Mailpit off)." : `Email sent. id=${body?.messageId || "ok"}`);
    } catch (e: any) {
      setNotifyMsg(e?.message || "Failed to send email");
    } finally {
      setLoading((s) => ({ ...s, notify: false }));
    }
  }, [reportId]);

  const onTweet = React.useCallback(async () => {
    if (!reportId) return;
    setTweetMsg("");
    setLoading((s) => ({ ...s, tweet: true }));
    try {
      const res = await fetch(`/api/reports/${reportId}/tweet`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || body?.reason || "tweet failed");
      setTweetMsg(body?.simulated ? "Tweet simulated (no external post)." : `Tweet posted id=${body?.tweetId}`);
    } catch (e: any) {
      setTweetMsg(e?.message || "Failed to tweet");
    } finally {
      setLoading((s) => ({ ...s, tweet: false }));
    }
  }, [reportId]);

  const onClassify = React.useCallback(async () => {
    if (!reportId) return;
    setClassifyMsg("");
    setLoading((s) => ({ ...s, classify: true }));
    try {
      const res = await fetch(`/api/reports/${reportId}/classify`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "classify failed");
      const category = String(body?.category || "");
      const severity = String(body?.severity || "");
      const simulated = Boolean(body?.simulated);
      setClassification({ category, severity, simulated });
      setClassifyMsg(`Classified: ${category || 'n/a'} / ${severity || 'n/a'}${simulated ? ' (simulated)' : ''}`);
    } catch (e: any) {
      setClassification(null);
      setClassifyMsg(e?.message || "Failed to classify");
    } finally {
      setLoading((s) => ({ ...s, classify: false }));
    }
  }, [reportId]);

  // After successful submit, run classification, then auto-notify
  React.useEffect(() => {
    if (!reportId) return;
    setClassification(null);
    (async () => {
      await onClassify();
      await onNotify();
    })();
  }, [reportId, onClassify, onNotify]);

return (
    <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
      <section className="space-y-3">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-neutral-100">Bengaluru Infra Reporter</h1>
          <p className="text-sm text-neutral-400">Capture a photo + GPS + description, then submit. After saving, you can send a local email and simulate a tweet.</p>
        </header>
        <div className="bg-neutral-900/60 backdrop-blur border border-neutral-800 rounded-xl p-4">
          <ReportForm onSubmitted={setReportId} />
        </div>

      {reportId && (
          <div className="bg-neutral-900/60 backdrop-blur border border-dashed border-neutral-700 rounded-xl p-4">
            <h3 className="text-lg font-medium mb-2">Actions</h3>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={onClassify} disabled={loading.classify} className="h-9 px-4 rounded-md border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60">
                {loading.classify ? "Classifying…" : "Classify (MCP)"}
              </button>
              <button onClick={onNotify} disabled={loading.notify} className="h-9 px-4 rounded-md border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60">
                {loading.notify ? "Sending…" : "Send email (Mailpit)"}
              </button>
              <button onClick={onTweet} disabled={loading.tweet} className="h-9 px-4 rounded-md border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60">
                {loading.tweet ? "Posting…" : "Tweet (simulated)"}
              </button>
              <div className={`min-w-[280px] text-sm ${classifyMsg.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>{classifyMsg}</div>
              {classification && (
                <div className="text-sm text-neutral-300">Classified: <strong>{classification.category}</strong> / <strong>{classification.severity}</strong>{classification.simulated ? ' (simulated)' : ''}</div>
              )}
              <div className={`min-w-[280px] text-sm ${notifyMsg.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>{notifyMsg}</div>
              <div className={`min-w-[280px] text-sm ${tweetMsg.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>{tweetMsg}</div>
            </div>
          </div>
        )}
      </section>

      <aside className="bg-neutral-900/60 backdrop-blur border border-neutral-800 rounded-xl p-2">
        <DashboardView refreshToken={reportId || 0} />
      </aside>
    </main>
  );
}