//COMPONENTE EN LA RUTA /_COMPONENTS/CLIENT-CARDS-MOBILE
// Vista mobile de CxC: cards expandibles por cliente. Consume los mismos
// grupos (client/rank/subtotal/docs) que alimentan la tabla desktop.
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { DataRow } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export type ClientCardGroup = {
  client: string;
  rank: number;
  subtotal: number;
  docs: Pick<DataRow, "type" | "number" | "expiration" | "overdueDays" | "total">[];
};

function ClientCard({ group }: { group: ClientCardGroup }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 text-xs text-zinc-400">{group.rank}</span>
          <span className="truncate text-sm font-semibold text-zinc-900">{group.client}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-medium text-zinc-900">{formatCurrency(group.subtotal)}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      <div
        className={`grid transition-all duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="px-4 pb-3">
            {group.docs.map((d, i) => (
              <li
                key={`${d.type}-${d.number}-${i}`}
                className={`flex items-center gap-3 py-2.5 ${
                  i < group.docs.length - 1 ? "border-b border-zinc-100" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                        d.type === "FACT" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {d.type}
                    </span>
                    <span className="truncate text-sm text-zinc-700">{d.number}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Vence {d.expiration ?? "-"}
                    {d.overdueDays > 0 && ` · ${d.overdueDays} dias mora`}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-medium ${
                    (d.total ?? 0) < 0 ? "text-red-600" : "text-zinc-900"
                  }`}
                >
                  {formatCurrency(d.total ?? 0)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ClientCardsMobile({ groups }: { groups: ClientCardGroup[] }) {
  const grandTotal = groups.reduce((s, g) => s + g.subtotal, 0);

  return (
    <div className="flex flex-col gap-2.5">
      {groups.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500">
          No hay cuentas por cobrar para mostrar.
        </div>
      ) : (
        <>
          {groups.map((g) => (
            <ClientCard key={g.client} group={g} />
          ))}
          <div className="mt-1 flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-3 text-sm font-semibold text-white">
            <span>TOTAL</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </>
      )}
    </div>
  );
}
