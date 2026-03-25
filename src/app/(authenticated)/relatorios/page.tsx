import { validarAcessoRota } from '@/lib/access-control'
import { buscarIndicadoresGerais } from '@/actions/relatorios-actions'
import { PainelRelatorios } from '@/components/relatorios/painel-relatorios'
import { BarChart3, TrendingUp, Info } from 'lucide-react'
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
    <div className="flex flex-col min-h-screen bg-background">
      {/* CABEÇALHO DA PÁGINA */}
      <header className="border-b border-border bg-card px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center border border-border bg-muted">
              <BarChart3 className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">
                Painel de Indicadores & BI
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                <p className="text-xs font-bold tracking-widest uppercase">
                  Regulação e Produtividade em Tempo Real
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-none border-primary/20 bg-primary/5 text-primary text-[10px] font-bold tracking-widest px-3 py-1.5 uppercase"
            >
              Mês de Referência: {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
            </Badge>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="flex-1">
        <PainelRelatorios data={response.data} />
      </main>

      {/* NOTA DE RODAPÉ/LEGENDA */}
      <footer className="border-t border-border bg-muted/30 px-6 py-4">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground tracking-wide uppercase font-bold">
          <Info className="h-3.5 w-3.5" />
          <span>Dados atualizados conforme materialização do histórico e fluxo da fila de espera.</span>
        </div>
      </footer>
    </div>
  )
}
