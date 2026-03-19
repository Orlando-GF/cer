import { buscarMeusAtendimentos } from "@/actions"
import { AtendimentosDia } from "@/components/profissional/atendimentos-dia"
import { validarAcessoRota } from "@/lib/access-control"

export default async function MeusAtendimentosPage() {
  await validarAcessoRota("/meus-atendimentos")
  const hoje = new Date().toISOString().split("T")[0]
  const res = await buscarMeusAtendimentos(hoje)
  const data = res.success ? (res.data ?? { vagas: [], hist: [] }) : { vagas: [], hist: [] }

  return (
    <div className="p-6 space-y-8">
      <AtendimentosDia initialData={data} />
    </div>
  )
}
