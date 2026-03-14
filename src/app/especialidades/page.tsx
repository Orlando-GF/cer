import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Stethoscope, Plus, ClipboardCheck } from "lucide-react"
import { buscarEspecialidades } from "@/actions"
import { NovaEspecialidadeSheet } from "@/components/especialidades/nova-especialidade-sheet"

export default async function EspecialidadesPage() {
  const res = await buscarEspecialidades()
  const especialidades = res.success ? res.data : []

  return (
    <main className="min-h-screen bg-background p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Linhas de Cuidado e Especialidades</h1>
          <p className="text-muted-foreground mt-1">Configuração das especialidades para faturamento e vinculação clínica.</p>
        </div>
        <NovaEspecialidadeSheet />
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Especialidades Configuradas</h2>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px]">Nome da Especialidade</TableHead>
              <TableHead>Equipe Responsável</TableHead>
              <TableHead>Linha de Reabilitação</TableHead>
              <TableHead>Tipo de Atendimento</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {especialidades && especialidades.length > 0 ? (
              especialidades.map((esp) => (
                <TableRow key={esp.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    {esp.nome_especialidade}
                  </TableCell>
                  <TableCell className="text-slate-600">{esp.equipe_responsavel || "-"}</TableCell>
                  <TableCell className="text-slate-600 font-medium">{esp.linha_reabilitacao || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal bg-slate-50">
                      {esp.tipo_atendimento}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                      Ativa
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  Nenhuma especialidade cadastrada no momento.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
