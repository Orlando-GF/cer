import { buscarPacientes, buscarPacientesPorBusca } from "@/actions"
import { DataTable } from "@/components/pacientes/data-table"
import { columns } from "@/components/pacientes/columns"
import { NovoPacienteSheet } from "@/components/pacientes/novo-paciente-sheet"
import { validarAcessoRota } from "@/lib/access-control"
import { Paciente } from "@/types"

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string }
}) {
  await validarAcessoRota("/pacientes")
  
  const page = Number(searchParams?.page) || 1
  const query = searchParams?.q || ""

  // Busca os dados (paginados ou por busca)
  let response;
  if (query.trim().length >= 3) {
    response = await buscarPacientesPorBusca(query)
  } else {
    response = await buscarPacientes(page)
  }

  const data = response.success ? response.data : null
  
  // Normalização do retorno para o DataTable
  let pacientes: Paciente[] = []
  let total = 0

  if (data) {
    if ('data' in (data as any) && Array.isArray((data as any).data)) {
      pacientes = (data as any).data as Paciente[]
      total = (data as any).total
    } else if (Array.isArray(data)) {
      pacientes = data as Paciente[]
      total = pacientes.length
    }
  }

  return (
    <main className="min-h-screen bg-background p-6 space-y-8">
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
          {/* O Modal de Cadastro Independente importado e injetado */}
          <NovoPacienteSheet />
        </div>
      </div>

      {/* ERROR HANDLER */}
      {!response.success && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-none text-sm">
          <strong>Houve um problema ao carregar os dados:</strong> {response.error}
        </div>
      )}

      {/* DATA TABLE */}
      {response.success && (
        <DataTable columns={columns} data={pacientes} rowCount={total} />
      )}
    </main>
  )
}
