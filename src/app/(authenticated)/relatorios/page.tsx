import { validarAcessoRota } from '@/lib/access-control'
import { buscarIndicadoresGerais } from '@/actions/relatorios-actions'
import { PainelRelatorios } from '@/components/relatorios/painel-relatorios'
import { Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function RelatoriosPage() {
  await validarAcessoRota('/relatorios')

  const response = await buscarIndicadoresGerais()

  if (!response.success || !response.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4 p-6">
        <div className="flex items-center gap-2 text-alert-danger-text bg-alert-danger-bg px-4 py-3 border border-alert-danger-text/20">
          <Info className="h-4 w-4" />
          <p className="text-sm font-bold uppercase tracking-widest">
            Erro ao carregar indicadores: {response.error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">
            Painel de Indicadores & BI
          </h1>
          <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mt-1">
            Regulação e Produtividade em Tempo Real
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-none border-2 border-border bg-muted/10 text-foreground text-[10px] font-bold tracking-widest px-4 py-2 uppercase tabular-nums shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
          >
            Mês de Referência: {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </Badge>
        </div>
      </div>

      {/* CONTEÚDO */}
      <PainelRelatorios data={response.data} />

      {/* NOTA DE RODAPÉ/LEGENDA */}
      <div className="border-t border-border pt-4 text-[10px] text-muted-foreground tracking-wide uppercase font-bold">
        <span>Dados atualizados conforme materialização do histórico e fluxo da fila de espera.</span>
      </div>
    </div>
  )
}
