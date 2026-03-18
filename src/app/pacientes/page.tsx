import { buscarPacientes } from "@/actions"
import { DataTable } from "@/components/pacientes/data-table"
import { columns } from "@/components/pacientes/columns"
import { NovoPacienteSheet } from "@/components/pacientes/novo-paciente-sheet"
import { validarAcessoRota } from "@/lib/access-control"

export default async function PacientesPage() {
  await validarAcessoRota("/pacientes")
  // Busca os dados mestre direto do banco de pacientes
  const response = await buscarPacientes()
  const pacientes = response.success ? response.data || [] : []

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
        <DataTable columns={columns} data={pacientes} />
      )}
    </main>
  )
}
