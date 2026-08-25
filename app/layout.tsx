import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import DashboardShellWithProvider from "./_components/dashboard-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CXC G&M",
  description: "Dashboard con las cuentas por cobrar",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

// App 100% data-driven (header con vendedores desde BD): siempre SSR por
// request, sin prerender en build.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="robots" content="noindex,nofollow" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <DashboardShellWithProvider>{children}</DashboardShellWithProvider>
        </Providers>
      </body>
    </html>
  );
}
