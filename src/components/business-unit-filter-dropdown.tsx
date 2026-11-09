import { useEffect, useRef, useState } from "react";
import { Building2, Check, ChevronDown } from "lucide-react";
import { cn } from "./ui";

export type BusinessUnitFilterOption = {
  value: string;
  label: string;
};

export function BusinessUnitFilterDropdown({
  options,
  value,
  onChange,
}: {
  options: BusinessUnitFilterOption[];
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

  const selected = options.find((option) => option.value === value);

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
          <Building2 className="h-4 w-4 shrink-0 text-zinc-500" />
          <span className="truncate">
            <span className="text-zinc-500">Unidad: </span>
            <span className="font-medium text-zinc-900">
              {selected?.label ?? "Todas"}
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
          aria-label="Filtrar por unidad de negocio"
          className="absolute right-0 top-full z-30 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg sm:w-64"
        >
          <p className="px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Filtrar por unidad de negocio
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
              <span className="truncate">Todas las unidades</span>
              {!value && (
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              )}
            </button>

            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={() => select(option.value)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-zinc-50",
                    isSelected
                      ? "bg-zinc-100 font-medium text-zinc-900"
                      : "text-zinc-600 hover:text-zinc-900"
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                  </span>
                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
