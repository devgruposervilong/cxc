import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Seller } from "@/lib/types";
import { cn } from "./ui";

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
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenPath(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenPath(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

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

  if (sellers.length === 0) return null;

  return (
    <nav ref={containerRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpenPath(open ? null : pathname)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Ver vendedores"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition",
          open
            ? "bg-zinc-100 text-zinc-900"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        )}
      >
        Vendedores
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 max-h-80 w-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg"
        >
          {sellers.map((seller) => {
            const fullName = [seller.name, seller.surname]
              .filter(Boolean)
              .join(" ");
            const isActive =
              pathname === `/vendedor/${encodeURIComponent(seller.keyUrl)}`;

            return (
              <Link
                key={seller.keyUrl}
                to="/vendedor/$keyUrl"
                params={{ keyUrl: seller.keyUrl }}
                role="menuitem"
                onClick={() => setOpenPath(null)}
                className={cn(
                  "block truncate rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
                title={`Ver CxC de ${fullName}`}
              >
                {fullName}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
