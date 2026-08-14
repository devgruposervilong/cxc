import type { DataRow } from "@/lib/types";

// Ordena los clientes por morosidad (mayor a menor) y, como desempate, por el
// monto de la factura más vencida. Asigna el RANGO (1..n) a cada fila.
export function rankRows(rows: DataRow[]): DataRow[] {
  const groups = new Map<string, DataRow[]>();
  for (const row of rows) {
    const key = row.client ?? "SIN CLIENTE";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const ranked: Array<{
    key: string;
    maxOverdue: number;
    tiebreaker: number;
    rows: DataRow[];
  }> = [];

  for (const [key, docs] of groups) {
    const maxOverdue = Math.max(...docs.map((d) => d.overdueDays));
    const invoicesAtMax = docs.filter(
      (d) => d.overdueDays === maxOverdue && d.type === "FACT"
    );
    const tiebreaker =
      invoicesAtMax.length > 0
        ? Math.max(...invoicesAtMax.map((d) => d.total ?? 0))
        : 0;

    const sorted = [...docs].sort((a, b) => {
      if (b.overdueDays !== a.overdueDays) return b.overdueDays - a.overdueDays;
      return (b.total ?? 0) - (a.total ?? 0);
    });

    ranked.push({ key, maxOverdue, tiebreaker, rows: sorted });
  }

  ranked.sort((a, b) => {
    if (b.maxOverdue !== a.maxOverdue) return b.maxOverdue - a.maxOverdue;
    return b.tiebreaker - a.tiebreaker;
  });

  const result: DataRow[] = [];
  ranked.forEach((group, index) => {
    for (const doc of group.rows) result.push({ ...doc, rank: index + 1 });
  });
  return result;
}
