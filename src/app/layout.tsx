import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandMenu } from "@/components/command-menu";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CER 2 - Sistema de Gestão de Reabilitação",
  description: "Sistema especializado em gestão de prontuários, filas de espera e absenteísmo para o Centro Especializado em Reabilitação.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${geistMono.variable} antialiased font-sans`}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-12 items-center gap-2 border-b border-slate-200 bg-white px-4">
              <SidebarTrigger className="text-slate-500 hover:text-slate-700" />
              <div className="h-4 w-px bg-slate-200" />
              <span className="text-sm text-slate-500">CER 2 — Centro Especializado em Reabilitação</span>
            </header>
            <main className="flex-1 min-w-0 bg-slate-50 overflow-y-auto pb-10">
              {children}
            </main>
          </SidebarInset>
          <CommandMenu />
        </SidebarProvider>
      </body>
    </html>
  );
}
