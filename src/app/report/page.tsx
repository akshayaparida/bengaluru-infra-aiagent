import ReportForm from "./ReportForm";

export const dynamic = "force-dynamic";

export default function ReportPage() {
  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>Report an infrastructure issue</h1>
      <p style={{ color: "#555", marginBottom: "1rem" }}>
        Submit a short description, attach a photo, and include your current location.
        This data stays on your machine for the local demo.
      </p>
      <ReportForm />
    </main>
  );
}