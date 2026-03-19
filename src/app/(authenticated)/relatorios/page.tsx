import { EmBreve } from "@/components/ui/em-breve"
import { validarAcessoRota } from "@/lib/access-control"

export default async function RelatoriosPage() {
  await validarAcessoRota("/relatorios")
  
  return (
    <EmBreve 
      titulo="Relatórios" 
      descricao="Painéis analíticos, exportação BPA SUS e métricas de produtividade clínica."
      iconName="BarChart3"
    />
  )
}
