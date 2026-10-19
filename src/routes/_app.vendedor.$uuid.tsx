import { useEffect } from "react";
import {
  createFileRoute,
  redirect,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { sessionQueryOptions } from "@/src/lib/session";
import { sellerPortalQueryOptions } from "@/src/lib/queries";
import { SellerStatement } from "@/src/components/seller-statement";
import { Alert, Button } from "@/src/components/ui";

export const Route = createFileRoute("/_app/vendedor/$uuid")({
  beforeLoad: async ({ context, params }) => {
    const me = await context.queryClient.ensureQueryData(sessionQueryOptions());

    if (me?.user.role === "seller") {
      if (!me.seller) {
        throw redirect({ to: "/" });
      }
      if (me.seller.keyUrl !== params.uuid) {
        throw redirect({
          to: "/vendedor/$uuid",
          params: { uuid: me.seller.keyUrl },
        });
      }
    }
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(sellerPortalQueryOptions(params.uuid)),
  component: SellerPortalPage,
  errorComponent: SellerPortalError,
});

function SellerPortalPage() {
  const portal = Route.useLoaderData()!;
  const fullName = [portal.seller.name, portal.seller.surname]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    document.title = `CxC · ${portal.seller.name}`;
  }, [portal.seller.name]);

  return (
    <SellerStatement
      fullName={fullName}
      zone={portal.seller.zone}
      loadedAt={portal.loadedAt}
      rows={portal.rows}
    />
  );
}

function SellerPortalError({ error }: ErrorComponentProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <Alert tone="error">
          {error instanceof Error
            ? error.message
            : "No se encontro el portal del vendedor"}
        </Alert>
        <Button
          variant="secondary"
          onClick={() => window.location.assign("/")}
        >
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
