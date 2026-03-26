import { buscarProfissionais, buscarEspecialidades } from "@/actions/index"
import { NovoProfissionalSheet } from "@/components/especialidades/novo-profissional-sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ToggleProfissionalButton } from "@/components/profissionais/toggle-profissional-button"
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
          <h1 className="text-2xl font-black tracking-widest uppercase">Profissionais & Acessos</h1>
          <p className="uppercase tracking-wider font-bold text-[10px] text-muted-foreground mt-1">Gerencie o corpo clínico e seus respectivos níveis de permissão.</p>
        </div>
        <NovoProfissionalSheet especialidades={especialidades} />
      </div>

      <Card className="rounded-none border-2 border-border shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-2 border-border bg-muted/30">
              <TableHead className="w-[300px] font-black text-[10px] uppercase tracking-widest text-foreground px-4 h-12">Nome</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-foreground px-4 h-12">Perfil de Acesso</TableHead>
              <TableHead className="font-black text-[10px] uppercase tracking-widest text-foreground px-4 h-12">Status</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-foreground px-4 h-12">Ações</TableHead>
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
                  <TableCell className="py-4 px-4 font-bold text-xs uppercase text-foreground">
                    {prof.nome_completo}
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <Badge variant="outline" className="rounded-none font-bold text-[9px] uppercase tracking-widest bg-muted/50 border-2 border-border px-2">
                      {prof.perfil_acesso}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 px-4">
                    <Badge
                      className={`rounded-none font-bold text-[9px] uppercase tracking-widest border-2 px-2 py-0.5 ${
                        prof.ativo
                          ? "border-alert-success-text text-alert-success-text bg-alert-success-bg/20"
                          : "border-alert-danger-text text-alert-danger-text bg-alert-danger-bg/20"
                      }`}
                    >
                      {prof.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right py-4 px-4 space-x-1">
                  <NovoProfissionalSheet 
                    especialidades={especialidades} 
                    profissional={prof}
                  />

                    <ToggleProfissionalButton 
                      id={prof.id} 
                      nome={prof.nome_completo} 
                      ativo={!!prof.ativo} 
                    />
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
