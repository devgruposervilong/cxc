import { formatCurrency } from "./format";

type Doc = {
  type: string;
  number: string;
  expiration: string | null;
  overdueDays: number;
  total: number | null;
};

export function buildWhatsAppMessage(
  client: string,
  docs: Doc[],
  subtotal: number,
) {
  const lines: string[] = [];

  lines.push(`*Estado de Cuenta — ${client}*`);
  lines.push("");

  for (const d of docs) {
    const status = d.overdueDays > 0 ? ` (${d.overdueDays} días de mora)` : "";
    lines.push(`*Documento:* ${d.type} N.º ${d.number}${status}`);
    lines.push(`Vence: ${d.expiration ?? "N/D"} — ${formatCurrency(d.total ?? 0)}`);
    lines.push("");
  }

  lines.push(`*TOTAL:* ${formatCurrency(subtotal)}`);

  return lines.join("\n");
}

export function openWhatsApp(message: string) {
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}
