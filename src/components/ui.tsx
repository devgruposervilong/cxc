import { clsx, type ClassValue } from "clsx";
import {
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { X } from "lucide-react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";
type ButtonSize = "sm" | "md";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-700 focus-visible:ring-zinc-400",
  secondary:
    "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 focus-visible:ring-zinc-300",
  danger:
    "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-400",
  ghost:
    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-zinc-300",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
    />
  );
}

export const iconButtonClass =
  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export const menuItemClass =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50";

export function Tooltip({
  label,
  align = "right",
  children,
}: {
  label: string;
  align?: "left" | "right";
  children: ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute top-full z-50 mt-2 hidden whitespace-nowrap rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-700 shadow-md group-hover:block group-focus-within:block",
          align === "right" ? "right-0" : "left-0"
        )}
      >
        {label}
      </span>
    </span>
  );
}

export function TextField({
  label,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <input
        {...props}
        className={cn(
          "rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 lg:text-sm",
          error && "border-red-400",
          className
        )}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function SelectField({
  label,
  error,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <select
        {...props}
        className={cn(
          "cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 lg:text-sm",
          error && "border-red-400",
          className
        )}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Alert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const tones = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-zinc-200 bg-zinc-50 text-zinc-600",
  };

  return (
    <div className={cn("rounded-md border px-3 py-2 text-sm", tones[tone])}>
      {children}
    </div>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Modal({
  title,
  description,
  onClose,
  children,
  className,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-[1px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-xl",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-zinc-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="cursor-pointer rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Eliminar",
  pendingLabel = "Eliminando...",
  isPending,
  error,
  onConfirm,
  onClose,
}: {
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  pendingLabel?: string;
  isPending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <div className="text-sm text-zinc-600">{description}</div>
      {error && (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={onConfirm}
          disabled={isPending}
        >
          {isPending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

export function fieldErrors(errors: unknown[]): string[] {
  return errors.map((error) => {
    if (typeof error === "string") return error;
    if (error && typeof error === "object" && "message" in error) {
      return String((error as { message: unknown }).message);
    }
    return String(error);
  });
}
