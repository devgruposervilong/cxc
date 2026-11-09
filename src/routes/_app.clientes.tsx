import {
  createFileRoute,
  redirect,
  useRouteContext,
} from "@tanstack/react-router";
import { ClientsPage } from "@/src/components/clients-page";
import { sessionQueryOptions } from "@/src/lib/session";

export const Route = createFileRoute("/_app/clientes")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (!me || me.user.role === "seller") {
      throw redirect({ to: "/" });
    }
  },
  component: ClientsRoute,
});

function ClientsRoute() {
  const { me } = useRouteContext({ from: "/_app" });
  return <ClientsPage canManage={me.user.role === "admin"} />;
}
