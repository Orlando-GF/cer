import { buscarPacientes } from "@/actions"
import { DataTable } from "@/components/pacientes/data-table"
import { columns } from "@/components/pacientes/columns"
import { NovoPacienteSheet } from "@/components/pacientes/novo-paciente-sheet"
import { validarAcessoRota } from "@/lib/access-control"

export default async function PacientesPage({
  searchParams,
}: {
  // CORREÇÃO CRÍTICA NEXT.JS 15: searchParams agora é uma Promise
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  await validarAcessoRota("/pacientes")
  
  // Resolução da Promise obrigatória no Next 15
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams?.page) || 1
  const query = resolvedParams?.q || ""

  // SSoT: Uma única chamada limpa, unificando paginação e busca no backend
  const response = await buscarPacientes({ page, pageSize: 20, busca: query })

  // Fim da aberração do "as any". Tipagem garantida pela ActionResponse
  const pacientes = (response.success && response.data) ? response.data.data : []
  const total = (response.success && response.data) ? response.data.total : 0

  return (
    // Removido o min-h-screen (Regra 4.4)
    <div className="p-6 space-y-8">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Base de Pacientes
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Cadastro mestre e informações demográficas de todos os pacientes atendidos pela instituição.
          </p>
        </div>
        <div className="shrink-0 flex gap-2">
          <NovoPacienteSheet />
        </div>
      </div>

      {/* ERROR HANDLER - Usando tokens semânticos corretos (Regra 4.2) */}
      {!response.success && (
        <div className="p-4 bg-alert-danger-bg border border-alert-danger-text text-alert-danger-text text-sm">
          <strong>Houve um problema ao carregar os dados:</strong> {response.error}
        </div>
      )}

      {/* DATA TABLE */}
      {response.success && (
        <DataTable columns={columns} data={pacientes} rowCount={total} />
      )}
    </div>
  )
}
