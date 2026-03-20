import { buscarProfissionais, buscarEspecialidades, toggleAtivoProfissional } from "@/actions"
import { NovoProfissionalSheet } from "@/components/especialidades/novo-profissional-sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Power, PowerOff } from "lucide-react"
import { validarAcessoRota } from "@/lib/access-control"

export default async function ProfissionaisPage() {
  await validarAcessoRota("/profissionais")
  const [profissionaisRes, especialidadesRes] = await Promise.all([
    buscarProfissionais(),
    buscarEspecialidades()
  ])

  const profissionais = profissionaisRes.data || []
  const especialidades = especialidadesRes.data || []

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profissionais & Acessos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie o corpo clínico e seus respectivos níveis de permissão.</p>
        </div>
        <NovoProfissionalSheet especialidades={especialidades} />
      </div>

      <Card className="rounded-none border-border shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="w-[300px] font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Nome</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Perfil de Acesso</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
              <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profissionais.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                  Nenhum profissional cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              profissionais.map((prof) => (
                <TableRow key={prof.id} className="hover:bg-muted/50 transition-colors border-border">
                  <TableCell className="font-bold text-sm py-4">
                    {prof.nome_completo}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className="rounded-none font-bold text-[9px] uppercase tracking-widest bg-muted/50 border-border">
                      {prof.perfil_acesso}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      className={`rounded-none font-bold text-[9px] uppercase tracking-widest border-none ${
                        prof.ativo
                          ? "bg-alert-success-bg text-alert-success-text"
                          : "bg-alert-danger-bg/20 text-muted-foreground"
                      }`}
                    >
                      {prof.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-4 space-x-1">
                  <NovoProfissionalSheet 
                    especialidades={especialidades} 
                    profissional={prof}
                  />

                    <AlertDialog>
                      <AlertDialogTrigger render={
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-8 w-8 p-0 rounded-none ${
                            prof.ativo 
                              ? "text-muted-foreground hover:text-alert-danger-text hover:bg-alert-danger-bg/10" 
                              : "text-muted-foreground hover:text-alert-success-text hover:bg-alert-success-bg/20"
                          }`}
                        >
                          {prof.ativo ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                        </Button>
                      } />
                      <AlertDialogContent className="rounded-none border-border shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {prof.ativo ? "Desativar Profissional?" : "Ativar Profissional?"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {prof.ativo 
                              ? "Isso impedirá novos agendamentos para este profissional. Agendamentos existentes não serão afetados." 
                              : "Isso permitirá que o profissional volte a receber novos agendamentos na agenda."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-none border-border font-bold uppercase tracking-widest text-[10px]">CANCELAR</AlertDialogCancel>
                          <form action={async () => {
                            "use server"
                            await toggleAtivoProfissional(prof.id, !prof.ativo)
                          }}>
                            <AlertDialogAction 
                              type="submit"
                              className={`rounded-none font-bold uppercase tracking-widest text-[10px] ${
                                prof.ativo ? "bg-alert-danger-text text-white hover:bg-alert-danger-text/90" : "bg-primary text-white hover:bg-primary/90"
                              }`}
                            >
                              {prof.ativo ? "DESATIVAR" : "ATIVAR"}
                            </AlertDialogAction>
                          </form>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
