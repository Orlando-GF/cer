import { buscarProfissionais, buscarGradesHorarias } from "@/actions"
import { GradeHorariaSheet } from "@/components/grades/grade-horaria-sheet"
import { ProfissionalSelectFilter } from "@/components/grades/profissional-select-filter"
import { DeleteGradeButton } from "@/components/grades/delete-grade-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Clock, User } from "lucide-react"
import { validarAcessoRota } from "@/lib/access-control"

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default async function GradesPage({
  searchParams,
}: {
  searchParams: Promise<{ profId?: string }>
}) {
  const { profId } = await searchParams
  await validarAcessoRota("/grades")

  const [profissionaisRes, gradesRes] = await Promise.all([
    buscarProfissionais(),
    buscarGradesHorarias()
  ])

  const profissionais = profissionaisRes.data || []
  const todasGrades = gradesRes.data || []
  
  const profissionalSelecionado = profissionais.find(p => p.id === profId)
  const gradesDoProfissional = todasGrades.filter(g => g.profissional_id === profId && g.ativo !== false)

  // Agrupar por dia da semana para facilitar a visualização
  const gradesAgrupadas = gradesDoProfissional.reduce((acc, curr) => {
    const dia = curr.dia_semana
    if (!acc[dia]) acc[dia] = []
    acc[dia].push(curr)
    return acc
  }, {} as Record<number, typeof todasGrades>)

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Grades Horárias</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gerencie os turnos e capacidades de atendimento de cada profissional.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border px-3 h-10">
            <User className="h-4 w-4 text-muted-foreground" />
            <ProfissionalSelectFilter profissionais={profissionais} defaultValue={profId} />
          </div>
          {profId && <GradeHorariaSheet profissionalId={profId} />}
        </div>
      </div>

      {!profId ? (
        <Card className="rounded-none border-border shadow-none p-12 flex flex-col items-center justify-center text-center bg-muted/20 border-dashed">
          <div className="h-12 w-12 rounded-none bg-muted flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold uppercase tracking-widest text-foreground">Aguardando Seleção</h3>
          <p className="text-muted-foreground text-sm max-w-xs mt-2">
            Selecione um profissional acima para visualizar e editar sua grade de horários semanais.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="font-bold uppercase tracking-widest text-[11px] text-muted-foreground">
              Grade Semanal: <span className="text-foreground">{profissionalSelecionado?.nome_completo}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {DIAS.map((diaNome, diaIdx) => {
              const horarios = gradesAgrupadas[diaIdx] || []
              if (diaIdx === 0 && horarios.length === 0) return null // Pular domingo se vazio

              return (
                <Card key={diaIdx} className="rounded-none border-border shadow-none overflow-hidden">
                  <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center justify-between">
                    <span className="font-black uppercase tracking-widest text-[11px] text-foreground">
                      {diaNome}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      {horarios.length} TURNO(S)
                    </span>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="h-10 font-bold text-[9px] uppercase tracking-widest text-muted-foreground">Início</TableHead>
                        <TableHead className="h-10 font-bold text-[9px] uppercase tracking-widest text-muted-foreground">Fim</TableHead>
                        <TableHead className="h-10 font-bold text-[9px] uppercase tracking-widest text-muted-foreground">Capacidade</TableHead>
                        <TableHead className="h-10 font-bold text-[9px] uppercase tracking-widest text-muted-foreground">Vigência</TableHead>
                        <TableHead className="h-10 text-right font-bold text-[9px] uppercase tracking-widest text-muted-foreground">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {horarios.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-16 text-center text-muted-foreground text-xs italic">
                            Nenhum horário cadastrado para este dia.
                          </TableCell>
                        </TableRow>
                      ) : (
                        horarios.map((g) => (
                          <TableRow key={g.id} className="hover:bg-muted transition-colors border-border">
                            <TableCell className="font-bold text-sm py-3 text-foreground">{g.horario_inicio.substring(0, 5)}</TableCell>
                            <TableCell className="font-bold text-sm py-3 text-foreground">{g.horario_fim.substring(0, 5)}</TableCell>
                            <TableCell className="py-3">
                              <span className="bg-primary/10 text-primary px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider">
                                {g.capacidade_atendimentos} Pacientes
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs py-3 font-medium">
                              {g.data_inicio_vigencia ? new Date(g.data_inicio_vigencia).toLocaleDateString('pt-BR') : '-'}
                            </TableCell>
                            <TableCell className="text-right py-3">
                              <DeleteGradeButton id={g.id} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
