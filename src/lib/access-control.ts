import { getMeuPerfil } from "@/app/actions"
import { redirect } from "next/navigation"

export type PerfilSessao = "Recepcao" | "Enfermagem" | "Medico_Terapeuta" | "Administracao" | "Motorista"

const PERMISSOES_ROTAS: Record<string, PerfilSessao[]> = {
  "/pacientes": ["Administracao", "Recepcao", "Enfermagem"],
  "/fila": ["Administracao", "Recepcao", "Enfermagem"],
  "/agendamentos": ["Administracao", "Recepcao", "Enfermagem"],
  "/meus-atendimentos": ["Administracao", "Medico_Terapeuta", "Enfermagem"],
  "/meus-pacientes": ["Administracao", "Medico_Terapeuta", "Enfermagem"],
  "/logistica": ["Administracao", "Motorista"],
  "/absenteismo": ["Administracao", "Recepcao"],
  "/judiciais": ["Administracao", "Recepcao"],
  "/relatorios": ["Administracao", "Recepcao"],
  "/profissionais": ["Administracao"],
  "/especialidades": ["Administracao"],
  "/grades": ["Administracao"],
}

/**
 * Valida se o usuário logado tem permissão para acessar uma rota.
 * Se não tiver, redireciona para a home ou página de erro.
 */
export async function validarAcessoRota(pathname: string) {
  const perfil = await getMeuPerfil() as PerfilSessao | null

  if (!perfil) {
     redirect("/login")
  }

  // Verifica se a rota atual tem restrições
  // Precisamos casar caminhos exatos ou prefixos
  const rotaRestrita = Object.keys(PERMISSOES_ROTAS).find(rota => pathname.startsWith(rota))

  if (rotaRestrita) {
    const permitidos = PERMISSOES_ROTAS[rotaRestrita]
    if (!permitidos.includes(perfil)) {
      redirect("/")
    }
  }

  return perfil
}
