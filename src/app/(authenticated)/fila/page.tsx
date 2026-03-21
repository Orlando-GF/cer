import { FilaClientWrapper } from "@/components/fila/fila-client-wrapper";
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
  // CORREÇÃO CRÍTICA NEXT.JS 15: searchParams agora é uma Promise
  searchParams: Promise<{ 
    page?: string; 
    status?: string; 
    esp?: string; 
    judicial?: string; 
    q?: string 
  }>
}) {
  await validarAcessoRota("/fila");
  
  // Resolução da Promise obrigatória no Next 15
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams?.page) || 1
  const status = resolvedParams?.status || "ativos"
  const especialidade = resolvedParams?.esp || "todas"
  const judicial = resolvedParams?.judicial === "true"
  const busca = resolvedParams?.q || ""

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

  const filaReal: PacienteFila[] = (response.success && response.data) ? response.data.data : [];
  const totalFilaReal = (response.success && response.data) ? response.data.total : 0;

  // KPIs baseados nos dados filtrados do servidor
  const totalAguardando = totalFilaReal; 
  const judiciaisCount = filaReal.filter(f => f.prioridade === 'Mandado Judicial').length; 
  const emAtendimentoCount = filaReal.filter(f => f.status === 'Em Atendimento').length;

  return (
    // Removido min-h-screen (Regra 4.4)
    <div className="p-6 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de filas - CER 2</h1>
          <p className="text-muted-foreground mt-1 text-sm">Visão consolidada de pacientes aguardando vagas e mandados judiciais.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <NovoProntuarioSheet especialidades={especialidades.map(e => ({ id: e.id, nome_especialidade: e.nome_especialidade }))} />
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-none border border-border rounded-none bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Aguardando vaga</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAguardando}</div>
            <p className="text-[10px] text-muted-foreground uppercase font-medium mt-1">Registros filtrados</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border rounded-none bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Mandados judiciais</CardTitle>
            <Scale className="h-4 w-4 text-alert-danger-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-alert-danger-text">{judiciaisCount}</div>
            <p className="text-[10px] text-muted-foreground uppercase font-medium mt-1">Na página atual</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border rounded-none bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Badge variant="outline" className="bg-alert-success-bg text-alert-success-text border-none font-bold text-[9px] uppercase tracking-widest rounded-none">
              Em atendimento
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emAtendimentoCount}</div>
            <p className="text-[10px] text-muted-foreground uppercase font-medium mt-1">Na página atual</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border rounded-none bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Total Geral</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{totalFilaReal}</div>
            <p className="text-[10px] text-muted-foreground uppercase font-medium mt-1">Total com filtros</p>
          </CardContent>
        </Card>
      </div>

      {/* ERROR HANDLER */}
      {!response.success && (
        <div className="p-4 bg-alert-danger-bg border border-alert-danger-text text-alert-danger-text text-sm rounded-none">
          <strong>Houve um problema ao carregar os dados:</strong> {response.error}
        </div>
      )}

      {/* Fila Real-time DataTable com Wrapper para Sheet */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Prontuários da fila</h3>
        <FilaClientWrapper columns={columns} data={filaReal} total={totalFilaReal} />
      </div>
    </div>
  );
}
