"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelRightClose,
  Settings,
} from "lucide-react";
import { createContext, useContext, useMemo, useState } from "react";
import type { ComponentProps, ElementType, ReactNode } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type SidebarContextValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  const value = useMemo(
    () => ({
      collapsed,
      toggleCollapsed: () => setCollapsed((value) => !value),
    }),
    [collapsed]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

function Sidebar({ className, children, ...props }: ComponentProps<"aside">) {
  const { collapsed } = useSidebar();

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "flex h-screen flex-col border-r border-zinc-200 bg-white transition-all duration-200",
        collapsed ? "w-20" : "w-72",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

function SidebarHeader({ className, children }: ComponentProps<"div">) {
  return <div className={cn("border-b border-zinc-200 px-4 py-4", className)}>{children}</div>;
}

function SidebarContent({ className, children }: ComponentProps<"div">) {
  return <div className={cn("flex-1 px-3 py-4", className)}>{children}</div>;
}

function SidebarFooter({ className, children }: ComponentProps<"div">) {
  return <div className={cn("border-t border-zinc-200 p-3", className)}>{children}</div>;
}

function SidebarMenu({ className, children }: ComponentProps<"nav">) {
  return <nav className={cn("space-y-1", className)}>{children}</nav>;
}

function SidebarMenuItem({ className, children }: ComponentProps<"div">) {
  return <div className={cn("w-full", className)}>{children}</div>;
}

function SidebarMenuButton({
  href,
  icon: Icon,
  label,
  className,
}: {
  href: string;
  icon: ElementType;
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const active = pathname === href || (href !== "/dash" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-zinc-900 text-white shadow-sm"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function SidebarTrigger({ className }: ComponentProps<"button">) {
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggleCollapsed}
      className={cn(
        "rounded-md p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900",
        className
      )}
      aria-label="Colapsar sidebar"
    >
      {collapsed ? <PanelRightClose className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
    </button>
  );
}

function SidebarInset({ className, children }: ComponentProps<"main">) {
  return <main className={cn("flex-1", className)}>{children}</main>;
}

type NavItem = {
  href: string;
  label: string;
  icon: ElementType;
};

const navItems: NavItem[] = [
  { href: "/dash", label: "Inicio", icon: LayoutDashboard },
  { href: "/dash/files", label: "Archivos", icon: FileSpreadsheet },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white">
                  <BarChart3 className="h-5 w-5" />
                </div>
                {!collapsed && (
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">CXC Dashboard</p>
                  </div>
                )}
              </div>
              <SidebarTrigger />
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton href={item.href} icon={item.icon} label={item.label} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <header className="border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-zinc-900">Cuentas x Cobrar</h1>
              </div>

            </div>
          </header>

          <div className="p-6">{children}</div>
        </SidebarInset>
      </div>
    </div>
  );
}

export function DashboardShellProvider({ children }: { children: ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}

export default function DashboardShellWithProvider({ children }: { children: ReactNode }) {
  return <DashboardShellProvider><DashboardShell>{children}</DashboardShell></DashboardShellProvider>;
}
