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
    <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
          {/* Report Form Section */}
          <section className="space-y-4 md:space-y-6">
            <header className="space-y-2">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-100 bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
                Bengaluru Infra AI Reporter
              </h1>
              <p className="text-sm md:text-base text-neutral-400 leading-relaxed max-w-2xl">
                AI-powered civic reporting agent that automatically emails and tweets your infrastructure issues to respective authorities
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
                
                {/* Manual Tweet Button - For Demo Control */}
                {notifyMsg && (
                  <div className="bg-neutral-900/80 border border-neutral-700 rounded-xl p-4 space-y-3">
                    <p className="text-sm text-neutral-300 font-medium">
                      📱 Ready to post AI-generated tweet?
                    </p>
                    <button
                      onClick={onTweet}
                      disabled={loading.tweet}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-neutral-700 disabled:to-neutral-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading.tweet ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          <span>Generating AI Tweet...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          <span>Post AI Tweet to Twitter</span>
                        </>
                      )}
                    </button>
                    
                    {/* Tweet Status */}
                    {tweetMsg && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-xs text-blue-400">
                          {tweetMsg.includes('simulated') ? '🧪 ' : '✅ '}
                          {tweetMsg}
                        </p>
                      </div>
                    )}
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