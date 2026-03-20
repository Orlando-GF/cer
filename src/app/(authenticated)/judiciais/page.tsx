import { buscarFilaEspera } from "@/actions"
import { JudiciaisList } from "@/components/judiciais/judiciais-list"
import { validarAcessoRota } from "@/lib/access-control"

export default async function JudiciaisPage() {
  await validarAcessoRota("/judiciais")
  
  // SSoT: Usando a action unificada com o filtro judicial: true
  // Aumentamos o pageSize para garantir que a maioria dos mandados apareça (regra legada)
  const res = await buscarFilaEspera({ judicial: true, pageSize: 100 })
  const data = res.success ? (res.data?.data ?? []) : []

  return (
    <div className="p-6 space-y-8">
      <JudiciaisList initialData={data} />
    </div>
  )
}
