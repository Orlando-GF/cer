import { buscarEspecialidades } from "@/actions/index"
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
          <h1 className="text-2xl font-black tracking-widest uppercase">Especialidades</h1>
          <p className="uppercase tracking-wider font-bold text-[10px] text-muted-foreground mt-1">Gerencie as linhas de cuidado e especialidades disponíveis para agendamento.</p>
        </div>
        <NovaEspecialidadeSheet />
      </div>

      <Card className="rounded-none border-border shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-2 border-border bg-muted/30">
              <TableHead className="w-[300px] font-black text-[10px] uppercase tracking-widest text-foreground px-4 h-12">Especialidade</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-foreground px-4 h-12">Linha / Equipe</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-foreground px-4 h-12">Status</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-foreground px-4 h-12">Ações</TableHead>
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
                <TableRow key={esp.id} className="hover:bg-muted/30 transition-colors border-b border-border">
                  <TableCell className="uppercase text-xs font-bold text-foreground py-4 px-4">
                    {esp.nome_especialidade}
                  </TableCell>
                  <TableCell className="py-4 px-4 uppercase text-[10px] font-bold text-muted-foreground tracking-wider">
                    {esp.linha_reabilitacao || "-"} / {esp.equipe_responsavel || "-"}
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <Badge
                      variant="outline"
                      className={`rounded-none border-2 uppercase font-black text-[10px] tracking-widest px-2 py-0.5 shadow-sm ${
                        esp.ativo
                          ? "border-alert-success-text text-alert-success-text bg-alert-success-bg/20"
                          : "border-alert-danger-text text-alert-danger-text bg-alert-danger-bg/20"
                      }`}
                    >
                      {esp.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-4 px-4 space-x-1">
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
