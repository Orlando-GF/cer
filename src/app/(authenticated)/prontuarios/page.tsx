import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList } from "lucide-react"
import { validarAcessoRota } from "@/lib/access-control"

export default async function ProntuariosPage() {
  await validarAcessoRota("/prontuarios")
  
  return (
    <main className="min-h-screen bg-background p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Prontuários</h1>
        <p className="text-muted-foreground mt-1">Acesso ao histórico clínico dos pacientes.</p>
      </div>

      <Card className="shadow-sm border-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Módulo em Desenvolvimento</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mt-4">
            Em breve o acesso digital a todas as evoluções, exames e dados do prontuário estarão disponíveis nesta sessão.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
