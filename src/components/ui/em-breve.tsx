"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LucideIcon, Rocket, Timer, Construction, Scale, BarChart3, UserCheck, Users, Settings, Briefcase, Clock, Truck } from "lucide-react"

const iconsMap: Record<string, LucideIcon> = {
  Scale,
  BarChart3,
  UserCheck,
  Users,
  Settings,
  Briefcase,
  Clock,
  Truck,
  Rocket
}

interface EmBreveProps {
  titulo: string
  descricao: string
  iconName?: string
}

export function EmBreve({ titulo, descricao, iconName }: EmBreveProps) {
  const Icon = iconName ? iconsMap[iconName] || Construction : Construction
  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50/30">
      <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center">
          <Icon className="w-24 h-24 text-blue-600/90" strokeWidth={1} />
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {titulo}
          </h1>
          <p className="text-xl text-slate-500 max-w-lg mx-auto leading-relaxed">
            {descricao}
          </p>
        </div>

        <p className="text-sm text-slate-500 italic pt-8">
          Estamos trabalhando para entregar a melhor experiência clínica em breve.
        </p>
      </div>
    </main>
  )
}
