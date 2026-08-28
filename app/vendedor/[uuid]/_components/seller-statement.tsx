//COMPONENTE EN LA RUTA /VENDEDOR/[UUID]/_COMPONENTS/SELLER-STATEMENT
import { Fragment, useMemo } from "react";
import type { DataRow } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import ClientCardsMobile from "@/app/_components/client-cards-mobile";

export type SellerStatementProps = {
  fullName: string;
  zone: string | null;
  loadedAt: string;
  rows: DataRow[];
};

type ClientGroup = {
  client: string;
  rank: number;
  docs: DataRow[];
  subtotal: number;
};

export default function SellerStatement({ fullName, zone, loadedAt, rows }: SellerStatementProps) {
  const totalInvoices = rows.filter((f) => f.type === "FACT").length;
  const totalCreditNotes = rows.filter((f) => f.type === "N/CR").length;

  // Agrupa por cliente igual que el panel interno: cada grupo toma el menor
  // RANGO de sus documentos para el orden y suma TOTAL tal cual (las N/CR ya
  // vienen con signo negativo desde el ERP).
  const groups = useMemo<ClientGroup[]>(() => {
    const map = new Map<string, DataRow[]>();
    for (const f of rows) {
      const client = f.client ?? "SIN CLIENTE";
      if (!map.has(client)) map.set(client, []);
      map.get(client)!.push(f);
    }

    const result = Array.from(map.entries()).map(([client, docs]) => {
      const validRanks = docs.map((d) => Number(d.rank)).filter((n) => Number.isFinite(n));
      const rank = validRanks.length ? Math.min(...validRanks) : Infinity;
      const subtotal = docs.reduce((s, d) => s + (d.total ?? 0), 0);
      return { client, rank, docs, subtotal };
    });

    result.sort((a, b) => a.rank - b.rank);
    return result;
  }, [rows]);

  const grandTotal = groups.reduce((s, g) => s + g.subtotal, 0);
  const vencidas = rows.filter((f) => f.overdueDays >= 15 && f.type === "FACT").length;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-zinc-900">{fullName}</h2>
          <p className="text-sm text-zinc-500">
            {zone ? `${zone} · ` : ""}
            {loadedAt ? `Actualizado: ${loadedAt}` : "Sin carga de datos activa"}
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4 md:gap-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Facturas</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 md:text-2xl">{totalInvoices}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Notas de Crédito</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 md:text-2xl">{totalCreditNotes}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Facturas Vencidas (+15 días)</p>
          <p className={`mt-1 text-lg font-semibold md:text-2xl ${vencidas > 0 ? "text-red-600" : "text-zinc-900"}`}>
            {vencidas}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm md:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Total Cuentas x Cobrar</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600 md:text-2xl">{formatCurrency(grandTotal)}</p>
        </div>
      </div>

      {/* Vista mobile: cards expandibles por cliente (scroll global del documento) */}
      <div className="md:hidden">
        <ClientCardsMobile groups={groups} showShare />
      </div>

      {/* Detalle por cliente (solo desktop) */}
      <div className="hidden min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-sm md:block">
        {groups.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-sm text-zinc-500">
            No hay cuentas por cobrar asignadas en este momento.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-900 text-white">
              <tr className="border-b border-zinc-700">
                <th className="px-4 py-3 font-semibold">RANGO</th>
                <th className="px-4 py-3 font-semibold">CLIENTE</th>
                <th className="px-4 py-3 font-semibold">TIPO</th>
                <th className="px-4 py-3 font-semibold">NUMERO</th>
                <th className="px-4 py-3 font-semibold">EMISION</th>
                <th className="px-4 py-3 font-semibold">VENCIMIENTO</th>
                <th className="px-4 py-3 text-center font-semibold">MOROSIDAD (DIAS)</th>
                <th className="px-4 py-3 text-right font-semibold">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g.client}>
                  {g.docs.map((f, i) => (
                    <tr key={`${g.client}-${i}`} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-2 text-zinc-700">{f.rank}</td>
                      <td className="px-4 py-2 text-zinc-700">{f.client}</td>
                      <td className="px-4 py-2 text-zinc-700">{f.type}</td>
                      <td className="px-4 py-2 text-zinc-700">{f.number}</td>
                      <td className="px-4 py-2 text-zinc-700">{f.emission}</td>
                      <td className="px-4 py-2 text-zinc-700">{f.expiration}</td>
                      <td className={`px-4 py-2 text-center ${f.overdueDays >= 15 ? "text-red-600" : "text-zinc-700"}`}>
                        {f.overdueDays}
                      </td>
                      <td className="px-4 py-2 text-right text-zinc-700">{formatCurrency(f.total ?? 0)}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-zinc-200 bg-zinc-100 font-bold">
                    <td colSpan={7} className="px-4 py-2 text-right text-zinc-700">
                      Subtotal {g.client}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-zinc-900">{formatCurrency(g.subtotal)}</td>
                  </tr>
                </Fragment>
              ))}
              <tr className="bg-zinc-900 font-semibold text-white">
                <td colSpan={7} className="px-4 py-3 text-right">
                  TOTAL
                </td>
                <td className="px-4 py-3 text-right">{formatCurrency(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
