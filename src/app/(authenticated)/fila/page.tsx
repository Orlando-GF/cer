import { DataTable } from "@/components/fila/data-table";
import { columns } from "@/components/fila/columns";
import { PacienteFila } from "@/types";
import { NovoProntuarioSheet } from "@/components/fila/novo-prontuario-sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Scale, AlertCircle } from "lucide-react";
import { buscarFilaEspera, buscarEspecialidades } from "@/actions";
import { validarAcessoRota } from "@/lib/access-control";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { 
    page?: string; 
    status?: string; 
    esp?: string; 
    judicial?: string; 
    q?: string 
  }
}) {
  await validarAcessoRota("/fila");
  
  const page = Number(searchParams?.page) || 1
  const status = searchParams?.status || "ativos"
  const especialidade = searchParams?.esp || "todas"
  const judicial = searchParams?.judicial === "true"
  const busca = searchParams?.q || ""

  // 1. Busca os dados reais via Server Action com filtros server-side (v7.4)
  const response = await buscarFilaEspera({ 
    page, 
    pageSize: 20, 
    status, 
    especialidade, 
    judicial, 
    busca 
  });
  
  // 2. Busca Especialidades Ativas para o formulário
  const espResponse = await buscarEspecialidades();
  const especialidades = espResponse.success ? espResponse.data || [] : [];

  let filaReal: PacienteFila[] = [];
  let totalFilaReal = 0;

  if (response.success && response.data) {
    filaReal = response.data.data;
    totalFilaReal = response.data.total;
  }

  // KPIs
  const totalAguardando = totalFilaReal; 
  const judiciaisCount = filaReal.filter(f => f.prioridade === 'Mandado Judicial').length; // Local na página
  const emAtendimentoCount = filaReal.filter(f => f.status === 'Em Atendimento').length;

  return (
    <main className="min-h-screen bg-background p-6 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de filas - CER 2</h1>
          <p className="text-muted-foreground mt-1">Visão consolidada de pacientes aguardando vagas e mandados judiciais.</p>
        </div>
        <div className="flex gap-3">
          <NovoProntuarioSheet especialidades={especialidades.map(e => ({ id: e.id, nome_especialidade: e.nome_especialidade }))} />
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
            <div className="text-2xl font-bold">{totalAguardando}</div>
            <p className="text-xs text-muted-foreground">Registros filtrados</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mandados judiciais</CardTitle>
            <Scale className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{judiciaisCount}</div>
            <p className="text-xs text-muted-foreground">Na página atual</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Badge variant="outline" className="bg-alert-success-bg text-alert-success-text border-none font-normal">
              Em atendimento
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emAtendimentoCount}</div>
            <p className="text-xs text-muted-foreground">Na página atual</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{totalFilaReal}</div>
            <p className="text-xs text-muted-foreground">Total da base (com filtros)</p>
          </CardContent>
        </Card>
      </div>

      {/* Fila Real-time DataTable */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight text-foreground">Prontuários da fila</h3>
        <DataTable columns={columns} data={filaReal} rowCount={totalFilaReal} />
      </div>
    </main>
  );
}
