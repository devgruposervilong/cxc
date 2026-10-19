import { createFileRoute, redirect, useRouteContext } from "@tanstack/react-router";
import { sessionQueryOptions } from "@/src/lib/session";
import { AdminUsersPage } from "@/src/components/admin-users";

export const Route = createFileRoute("/_app/admin/usuarios")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (me?.user.role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
  component: AdminUsersRoute,
});

function AdminUsersRoute() {
  const { me } = useRouteContext({ from: "/_app" });
  return <AdminUsersPage currentUserId={me.user.id} />;
}
