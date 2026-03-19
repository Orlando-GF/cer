import { buscarProfissionais, buscarEspecialidades } from "@/actions"
import { NovoProfissionalSheet } from "@/components/especialidades/novo-profissional-sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Profissionais & Acessos</h1>
        <NovoProfissionalSheet especialidades={especialidades} />
      </div>

      <Card className="rounded-none border-border shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px] font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Nome</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Perfil de Acesso</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profissionais.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10 text-muted-foreground text-sm">
                  Nenhum profissional cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              profissionais.map((prof) => (
                <TableRow key={prof.id} className="hover:bg-muted transition-colors">
                  <TableCell className="font-medium text-sm">
                    {prof.nome_completo}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-none font-bold text-[10px] uppercase tracking-widest bg-muted/50 border-border">
                      {prof.perfil_acesso}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`rounded-none font-bold text-[10px] uppercase tracking-widest border-none ${
                        prof.ativo
                          ? "bg-alert-success-bg text-alert-success-text"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {prof.ativo ? "Ativo" : "Inativo"}
                    </Badge>
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
