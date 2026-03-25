import { buscarMeusPacientesVagaFixa } from "@/actions/agendamentos-actions"
import { MeusPacientesList } from "@/components/profissional/meus-pacientes-list"
import { validarAcessoRota } from "@/lib/access-control"

export default async function MeusPacientesPage() {
  await validarAcessoRota("/meus-pacientes")
  const res = await buscarMeusPacientesVagaFixa()
  const pacientes = res.success ? (res.data ?? []) : []

  return (
    <div className="p-6 space-y-8">
      <MeusPacientesList pacientesIniciais={pacientes} />
    </div>
  )
}
