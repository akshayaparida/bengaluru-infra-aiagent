import ReportForm from "./ReportForm";

export const dynamic = "force-dynamic";

export default function ReportPage() {
  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <div style={{ padding: 8, background: '#fffbe6', border: '1px solid #f0e6a6', borderRadius: 6, marginBottom: 12 }}>
        New: A single landing page is available at <a href="/">/</a> combining the report form and dashboard.
      </div>
      <h1 style={{ marginBottom: "1rem" }}>Report an infrastructure issue</h1>
      <p style={{ color: "#555", marginBottom: "1rem" }}>
        Submit a short description, attach a photo, and include your current location.
        This data stays on your machine for the local demo.
      </p>
      <ReportForm />
    </main>
  );
}
