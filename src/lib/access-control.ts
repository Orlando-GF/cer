import { getMeusDados } from "@/actions"
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
  const dados = await getMeusDados()
  const perfil = dados?.perfil_acesso as PerfilSessao | null

  if (!perfil) {
     redirect("/login")
  }

  // Dashboard é acessível por todos os perfis autenticados
  if (pathname === "/" || pathname === "/dashboard") {
    return perfil
  }

  // Verifica se a rota atual tem restrições definidas
  const rotaDefinida = Object.keys(PERMISSOES_ROTAS).find(rota => pathname.startsWith(rota))

  if (rotaDefinida) {
    const permitidos = PERMISSOES_ROTAS[rotaDefinida]
    if (!permitidos.includes(perfil)) {
      redirect("/") // Sem permissão para esta rota específica
    }
  } else {
    // Se a rota está no grupo (authenticated) mas não está no mapa e não é a home, 
    // por segurança tratamos como restrita.
    console.warn(`[Acesso] Rota não mapeada: ${pathname}. Bloqueando por segurança.`)
    redirect("/")
  }

  return perfil
}
