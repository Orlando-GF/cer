import { EmBreve } from "@/components/ui/em-breve"
import { validarAcessoRota } from "@/lib/access-control"

export default async function LogisticaPage() {
  await validarAcessoRota("/logistica")
  
  return (
    <EmBreve 
      titulo="Rotas de Transporte" 
      descricao="Gestão de itinerários, controle de quilometragem e agendamento de transporte para pacientes com dificuldades de locomoção."
      iconName="Truck"
    />
  )
}
