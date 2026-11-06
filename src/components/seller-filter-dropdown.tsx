import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Filter } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "./ui";

export type SellerFilterOption = {
  name: string;
  percentage: number;
  invoices: number;
  creditNotes: number;
  receivables: number;
};

export function SellerFilterDropdown({
  sellers,
  value,
  onChange,
}: {
  sellers: SellerFilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function select(nextValue: string | null) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-md border bg-white px-3 text-sm text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 sm:w-64",
          open ? "border-zinc-400" : "border-zinc-300"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Filter className="h-4 w-4 shrink-0 text-zinc-500" />
          <span className="truncate">
            <span className="text-zinc-500">Vendedor: </span>
            <span className="font-medium text-zinc-900">
              {value ?? "Todos"}
            </span>
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Filtrar por vendedor"
          className="absolute left-0 top-full z-30 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg sm:w-72"
        >
          <p className="px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Filtrar por vendedor
          </p>
          <div className="max-h-[60vh] overflow-y-auto">
            <button
              type="button"
              role="menuitemradio"
              aria-checked={!value}
              onClick={() => select(null)}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-zinc-50",
                !value
                  ? "bg-zinc-100 font-medium text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              <span className="truncate">Todos</span>
              {!value && (
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              )}
            </button>

            {sellers.map((seller) => {
              const selected = value === seller.name;
              return (
                <button
                  key={seller.name}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  onClick={() => select(seller.name)}
                  title={`Facturas: ${seller.invoices} | N/C: ${
                    seller.creditNotes
                  } | CxC: ${formatCurrency(seller.receivables)}`}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-zinc-50",
                    selected
                      ? "bg-zinc-100 font-medium text-zinc-900"
                      : "text-zinc-600 hover:text-zinc-900"
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {seller.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs tabular-nums text-zinc-500">
                      {seller.percentage.toFixed(1)}%
                    </span>
                    {selected && (
                      <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
