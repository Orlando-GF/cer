import { buscarPacientes } from "@/actions"
import { NovoPacienteSheet } from "@/components/pacientes/novo-paciente-sheet"
import { validarAcessoRota } from "@/lib/access-control"
// IMPORTAÇÃO NOVA: Trocamos a DataTable crua pelo nosso Wrapper inteligente
import { PacienteClientWrapper } from "@/components/pacientes/paciente-client-wrapper"

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  await validarAcessoRota("/pacientes")
  
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams?.page) || 1
  const query = resolvedParams?.q || ""

  const response = await buscarPacientes({ page, pageSize: 20, busca: query })

  const pacientes = response.success ? response.data.data : []
  const total = response.success ? response.data.total : 0

  return (
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

      {/* ERROR HANDLER */}
      {!response.success && (
        <div className="p-4 bg-alert-danger-bg border border-alert-danger-text text-alert-danger-text text-sm">
          <strong>Houve um problema ao carregar os dados:</strong> {response.error}
        </div>
      )}

      {/* DATA TABLE WRAPPER - Interface agora é ultra-limpa e SSR-friendly */}
      {response.success && (
        <PacienteClientWrapper data={pacientes} total={total} />
      )}
    </div>
  )
}
