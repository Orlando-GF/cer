import { buscarFilaEspera } from "@/actions/fila-actions"
import { buscarEspecialidades } from "@/actions/index"
// ❌ APAGAR ESTE IMPORT (Risco de Serialização)
// import { columns } from "@/components/fila/columns"
import { NovoProntuarioSheet } from "@/components/fila/novo-prontuario-sheet"
import { validarAcessoRota } from "@/lib/access-control"
// IMPORTAÇÃO NOVA: Trocamos a DataTable crua pelo Wrapper Inteligente
import { FilaClientWrapper } from "@/components/fila/fila-client-wrapper"

export default async function FilaPage({
  searchParams,
}: {
  searchParams: Promise<{ pageFila?: string; qFila?: string }>
}) {
  await validarAcessoRota("/fila")
  
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams?.pageFila) || 1
  const query = resolvedParams?.qFila || ""

  const response = await buscarFilaEspera({ page, pageSize: 20, busca: query })
  
  // Busca Especialidades Ativas para o formulário (Necessário para o NovoProntuarioSheet)
  const espResponse = await buscarEspecialidades();
  const especialidades = espResponse.success ? espResponse.data || [] : [];

  // 🚨 CORREÇÃO TS: Blindagem contra undefined
  const pacientes = (response.success && response.data) ? response.data.data : []
  const total = (response.success && response.data) ? response.data.total : 0

  return (
    <div className="p-6 space-y-8">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Fila de Acolhimento
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Pacientes aguardando triagem, avaliação inicial ou reclassificação de cuidado.
          </p>
        </div>
        <div className="shrink-0 flex gap-2">
          <NovoProntuarioSheet especialidades={especialidades.map((e: { id: string; nome_especialidade: string }) => ({ id: e.id, nome_especialidade: e.nome_especialidade }))} />
        </div>
      </div>

      {/* ERROR HANDLER */}
      {!response.success && (
        <div className="p-4 bg-alert-danger-bg border border-alert-danger-text text-alert-danger-text text-sm">
          <strong>Houve um problema ao carregar os dados:</strong> {response.error}
        </div>
      )}

      {/* DATA TABLE WRAPPER - Agora os cliques abrem o Prontuário com segurança */}
      {response.success && (
        // ✅ CORREÇÃO: Não passamos 'columns' via props
        <FilaClientWrapper data={pacientes} total={total} />
      )}
    </div>
  )
}
