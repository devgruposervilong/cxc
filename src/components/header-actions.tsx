import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "./ui";

export type HeaderActionsTarget = "desktop" | "menu";

type HeaderActionsContextValue = {
  slots: Record<HeaderActionsTarget, HTMLDivElement | null>;
  setSlot: (target: HeaderActionsTarget, node: HTMLDivElement | null) => void;
};

const HeaderActionsContext = createContext<HeaderActionsContextValue | null>(
  null
);

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<
    Record<HeaderActionsTarget, HTMLDivElement | null>
  >({
    desktop: null,
    menu: null,
  });

  const setSlot = useCallback(
    (target: HeaderActionsTarget, node: HTMLDivElement | null) => {
      setSlots((current) =>
        current[target] === node ? current : { ...current, [target]: node }
      );
    },
    []
  );

  return (
    <HeaderActionsContext.Provider value={{ slots, setSlot }}>
      {children}
    </HeaderActionsContext.Provider>
  );
}

export function HeaderActionsSlot({
  target = "desktop",
}: {
  target?: HeaderActionsTarget;
}) {
  const context = useContext(HeaderActionsContext);
  const setSlot = context?.setSlot;
  const setSlotNode = useCallback(
    (node: HTMLDivElement | null) => {
      setSlot?.(target, node);
    },
    [setSlot, target]
  );

  if (!context) {
    throw new Error(
      "HeaderActionsSlot must be used within HeaderActionsProvider"
    );
  }

  return <div ref={setSlotNode} className="contents" />;
}

export function HeaderActionsPortal({
  target = "desktop",
  children,
}: {
  target?: HeaderActionsTarget;
  children: ReactNode;
}) {
  const context = useContext(HeaderActionsContext);
  const slot = context?.slots[target];
  if (!slot) return null;

  return createPortal(children, slot);
}

export function HeaderActionsMenu({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handlePanelClick(event: MouseEvent) {
      if (panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("click", handlePanelClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("click", handlePanelClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="static md:hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm font-medium transition",
          open
            ? "bg-zinc-100 text-zinc-900"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        )}
      >
        Acciones
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        ref={panelRef}
        role="menu"
        className={cn(
          "absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg",
          open ? "block" : "hidden"
        )}
      >
        <HeaderActionsSlot target="menu" />
        {children}
      </div>
    </div>
  );
}
