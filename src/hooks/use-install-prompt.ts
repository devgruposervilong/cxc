import { useEffect, useSyncExternalStore } from "react";
import {
  getInstallPromptState,
  initInstallPrompt,
  promptInstall,
  subscribeInstallPrompt,
  type InstallPromptState,
} from "@/src/lib/install-prompt";

// Estado del prompt de instalacion de la PWA y accion para dispararlo.
export function useInstallPrompt(): InstallPromptState & {
  install: () => Promise<"accepted" | "dismissed" | "unavailable">;
} {
  useEffect(() => {
    initInstallPrompt();
  }, []);

  const state = useSyncExternalStore(
    subscribeInstallPrompt,
    getInstallPromptState,
    getInstallPromptState
  );

  return { ...state, install: promptInstall };
}
