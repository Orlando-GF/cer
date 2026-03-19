import { EmBreve } from "@/components/ui/em-breve"
import { validarAcessoRota } from "@/lib/access-control"

export default async function ConfiguracoesPage() {
  await validarAcessoRota("/configuracoes")
  
  return (
    <EmBreve 
      titulo="Configurações" 
      descricao="Ajustes de sistema, logs de auditoria e parametrização global do CER 2."
      iconName="Settings"
    />
  )
}
