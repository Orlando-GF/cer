import { EmBreve } from "@/components/ui/em-breve"
import { validarAcessoRota } from "@/lib/access-control"

export default async function GradesPage() {
  await validarAcessoRota("/grades")
  
  return (
    <EmBreve 
      titulo="Grades Horárias" 
      descricao="Definição de turnos, salas e carga horária semanal por profissional."
      iconName="Clock"
    />
  )
}
