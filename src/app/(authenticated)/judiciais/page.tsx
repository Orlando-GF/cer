import { buscarFilaEspera } from '@/actions'
import { FilaClientWrapper } from '@/components/fila/fila-client-wrapper'
import { judicialColumns } from '@/components/fila/judicial-columns'
import { validarAcessoRota } from '@/lib/access-control'
import { AlertTriangle } from 'lucide-react'

export default async function JudiciaisPage({
  searchParams,
}: {
  // Obrigatório no Next.js 15
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  // Apenas perfis com permissão podem ver mandados
  await validarAcessoRota('/judiciais')

  const resolvedParams = await searchParams
  const page = Number(resolvedParams?.page) || 1
  const query = resolvedParams?.q || ''

  // SSoT: Reutilizamos a MESMA função da Fila, mas ativamos a flag `judicial: true`
  const response = await buscarFilaEspera({
    page,
    pageSize: 20,
    judicial: true,
    busca: query,
  })

  const mandados = response.data?.data ?? []
  const total = response.data?.total ?? 0

  return (
    <div className="space-y-8 p-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight">
            <AlertTriangle className="text-alert-danger-text h-6 w-6" />
            Mandados Judiciais
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Gestão prioritária de pacientes com determinação legal (Nível de
            Prioridade Máxima).
          </p>
        </div>
      </div>

      {/* ERROR HANDLER */}
      {!response.success && (
        <div className="bg-alert-danger-bg border-alert-danger-text text-alert-danger-text border p-4 text-sm">
          <strong>Erro de comunicação:</strong> {response.error}
        </div>
      )}

      {/* DATA TABLE COM WRAPPER */}
      {response.success && (
        <FilaClientWrapper columns={judicialColumns} data={mandados} total={total} />
      )}
    </div>
  )
}
