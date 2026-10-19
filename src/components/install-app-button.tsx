import { useEffect, useState } from "react";
import { Share, SquarePlus, X } from "lucide-react";
import { useInstallPrompt } from "@/src/hooks/use-install-prompt";
import { Button } from "./ui";

export function InstallAppButton() {
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
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button
          variant="primary"
          onClick={() => void handleClick()}
          disabled={installing}
          aria-label={label}
          className="pointer-events-auto gap-2.5 rounded-full px-5 py-2.5 text-sm shadow-xl shadow-zinc-900/30 ring-1 ring-white/10 active:scale-[0.98]"
        >
          <span className="relative flex h-5 w-5 items-center justify-center">
            <img
              src="/logo-mark-white.png"
              alt=""
              className="h-4 w-4"
              draggable={false}
            />
            <span className="absolute -right-1 -top-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
          </span>
          {label}
        </Button>
      </div>

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
