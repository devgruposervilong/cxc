import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "@/src/lib/session";

export const Route = createFileRoute("/_public")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(sessionQueryOptions());
    if (me) {
      throw redirect({ to: "/" });
    }
  },
  component: () => <Outlet />,
});
