import { createFileRoute, redirect, useRouteContext } from "@tanstack/react-router";
import { sessionQueryOptions } from "@/src/lib/session";
import { DashboardPage } from "@/src/components/dashboard-page";

export const Route = createFileRoute("/_app/")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (me?.user.role === "seller" && me.seller) {
      throw redirect({
        to: "/vendedor/$uuid",
        params: { uuid: me.seller.keyUrl },
      });
    }
  },
  component: IndexPage,
});

function IndexPage() {
  const { me } = useRouteContext({ from: "/_app" });
  return <DashboardPage canManage={me.user.role === "admin"} />;
}
