import { buscarPacientes } from '@/actions'
import { columns } from '@/components/pacientes/columns'
import { NovoPacienteSheet } from '@/components/pacientes/novo-paciente-sheet'
import { validarAcessoRota } from '@/lib/access-control'
// IMPORTAÇÃO NOVA: Trocamos a DataTable crua pelo nosso Wrapper inteligente
import { PacienteClientWrapper } from '@/components/pacientes/paciente-client-wrapper'

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  await validarAcessoRota('/pacientes')

  const resolvedParams = await searchParams
  const page = Number(resolvedParams?.page) || 1
  const query = resolvedParams?.q || ''

  const response = await buscarPacientes({ page, pageSize: 20, busca: query })

  const pacientes = response.success ? response.data.data : []
  const total = response.success ? response.data.total : 0

  return (
    <div className="space-y-8 p-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Base de Pacientes
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Cadastro mestre e informações demográficas de todos os pacientes
            atendidos pela instituição.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <NovoPacienteSheet />
        </div>
      </div>

      {/* ERROR HANDLER */}
      {!response.success && (
        <div className="bg-alert-danger-bg border-alert-danger-text text-alert-danger-text border p-4 text-sm">
          <strong>Houve um problema ao carregar os dados:</strong>{' '}
          {response.error}
        </div>
      )}

      {/* DATA TABLE WRAPPER - Agora os cliques voltam a abrir o Prontuário */}
      {response.success && (
        <PacienteClientWrapper
          columns={columns}
          data={pacientes}
          total={total}
        />
      )}
    </div>
  )
}
