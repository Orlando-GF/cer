
import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

export async function GET() {
  const supabase = await createClient()

  const { data: especialidades } = await supabase
    .from("linhas_cuidado_especialidades")
    .select("id")
    .limit(3)

  const espIds = especialidades?.map(e => e.id) || []

  const { data, error } = await supabase
    .from("profissionais")
    .insert({
      nome_completo: "Dr. Paulo Especialista (Test)",
      cbo: "225125",
      registro_conselho: "CRM-BA 123456",
      perfil_acesso: "Medico_Terapeuta",
      especialidades_permitidas: espIds,
      ativo: true
    })
    .select()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  revalidatePath("/agendamentos")
  return NextResponse.json({ success: true, professional: data[0] })
}
