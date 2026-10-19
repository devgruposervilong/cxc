import { createContext, useContext, useState, type ReactNode } from "react";
import { refreshMorosidad } from "@/lib/morosidad";
import type { DataRow } from "@/lib/types";
import type { LoadedUpload } from "./lib/api";

type PanelContextValue = {
  filas: DataRow[];
  setFilas: (filas: DataRow[]) => void;
  nombreArchivo: string;
  setNombreArchivo: (name: string) => void;
  cargadoEn: string | null;
  setCargadoEn: (cuando: string | null) => void;
  uploadId: string | null;
  setUploadId: (id: string | null) => void;
};

const PanelContext = createContext<PanelContextValue | null>(null);

export function usePanel() {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error("usePanel debe usarse dentro de PanelProvider");
  return ctx;
}

// La carga inicial viene de TanStack Query: se hidrata una sola vez al montar
// para que el panel sea la unica fuente de verdad mientras el usuario edita.
export function PanelProvider({
  initialUpload = null,
  children,
}: {
  initialUpload?: LoadedUpload | null;
  children: ReactNode;
}) {
  const [filas, setFilas] = useState<DataRow[]>(() =>
    initialUpload ? refreshMorosidad(initialUpload.rows) : []
  );
  const [nombreArchivo, setNombreArchivo] = useState(
    initialUpload?.fileName ?? ""
  );
  const [cargadoEn, setCargadoEn] = useState<string | null>(
    initialUpload?.loadedAt ?? null
  );
  const [uploadId, setUploadId] = useState<string | null>(
    initialUpload?.uploadId ?? null
  );

  return (
    <PanelContext.Provider
      value={{
        filas,
        setFilas,
        nombreArchivo,
        setNombreArchivo,
        cargadoEn,
        setCargadoEn,
        uploadId,
        setUploadId,
      }}
    >
      {children}
    </PanelContext.Provider>
  );
}
