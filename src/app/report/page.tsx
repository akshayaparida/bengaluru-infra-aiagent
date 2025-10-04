import ReportForm from "./ReportForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ReportPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 shadow-sm">
        <p className="text-sm text-amber-900">
          New: A single landing page is available at <Link href="/" className="font-semibold underline hover:text-amber-700">/</Link> combining the report form and dashboard.
        </p>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-neutral-100 mb-4">Report an infrastructure issue</h1>
      <p className="text-neutral-400 mb-6 md:mb-8 text-sm md:text-base">
        Submit a short description, attach a photo, and include your current location.
        This data stays on your machine for the local demo.
      </p>
      <ReportForm />
    </main>
  );
}
