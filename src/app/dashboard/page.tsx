import dynamic from "next/dynamic";

export const dynamic = "force-dynamic";

const DashboardView = dynamic(() => import("./DashboardView"), { ssr: false });

export default function DashboardPage() {
  return (
    <div>
      <div style={{ padding: 8, background: '#fffbe6', border: '1px solid #f0e6a6', borderRadius: 6, margin: 8 }}>
        New: A single landing page is available at <a href="/">/</a> combining the report form and dashboard.
      </div>
      <DashboardView />
    </div>
  );
}
