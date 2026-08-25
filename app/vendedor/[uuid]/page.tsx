// PAGINA PUBLICA DEL VENDEDOR: /VENDEDOR/[UUID]
// El uuid (keyUrl) es la credencial de acceso: identifica al vendedor y
// filtra sus cuentas por cobrar. Se renderiza por request para que la
// morosidad esté siempre al día.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSellerPortal } from "@/services/get-seller-portal";
import SellerStatement from "./_components/seller-statement";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ uuid: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { uuid } = await params;
  const portal = await getSellerPortal(uuid);
  return {
    title: portal ? `CxC · ${portal.seller.name}` : "CxC",
    robots: { index: false, follow: false },
  };
}

export default async function SellerPage({ params }: PageProps) {
  const { uuid } = await params;
  const portal = await getSellerPortal(uuid);
  if (!portal) notFound();

  const fullName = [portal.seller.name, portal.seller.surname].filter(Boolean).join(" ");

  return (
    <SellerStatement
      fullName={fullName}
      zone={portal.seller.zone}
      loadedAt={portal.loadedAt}
      rows={portal.rows}
    />
  );
}
