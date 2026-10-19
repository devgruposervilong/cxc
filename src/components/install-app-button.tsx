import { useEffect, useState } from "react";
import { Share, Smartphone, SquarePlus, X } from "lucide-react";
import { useInstallPrompt } from "@/src/hooks/use-install-prompt";
import { Button } from "./ui";

export function InstallAppButton({
  variant = "header",
}: {
  variant?: "header" | "auth";
}) {
  const { canPrompt, isInstalled, isIos, install } = useInstallPrompt();
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!instructionsOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInstructionsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [instructionsOpen]);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (canPrompt) {
      setInstalling(true);
      const outcome = await install();
      setInstalling(false);
      if (outcome === "unavailable") setInstructionsOpen(true);
      return;
    }

    setInstructionsOpen(true);
  };

  const label = installing ? "Instalando..." : "Instalar app";

  return (
    <>
      {variant === "header" ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void handleClick()}
          disabled={installing}
          aria-label={label}
          title="Instalar CXC G&M en este dispositivo"
          className="shrink-0 whitespace-nowrap"
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleClick()}
          disabled={installing}
        >
          <Smartphone className="h-4 w-4" />
          {label}
        </Button>
      )}

      {instructionsOpen && (
        <InstallInstructions
          isIos={isIos}
          onClose={() => setInstructionsOpen(false)}
        />
      )}
    </>
  );
}

function InstallInstructions({
  isIos,
  onClose,
}: {
  isIos: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-zinc-900/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-app-title"
        className="relative w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="install-app-title"
            className="text-base font-semibold text-zinc-900"
          >
            Instalar CXC G&M
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isIos ? (
          <div className="mt-3 text-sm text-zinc-600">
            <p>En iPhone o iPad la instalacion se hace desde Safari:</p>
            <ol className="mt-3 space-y-3">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                  1
                </span>
                <p>
                  Abre esta pagina en <strong>Safari</strong> y toca{" "}
                  <Share className="inline h-4 w-4 align-text-bottom" />{" "}
                  Compartir.
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                  2
                </span>
                <p>
                  Elige{" "}
                  <SquarePlus className="inline h-4 w-4 align-text-bottom" />{" "}
                  "Anadir a pantalla de inicio".
                </p>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                  3
                </span>
                <p>Confirma con "Anadir".</p>
              </li>
            </ol>
          </div>
        ) : (
          <div className="mt-3 text-sm text-zinc-600">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="text-zinc-800">Chrome o Edge:</strong> usa
                el icono de instalar de la barra de direcciones, o el menu ⋮ →{" "}
                "Instalar app".
              </li>
              <li>
                <strong className="text-zinc-800">Safari (Mac):</strong> menu
                Archivo → "Anadir al Dock".
              </li>
              <li>
                Si no aparece, recarga la pagina o abre la app en Chrome, Edge
                o Safari.
              </li>
            </ul>
          </div>
        )}

        <Button className="mt-5 w-full" onClick={onClose}>
          Entendido
        </Button>
      </div>
    </div>
  );
}
