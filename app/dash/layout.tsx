import DashboardShell from "./_components/dashboard-shell";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
