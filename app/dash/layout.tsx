import DashboardShellWithProvider from "./_components/dashboard-shell";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShellWithProvider>{children}</DashboardShellWithProvider>;
}
