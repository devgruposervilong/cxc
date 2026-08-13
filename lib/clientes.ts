import type { ClienteRankeado, Documento } from "@/lib/types";

export function rankearClientes(documentos: Documento[]): ClienteRankeado[] {
  const grupos = new Map<string, Documento[]>();
  for (const doc of documentos) {
    const key = doc.CLIENTE ?? "SIN_CLIENTE";
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(doc);
  }

  const resultado: ClienteRankeado[] = [];

  for (const [nombre, docs] of grupos) {
    const morosidadMax = Math.max(...docs.map((d) => d.MOROSIDAD));
    const facturasEnMax = docs.filter(
      (d) => d.MOROSIDAD === morosidadMax && d.TIPO === "FACT"
    );
    const montoTiebreaker =
      facturasEnMax.length > 0
        ? Math.max(...facturasEnMax.map((d) => d.TOTAL ?? 0))
        : 0;

    const totalGeneral = docs.reduce((sum, d) => sum + (d.TOTAL ?? 0), 0);

    const docsOrdenados = [...docs].sort((a, b) => {
      if (b.MOROSIDAD !== a.MOROSIDAD) return b.MOROSIDAD - a.MOROSIDAD;
      return (b.TOTAL ?? 0) - (a.TOTAL ?? 0);
    });

    resultado.push({
      nombre,
      morosidadMax,
      montoTiebreaker,
      documentos: docsOrdenados,
      totalGeneral,
    });
  }

  resultado.sort((a, b) => {
    if (b.morosidadMax !== a.morosidadMax) return b.morosidadMax - a.morosidadMax;
    return b.montoTiebreaker - a.montoTiebreaker;
  });

  return resultado;
}
