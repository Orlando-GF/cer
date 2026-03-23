import { buscarProfissionais, buscarEspecialidades } from "@/actions"
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
