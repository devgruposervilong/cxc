import type { ReactNode } from "react";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-8 sm:py-10">
      <div className="w-full min-w-0 max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900">
            <img
              src="/logo-mark-white.png"
              alt=""
              className="h-7 w-7"
              draggable={false}
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">CXC G&M</h1>
            <p className="text-xs text-zinc-500">Cuentas por cobrar</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          {subtitle && (
            <p className="mt-1 break-words text-sm text-zinc-500">{subtitle}</p>
          )}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
