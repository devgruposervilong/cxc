import type { Document, RankedClient } from "@/lib/types";

export function rankClients(documents: Document[]): RankedClient[] {
  const groups = new Map<string, Document[]>();
  for (const doc of documents) {
    const key = doc.CLIENTE ?? "SIN_CLIENTE";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(doc);
  }

  const result: RankedClient[] = [];

  for (const [name, docs] of groups) {
    const maxOverdue = Math.max(...docs.map((d) => d.MOROSIDAD));
    const invoicesAtMax = docs.filter(
      (d) => d.MOROSIDAD === maxOverdue && d.TIPO === "FACT"
    );
    const tiebreakerAmount =
      invoicesAtMax.length > 0
        ? Math.max(...invoicesAtMax.map((d) => d.TOTAL ?? 0))
        : 0;

    const groupTotal = docs.reduce((sum, d) => sum + (d.TOTAL ?? 0), 0);

    const sortedDocs = [...docs].sort((a, b) => {
      if (b.MOROSIDAD !== a.MOROSIDAD) return b.MOROSIDAD - a.MOROSIDAD;
      return (b.TOTAL ?? 0) - (a.TOTAL ?? 0);
    });

    result.push({
      name,
      maxOverdue,
      tiebreakerAmount,
      documents: sortedDocs,
      grandTotal: groupTotal,
    });
  }

  result.sort((a, b) => {
    if (b.maxOverdue !== a.maxOverdue) return b.maxOverdue - a.maxOverdue;
    return b.tiebreakerAmount - a.tiebreakerAmount;
  });

  return result;
}