import { buscarMeusAtendimentos } from "@/actions/agendamentos-actions"
import { AtendimentosDia } from "@/components/profissional/atendimentos-dia"
import { validarAcessoRota } from "@/lib/access-control"

export default async function MeusAtendimentosPage() {
  await validarAcessoRota("/meus-atendimentos")
  // Força o fuso horário de Brasília/Bahia e formata como YYYY-MM-DD (padrão en-CA)
  const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  const res = await buscarMeusAtendimentos(hoje)
  const data = res.success ? (res.data ?? { vagas: [], hist: [] }) : { vagas: [], hist: [] }

  return (
    <div className="p-6 space-y-8">
      <AtendimentosDia initialData={data} />
    </div>
  )
}
