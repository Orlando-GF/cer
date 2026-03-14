import { DataTable } from "@/components/fila/data-table";
import { columns } from "@/components/fila/columns";
import { PacienteFila } from "@/components/fila/paciente-sheet";
import { NovoProntuarioSheet } from "@/components/fila/novo-prontuario-sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/server";
import { Clock, Scale, AlertCircle } from "lucide-react";

import { validarAcessoRota } from "@/lib/access-control";

export default async function Dashboard() {
  await validarAcessoRota("/fila");
  const supabase = await createClient();

  // 1. Busca os dados reais do Supabase com prioridade inteligente
  const { data: dbData, error } = await supabase
    .from('fila_espera')
    .select(`
      id,
      data_entrada_fila,
      nivel_prioridade,
      status_fila,
      faltas_consecutivas,
      pacientes ( nome_completo, cns ),
      linhas_cuidado_especialidades ( nome_especialidade )
    `)
    // Ordenação garantida no banco: Mandado Judicial -> Urgência -> Rotina
    .order('nivel_prioridade', { ascending: true }) // Aproveita a ordem alfabética: Mandado (M) -> Rotina (R) -> Urgencia (U), ops... vamos corrigir isso depois via JS ou case no BD.
    // Como os enums em texto não têm ordem semântica natural no banco, a ordenação fina é feita via JS abaixo.
    .order('data_entrada_fila', { ascending: true });
    
  // 2. Busca Especialidades Ativas para o formulário
  const { data: especialidades } = await supabase
    .from('linhas_cuidado_especialidades')
    .select('id, nome_especialidade')
    .eq('ativa', true)
    .order('nome_especialidade', { ascending: true });

  let filaReal: PacienteFila[] = [];

  if (!error && dbData) {
    // 3. Mapeamento
    filaReal = dbData.map((row: any) => ({
      id: row.id,
      nome: row.pacientes?.nome_completo || "Desconhecido",
      cns: row.pacientes?.cns || "S/N",
      prioridade: row.nivel_prioridade,
      status: row.status_fila,
      especialidade: row.linhas_cuidado_especialidades?.nome_especialidade || "Sem Especialidade",
      dataEntrada: row.data_entrada_fila,
      faltas: row.faltas_consecutivas || 0
    }));

    // 4. Ordenação Semântica Forte (Server-side antes de renderizar)
    // 1º = Mandado Judicial | 2º = Urgência Clínica | 3º = Rotina
    const prioridadePeso: Record<string, number> = {
      "Mandado Judicial": 1,
      "Urgencia Clinica": 2,
      "Rotina": 3
    };

    filaReal.sort((a, b) => {
      // Ordena primeiro pelo peso da prioridade
      const pesoA = prioridadePeso[a.prioridade] || 99;
      const pesoB = prioridadePeso[b.prioridade] || 99;
      if (pesoA !== pesoB) return pesoA - pesoB;
      
      // Se tiverem a mesma prioridade, ordena quem chegou primeiro (FIFO)
      return new Date(a.dataEntrada).getTime() - new Date(b.dataEntrada).getTime();
    });
  }

  // Agregações atualizadas para os novos Enums
  const totalFila = filaReal.filter(f => f.status === 'Aguardando').length;
  const judiciais = filaReal.filter(f => f.prioridade === 'Mandado Judicial').length;
  const emAtendimento = filaReal.filter(f => f.status === 'Em Atendimento').length;
  const desitencias = filaReal.filter(f => f.status === 'Desistencia').length; // Novo KPI para o Contexto V2

  return (
    <main className="min-h-screen bg-background p-6 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de filas - CER 2</h1>
          <p className="text-muted-foreground mt-1">Visão consolidada de pacientes aguardando vagas e mandados judiciais.</p>
        </div>
        <div className="flex gap-3">
          <NovoProntuarioSheet especialidades={especialidades?.map(e => ({ id: e.id, nome_especialidade: e.nome_especialidade })) ?? []} />
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando vaga</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFila}</div>
            <p className="text-xs text-muted-foreground">Pacientes ativos na fila</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mandados judiciais</CardTitle>
            <Scale className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{judiciais}</div>
            <p className="text-xs text-muted-foreground">Prioridade Máxima Cumprimento</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-none font-normal">
              Em atendimento
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emAtendimento}</div>
            <p className="text-xs text-muted-foreground">Reabilitações em curso</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desistências e altas</CardTitle>
            <AlertCircle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-500">{desitencias}</div>
            <p className="text-xs text-muted-foreground">Histórico de saídas da fila</p>
          </CardContent>
        </Card>
      </div>

      {/* Fila Real-time DataTable */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Prontuários da fila</h2>
        <DataTable columns={columns} data={filaReal} />
      </div>
    </main>
  );
}
// Trigger HMR para registrar rota
