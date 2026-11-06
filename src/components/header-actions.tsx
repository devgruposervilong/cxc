import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type HeaderActionsContextValue = {
  slot: HTMLDivElement | null;
  setSlot: (node: HTMLDivElement | null) => void;
};

const HeaderActionsContext = createContext<HeaderActionsContextValue | null>(
  null
);

export function HeaderActionsProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);

  return (
    <HeaderActionsContext.Provider value={{ slot, setSlot }}>
      {children}
    </HeaderActionsContext.Provider>
  );
}

export function HeaderActionsSlot() {
  const context = useContext(HeaderActionsContext);
  const setSlot = context?.setSlot;
  const setSlotNode = useCallback(
    (node: HTMLDivElement | null) => {
      setSlot?.(node);
    },
    [setSlot]
  );

  if (!context) {
    throw new Error(
      "HeaderActionsSlot must be used within HeaderActionsProvider"
    );
  }

  return <div ref={setSlotNode} className="contents" />;
}

export function HeaderActionsPortal({ children }: { children: ReactNode }) {
  const context = useContext(HeaderActionsContext);
  if (!context?.slot) return null;

  return createPortal(children, context.slot);
}
