// Manejo propio del prompt de instalacion de la PWA.
//
// - En navegadores Chromium capturamos `beforeinstallprompt`, lo guardamos y lo
//   disparamos desde nuestro propio boton (el navegador no decide cuando
//   mostrarlo).
// - En iOS el evento no existe: mostramos instrucciones de Safari.
// - En el resto de navegadores (Firefox, Safari de escritorio o Chromium que
//   aun no considera la app instalable) mostramos una guia generica.

export type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt: () => Promise<void>;
};

export type InstallPromptState = {
  /** Hay un prompt nativo capturado y listo para dispararse. */
  canPrompt: boolean;
  /** La app ya corre instalada o se acaba de instalar. */
  isInstalled: boolean;
  /** Dispositivo iOS/iPadOS, donde no existe `beforeinstallprompt`. */
  isIos: boolean;
};

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let initialized = false;

const listeners = new Set<() => void>();

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const displayMode = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return displayMode || iosStandalone;
}

function isIosDevice(): boolean {
  const userAgent = navigator.userAgent;
  const ipadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(userAgent) || ipadOs;
}

function computeState(): InstallPromptState {
  const isInstalled = installed || isStandalone();
  return {
    canPrompt: Boolean(deferredPrompt) && !isInstalled,
    isInstalled,
    isIos: isIosDevice(),
  };
}

let state: InstallPromptState = {
  canPrompt: false,
  isInstalled: false,
  isIos: false,
};

function refresh() {
  state = computeState();
  for (const listener of listeners) listener();
}

// Idempotente: se llama al arrancar la app y cada vez que un componente usa el
// hook, por si el modulo se cargo despues del primer render.
export function initInstallPrompt() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    refresh();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
    refresh();
  });

  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener?.("change", refresh);

  refresh();
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getInstallPromptState(): InstallPromptState {
  return state;
}

export async function promptInstall(): Promise<InstallOutcome> {
  const deferred = deferredPrompt;
  if (!deferred) return "unavailable";

  deferredPrompt = null;
  await deferred.prompt();
  const choice = await deferred.userChoice;
  if (choice.outcome === "accepted") installed = true;
  refresh();
  return choice.outcome;
}
