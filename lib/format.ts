// Formato de montos compartido por la tabla desktop y las cards mobile.
export function formatCurrency(valor: number) {
  const negativo = valor < 0;
  const abs = Math.abs(valor);
  const [entera, decimal] = abs.toFixed(2).split(".");
  const conMiles = entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negativo ? "-" : ""}$${conMiles},${decimal}`;
}

// Valor editable: sin simbolo de moneda ni separador de miles para que sea
// comodo corregirlo en un input de texto.
export function formatAmountForInput(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "";
  return value.toFixed(2).replace(".", ",");
}

export type AmountParseResult = {
  value: number | null;
  error: string | null;
};

// Acepta montos escritos como 1234,56 / 1.234,56 / 1234.56 / 1,234.56.
// Limita los decimales a dos y devuelve un mensaje listo para mostrar.
export function parseAmountInput(raw: string): AmountParseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { value: null, error: null };

  let normalized = trimmed.replace(/[$\s]/g, "");
  let negative = false;

  if (normalized.startsWith("-")) {
    negative = true;
    normalized = normalized.slice(1);
  } else if (normalized.startsWith("+")) {
    normalized = normalized.slice(1);
  }

  if (!normalized || !/^[\d.,]+$/.test(normalized)) {
    return { value: null, error: "Ingresa un monto valido" };
  }

  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    // El ultimo separador es el decimal; el otro es de miles.
    normalized =
      normalized.lastIndexOf(",") > normalized.lastIndexOf(".")
        ? normalized.replace(/\./g, "").replace(/,/g, ".")
        : normalized.replace(/,/g, "");
  } else if (hasComma) {
    if (/^\d{1,3}(,\d{3})+$/.test(normalized)) {
      normalized = normalized.replace(/,/g, "");
    } else {
      const parts = normalized.split(",");
      if (parts.length > 2) {
        return { value: null, error: "Usa solo un separador decimal" };
      }
      normalized = `${parts[0]}.${parts[1] ?? ""}`;
    }
  } else if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, "");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return { value: null, error: "Usa solo numeros y hasta 2 decimales" };
  }

  const parsed = Number(`${negative ? "-" : ""}${normalized}`);
  return Number.isFinite(parsed)
    ? { value: parsed, error: null }
    : { value: null, error: "Monto invalido" };
}

