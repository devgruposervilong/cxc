import { useQuery } from "@tanstack/react-query";
import { uploadQueryOptions } from "@/src/lib/queries";
import { PanelProvider, usePanel } from "@/src/panel";
import { DataView } from "./data-view";
import { FileUpload } from "./file-upload";
import { Alert, Button } from "./ui";

function PanelContent({ canManage }: { canManage: boolean }) {
  const { filas } = usePanel();
  return filas.length > 0 ? (
    <DataView canManage={canManage} />
  ) : (
    <FileUpload />
  );
}

export function DashboardPage({ canManage }: { canManage: boolean }) {
  const { data, isPending, isError, error, refetch } = useQuery(
    uploadQueryOptions()
  );

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Cargando datos...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Alert tone="error">
          {error instanceof Error
            ? error.message
            : "No se pudieron cargar los datos"}
        </Alert>
        <Button variant="secondary" onClick={() => void refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <PanelProvider initialUpload={data ?? null}>
      <PanelContent canManage={canManage} />
    </PanelProvider>
  );
}
