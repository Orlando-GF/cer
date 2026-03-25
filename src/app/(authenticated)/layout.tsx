import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandMenu } from "@/components/command-menu";
import { getMeuPerfil } from "@/actions/index";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dados = await getMeuPerfil();

  return (
    <SidebarProvider>
      <AppSidebar dados={dados} />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b border-border bg-card px-4 shrink-0">
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
  );
}
