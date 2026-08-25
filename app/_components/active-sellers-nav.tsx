//COMPONENTE EN LA RUTA /_COMPONENTS/ACTIVE-SELLERS-NAV
// Accesos directos al portal de cada vendedor activo. Solo se muestra en la
// ruta principal (y solo en desktop), no dentro del portal de un vendedor.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Seller } from "@/lib/types";

export default function ActiveSellersNav({ sellers }: { sellers: Seller[] }) {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return (
    <nav className="hidden flex-wrap items-center justify-end gap-x-3 gap-y-1 md:flex">
      {sellers.map((s) => {
        const fullName = [s.name, s.surname].filter(Boolean).join(" ");
        return (
          <Link
            key={s.keyUrl}
            href={`/vendedor/${s.keyUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 hover:underline"
            title={`Ver CxC de ${fullName} (abre en otra pestaña)`}
          >
            {fullName}
          </Link>
        );
      })}
    </nav>
  );
}
