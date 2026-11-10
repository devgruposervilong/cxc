import {
  createFileRoute,
  redirect,
  useRouteContext,
} from "@tanstack/react-router";
import { TablesPage } from "@/src/components/tables-page";
import { sessionQueryOptions } from "@/src/lib/session";

export const Route = createFileRoute("/_app/tablas")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!me || me.user.role === "seller") {
      throw redirect({ to: "/" });
    }
  },
  component: TablesRoute,
});

function TablesRoute() {
  const { me } = useRouteContext({ from: "/_app" });
  return <TablesPage canManage={me.user.role === "admin"} />;
}
