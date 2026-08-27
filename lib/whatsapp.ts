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

  for (const d of docs) {
    lines.push("");
    lines.push(`*DOCUMENTO*`);
    lines.push(`${d.type === "FACT" ? "Factura" : "N/CR"}: ${d.number}`);
    lines.push(`Vence: ${d.expiration ?? "N/D"}`);
    if (d.overdueDays > 0) {
      lines.push(`Morosidad: ${d.overdueDays} días de mora`);
    }
    lines.push(`Total: ${formatCurrency(d.total ?? 0)}`);
  }

  lines.push("");
  lines.push(`*TOTAL:* ${formatCurrency(subtotal)}`);

  return lines.join("\n");
}

export function openWhatsApp(message: string) {
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}
