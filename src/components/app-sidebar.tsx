"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getMeuPerfil } from "@/app/actions"
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
  Settings,
  Truck,
  UserCheck,
  Clock,
  Briefcase,
} from "lucide-react"

const navItems = [
  {
    group: "Atendimento",
    roles: ["Administracao", "Recepcao", "Enfermagem"],
    items: [
      { label: "Painel Geral", href: "/", icon: LayoutDashboard },
      { label: "Pacientes", href: "/pacientes", icon: Users },
      { label: "Fila de Espera", href: "/fila", icon: ClipboardList },
      { label: "Agenda Geral", href: "/agendamentos", icon: CalendarDays },
    ],
  },
  {
    group: "Clínico",
    roles: ["Administracao", "Enfermagem", "Medico_Terapeuta"],
    items: [
      { label: "Meus Atendimentos", href: "/meus-atendimentos", icon: UserCheck },
      { label: "Meus Pacientes", href: "/meus-pacientes", icon: Users },
    ],
  },
  {
    group: "Logística",
    roles: ["Administracao", "Motorista"],
    items: [
      { label: "Rotas de Transporte", href: "/logistica", icon: Truck },
    ],
  },
  {
    group: "Gestão e auditoria",
    roles: ["Administracao", "Recepcao"],
    items: [
      { label: "Absenteísmo", href: "/absenteismo", icon: ShieldCheck },
      { label: "Mandados Judiciais", href: "/judiciais", icon: Scale },
      { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
    ],
  },
  {
    group: "Configurações",
    roles: ["Administracao"],
    items: [
      { label: "Profissionais & Acessos", href: "/profissionais", icon: Briefcase },
      { label: "Especialidades", href: "/especialidades", icon: Stethoscope },
      { label: "Grades Horárias", href: "/grades", icon: Clock },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [perfil, setPerfil] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const p = await getMeuPerfil()
      setPerfil(p)
      setLoading(false)
    }
    load()
  }, [])

  const filteredGroups = navItems.filter(group => {
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
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">C2</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight">CER 2</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">Sistema de Gestão SUS</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2 py-2">
        {loading ? (
          <div className="p-4 space-y-4">
             <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
             <div className="h-8 w-full bg-slate-50 rounded animate-pulse" />
             <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
             <div className="h-8 w-full bg-slate-50 rounded animate-pulse" />
          </div>
        ) : filteredGroups.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="text-xs tracking-wider">
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

      <SidebarFooter className="px-2 pb-4">
        <SidebarSeparator className="mb-2" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Configurações"
              render={
                <Link href="/configuracoes">
                  <Settings />
                  <span>Configurações</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
