"use client";

import React from "react";
import dynamic from "next/dynamic";
import ReportForm from "../report/ReportForm";
import Logo from "@/components/Logo";

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
    <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
          {/* Report Form Section */}
          <section className="space-y-4 md:space-y-6">
            <header className="space-y-4">
              {/* Logo and Title */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 blur-xl rounded-full" />
                  <Logo className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 relative z-10 drop-shadow-2xl" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent leading-tight">
                    Bengaluru Infra AI
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                      🤖 AI-Powered
                    </span>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                      🚀 Real-time
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-2xl">
                <span className="font-semibold text-emerald-400">Smart civic reporting:</span> Upload infrastructure issues with photos and GPS. 
                Our AI automatically classifies, emails authorities, and posts tweets with 
                <span className="font-semibold text-blue-400"> Cerebras LLaMA 3.3 70B</span>.
              </p>
            </header>
            
            <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl p-4 md:p-6 lg:p-8">
              <ReportForm onSubmitted={setReportId} />
            </div>

            {/* Status indicators */}
            {reportId && (
              <div className="space-y-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <p className="text-sm text-emerald-400 font-medium">
                    ✅ Report submitted successfully! Auto-processing in progress...
                  </p>
                </div>
                
                {/* Classification Status */}
                {classifyMsg && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-sm text-blue-400 font-medium">
                      🤖 {classifyMsg}
                    </p>
                  </div>
                )}
                
                {/* Email Status */}
                {notifyMsg && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                    <p className="text-sm text-purple-400 font-medium">
                      📧 {notifyMsg}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Dashboard Section */}
          <aside className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
            <DashboardView refreshToken={reportId || 0} />
          </aside>
        </div>
      </div>
    </main>
  );
}