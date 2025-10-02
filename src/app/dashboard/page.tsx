import Link from "next/link";
import DashboardView from "./DashboardView";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div>
      <div style={{ padding: 8, background: '#fffbe6', border: '1px solid #f0e6a6', borderRadius: 6, margin: 8 }}>
        New: A single landing page is available at <Link href="/">/</Link> combining the report form and dashboard.
      </div>
      <DashboardView />
    </div>
  );
}
