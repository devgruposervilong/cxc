import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "@/src/lib/session";
import { DashboardShell } from "@/src/components/dashboard-shell";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!me) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
    return { me };
  },
  component: AppLayout,
});

function AppLayout() {
  const { me } = Route.useRouteContext();

  return (
    <DashboardShell me={me}>
      <Outlet />
    </DashboardShell>
  );
}
