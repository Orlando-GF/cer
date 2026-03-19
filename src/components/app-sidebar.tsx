"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardList,
  BarChart3,
  Scale,
  Stethoscope,
  ShieldCheck,
  Truck,
  UserCheck,
  Clock,
  Briefcase,
  LogOut,
  Loader2,
} from "lucide-react"
import { signOut } from "@/actions/auth-actions"
import { useTransition } from "react"
import type { DadosUsuario } from "@/types"

const navItems = [
  {
    group: "ATENDIMENTO",
    roles: ["Administracao", "Recepcao", "Enfermagem"],
    items: [
      { label: "Painel Geral", href: "/", icon: LayoutDashboard },
      { label: "Pacientes", href: "/pacientes", icon: Users },
      { label: "Fila de Espera", href: "/fila", icon: ClipboardList },
      { label: "Agenda Geral", href: "/agendamentos", icon: CalendarDays },
    ],
  },
  {
    group: "CLÍNICO",
    roles: ["Administracao", "Enfermagem", "Medico_Terapeuta"],
    items: [
      { label: "Meus Atendimentos", href: "/meus-atendimentos", icon: UserCheck },
      { label: "Meus Pacientes", href: "/meus-pacientes", icon: Users },
    ],
  },
  {
    group: "LOGÍSTICA",
    roles: ["Administracao", "Motorista"],
    items: [
      { label: "Rotas de Transporte", href: "/logistica", icon: Truck },
    ],
  },
  {
    group: "GESTÃO E AUDITORIA",
    roles: ["Administracao", "Recepcao"],
    items: [
      { label: "Absenteísmo", href: "/absenteismo", icon: ShieldCheck },
      { label: "Mandados Judiciais", href: "/judiciais", icon: Scale },
      { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
    ],
  },
  {
    group: "CONFIGURAÇÕES",
    roles: ["Administracao"],
    items: [
      { label: "Profissionais & Acessos", href: "/profissionais", icon: Briefcase },
      { label: "Especialidades", href: "/especialidades", icon: Stethoscope },
      { label: "Grades Horárias", href: "/grades", icon: Clock },
    ],
  },
]

export function AppSidebar({ dados }: { dados: DadosUsuario | null }) {
  const pathname = usePathname()

  const filteredGroups = navItems.filter(group => {
    const perfil = dados?.perfil_acesso
    
    // Se o perfil for nulo (usuário logado sem registro em profissionais),
    // liberamos acesso básico para que ele possa se cadastrar.
    if (!perfil) return group.group === "ATENDIMENTO" || group.group === "CONFIGURAÇÕES"
    
    if (perfil === "Administracao") return true
    return group.roles.includes(perfil)
  })

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-black/20">
            <span className="text-white font-bold text-sm">CER</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight text-white">CER II TEAcolhe</p>
            <p className="text-[10px] text-sidebar-foreground/60 truncate uppercase tracking-wider font-medium">Sistema de Gestão SUS</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2 py-2">
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="text-[10px] tracking-[0.15em] uppercase text-sidebar-foreground/40 font-bold mb-1">
              {group.group}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4 pt-2">
        <SidebarSeparator className="mb-3" />
        {/* Card do usuário logado */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-none">
          {/* Avatar com iniciais */}
          <div className="w-8 h-8 rounded-none bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">
              {dados?.nome_completo
                ? dados.nome_completo
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                : '??'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate leading-tight">
              {dados?.nome_completo ?? 'Usuário'}
            </p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate uppercase tracking-wider font-medium">
              {dados?.perfil_acesso?.replace('_', ' ') ?? ''}
            </p>
          </div>
          {/* Botão logout */}
          <LogoutButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(async () => {
        await signOut()
      })}
      disabled={isPending}
      className="text-sidebar-foreground/50 hover:text-white hover:bg-white/10 rounded-none p-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      title="Sair do sistema"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
    </button>
  )
}
