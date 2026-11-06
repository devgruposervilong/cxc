import { useLatestUpload } from "@/src/hooks/use-uploads";
import { PanelProvider, usePanel } from "@/src/panel";
import type { Me } from "@/src/lib/api";
import { DataView } from "./data-view";
import { FileUpload } from "./file-upload";
import { Alert, Button } from "./ui";

function PanelContent({
  canManage,
  user,
}: {
  canManage: boolean;
  user: Me["user"];
}) {
  const { filas } = usePanel();
  return filas.length > 0 ? (
    <DataView canManage={canManage} user={user} />
  ) : (
    <FileUpload />
  );
}

export function DashboardPage({
  canManage,
  user,
}: {
  canManage: boolean;
  user: Me["user"];
}) {
  const { data, isPending, isError, error, refetch } = useLatestUpload();

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
      <PanelContent canManage={canManage} user={user} />
    </PanelProvider>
  );
}
