import { Link } from "@tanstack/react-router";
import type { Seller } from "@/lib/types";

export function ActiveSellersNav({
  sellers,
  pathname,
  isSeller,
  sellerKeyUrl,
}: {
  sellers: Seller[];
  pathname: string;
  isSeller: boolean;
  sellerKeyUrl?: string;
}) {
  if (isSeller) {
    if (!sellerKeyUrl) return null;
    return (
      <nav className="hidden items-center gap-3 md:flex">
        <Link
          to="/vendedor/$keyUrl"
          params={{ keyUrl: sellerKeyUrl }}
          className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 hover:underline"
        >
          Mi portal
        </Link>
      </nav>
    );
  }

  if (pathname !== "/") return null;

  return (
    <nav className="hidden flex-wrap items-center justify-end gap-x-3 gap-y-1 md:flex">
      {sellers.map((seller) => {
        const fullName = [seller.name, seller.surname].filter(Boolean).join(" ");
        return (
          <Link
            key={seller.keyUrl}
            to="/vendedor/$keyUrl"
            params={{ keyUrl: seller.keyUrl }}
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 hover:underline"
            title={`Ver CxC de ${fullName}`}
          >
            {fullName}
          </Link>
        );
      })}
    </nav>
  );
}
