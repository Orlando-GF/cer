import { buscarFilaJudicial } from "@/actions"
import { JudiciaisList } from "@/components/judiciais/judiciais-list"
import { validarAcessoRota } from "@/lib/access-control"

export default async function JudiciaisPage() {
  await validarAcessoRota("/judiciais")
  const res = await buscarFilaJudicial()
  const data = res.success ? (res.data ?? []) : []

  return (
    <main className="p-6 space-y-8">
      <JudiciaisList initialData={data} />
    </main>
  )
}
