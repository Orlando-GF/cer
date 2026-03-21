import { getMeuPerfil } from "@/actions"
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
  "/configuracoes": ["Administracao"],
  "/prontuarios": ["Administracao", "Recepcao", "Enfermagem", "Medico_Terapeuta"],
}

/**
 * Valida se o usuário logado tem permissão para acessar uma rota.
 * Se não tiver, redireciona para a home ou página de erro.
 */
export async function validarAcessoRota(
  pathname: string,
  perfilJaCarregado?: string | null
) {
  const perfil = (perfilJaCarregado ?? (await getMeuPerfil())?.perfil_acesso) as PerfilSessao | null

  if (!perfil) {
     redirect("/login")
  }

  // Dashboard é acessível por todos os perfis autenticados
  if (pathname === "/" || pathname === "/dashboard") {
    return perfil
  }

  // Verifica se a rota atual tem restrições definidas
  const rotaDefinida = Object.keys(PERMISSOES_ROTAS).find(rota => pathname.startsWith(rota))

  if (!rotaDefinida) {
    // DEFAULT DENY: Se a rota não existe no mapeamento, ninguém acessa (exceto Admin se quiser flexibilizar)
    console.warn(`[Acesso Negado] Rota ${pathname} não mapeada no RBAC.`);
    redirect("/") 
  }

  const permitidos = PERMISSOES_ROTAS[rotaDefinida]
  if (!permitidos.includes(perfil)) {
    redirect("/") // Sem permissão para esta rota específica
  }

  return perfil
}
