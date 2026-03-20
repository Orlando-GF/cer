import { buscarEspecialidades } from "@/actions"
import { NovaEspecialidadeSheet } from "@/components/especialidades/nova-especialidade-sheet"
import { ToggleEspecialidadeButton } from "@/components/especialidades/toggle-especialidade-button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { validarAcessoRota } from "@/lib/access-control"

export default async function EspecialidadesPage() {
  await validarAcessoRota("/especialidades")
  const { data: especialidades = [] } = await buscarEspecialidades()

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Especialidades</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie as linhas de cuidado e especialidades disponíveis para agendamento.</p>
        </div>
        <NovaEspecialidadeSheet />
      </div>

      <Card className="rounded-none border-border shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="w-[300px] font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Especialidade</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Linha / Equipe</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
              <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {especialidades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                  Nenhuma especialidade cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              especialidades.map((esp) => (
                <TableRow key={esp.id} className="hover:bg-muted/50 transition-colors border-border">
                  <TableCell className="font-bold text-sm py-4">
                    {esp.nome_especialidade}
                  </TableCell>
                  <TableCell className="py-4 font-medium text-xs text-muted-foreground uppercase">
                    {esp.linha_reabilitacao || "-"} / {esp.equipe_responsavel || "-"}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      className={`rounded-none font-bold text-[9px] uppercase tracking-widest border-none ${
                        esp.ativo
                          ? "bg-alert-success-bg text-alert-success-text"
                          : "bg-alert-danger-bg/20 text-muted-foreground"
                      }`}
                    >
                      {esp.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-4 space-x-1">
                    <NovaEspecialidadeSheet especialidade={esp} />
                    <ToggleEspecialidadeButton id={esp.id} nome={esp.nome_especialidade} ativo={!!esp.ativo} />
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
