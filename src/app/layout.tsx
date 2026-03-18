import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandMenu } from "@/components/command-menu";
import { getMeuPerfil } from "@/actions";
import { Toaster } from "sonner";

const nunitoSans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "CER 2 - Sistema de Gestão de Reabilitação",
  description: "Sistema especializado em gestão de prontuários, filas de espera e absenteísmo para o Centro Especializado em Reabilitação.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const perfil = await getMeuPerfil();

  return (
    <html lang="pt-BR">
      <body className={`${nunitoSans.variable} antialiased`}>
        <Toaster position="top-right" richColors closeButton />
        <SidebarProvider>
          <AppSidebar perfil={perfil} />
          <SidebarInset>
            <header className="flex h-12 items-center gap-2 border-b border-border bg-card px-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="h-4 w-px bg-border" />
              <span className="text-sm text-muted-foreground font-medium">CER 2 — Centro Especializado em Reabilitação</span>
            </header>
            <main className="flex-1 min-w-0 bg-background overflow-y-auto pb-10">
              {children}
            </main>
          </SidebarInset>
          <CommandMenu />
        </SidebarProvider>
      </body>
    </html>
  );
}
