import type { DataRow } from "@/lib/types";
import { rankRows } from "@/lib/ranking";

// MOROSIDAD se calcula en el cliente al renderizar y se guarda en estado.
// La fuente de verdad que viaja a la BD es expiration (string DD/MM/YYYY);
// overdueDays ya no se persiste y se recalcula con el día actual.

function parseDate(value: string | null): { anio: number; mes: number; dia: number } | null {
  if (!value) return null;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dia, mes, anio] = match;
  return { anio: Number(anio), mes: Number(mes), dia: Number(dia) };
}

// Días de morosidad de un vencimiento respecto a hoy. Se compara por fecha
// (UTC) para no depender de la zona horaria ni del horario de verano.
function computeOverdueDays(expiration: string | null, today: Date): number {
  const parsed = parseDate(expiration);
  if (!parsed) return 0;
  const hoy = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const vence = Date.UTC(parsed.anio, parsed.mes - 1, parsed.dia);
  const days = Math.floor((hoy - vence) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

// Recalcula la morosidad de cada fila y re-ejecuta el ranking. Se llama en el
// cliente al renderizar: tanto al hidratar desde la BD como al subir un archivo.
export function refreshMorosidad(rows: DataRow[], today: Date = new Date()): DataRow[] {
  const frescas = rows.map((f) => ({
    ...f,
    overdueDays: f.type === "FACT" ? computeOverdueDays(f.expiration, today) : 0,
  }));
  return rankRows(frescas);
}
