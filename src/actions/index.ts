'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { cache as reactCache } from 'react'
import {
  especialidadeSchema,
  gradeHorariaSchema,
  profissionalSchema,
} from '@/lib/validations/schema'
import {
  type Profissional,
  type Especialidade,
  type GradeHoraria,
  type ActionResponse,
  type DadosUsuario,
  type PerfilAcesso,
} from '@/types'



// ==========================================
// CONFIGURAÇÕES — ESPECIALIDADES
// ==========================================

export async function buscarEspecialidades(): Promise<
  ActionResponse<Especialidade[]>
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('linhas_cuidado_especialidades')
    .select('id, nome_especialidade, ativo, criado_em')
    .order('nome_especialidade')
  if (error) return { success: false, error: error.message }
  return { success: true, data: data as unknown as Especialidade[] }
}

export async function cadastrarEspecialidade(
  rawData: unknown,
): Promise<ActionResponse<Especialidade>> {
  const supabase = await createClient()
  const val = especialidadeSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: 'Dados inválidos.' }

  const { data, error } = await supabase
    .from('linhas_cuidado_especialidades')
    .insert([val.data])
    .select()
    .single()
  if (error) return { success: false, error: error.message }

  revalidatePath('/especialidades')
  return { success: true, data: data as Especialidade }
}

export async function atualizarEspecialidade(
  id: string,
  rawData: unknown,
): Promise<ActionResponse<Especialidade>> {
  const supabase = await createClient()
  const val = especialidadeSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: 'Dados inválidos.' }

  const { data, error } = await supabase
    .from('linhas_cuidado_especialidades')
    .update(val.data)
    .eq('id', id)
    .select()
    .single()
  if (error) return { success: false, error: error.message }

  revalidatePath('/especialidades')
  return { success: true, data: data as Especialidade }
}

export async function toggleAtivaEspecialidade(
  id: string,
  ativo: boolean,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('linhas_cuidado_especialidades')
    .update({ ativo })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/especialidades')
  return { success: true }
}

// ==========================================
// CONFIGURAÇÕES — GRADES HORÁRIAS
// ==========================================

// ✅ REVERTIDO: tabela correta 'grade_horaria'
export async function buscarGradesHorarias(): Promise<
  ActionResponse<GradeHoraria[]>
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('grade_horaria')
    .select(
      'id, dia_semana, horario_inicio, horario_fim, ativo, profissional_id, profissional:profissionais(nome_completo)',
    )
    .order('dia_semana')
    .order('horario_inicio')
  if (error) return { success: false, error: error.message }
  return { success: true, data: data as GradeHoraria[] }
}

export async function salvarGradeHoraria(
  rawData: unknown,
): Promise<ActionResponse<GradeHoraria>> {
  const supabase = await createClient()
  const val = gradeHorariaSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: 'Dados inválidos.' }

  const { data, error } = await supabase
    .from('grade_horaria')
    .upsert([val.data])
    .select()
    .single()
  if (error) return { success: false, error: error.message }

  revalidatePath('/grades')
  return { success: true, data: data as GradeHoraria }
}

export async function toggleAtivaGradeHoraria(
  id: string,
  ativo: boolean,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('grade_horaria')
    .update({ ativo })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/grades')
  return { success: true }
}

// ==========================================
// CONFIGURAÇÕES — PROFISSIONAIS
// ==========================================

export async function buscarProfissionais(): Promise<
  ActionResponse<Profissional[]>
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profissionais')
    .select(
      'id, nome_completo, registro_conselho, cbo, perfil_acesso, ativo, profissionais_especialidades ( especialidade_id )',
    )
    .order('nome_completo')

  if (error) return { success: false, error: error.message }

  const mappedData = (data || []).map((p: Record<string, unknown>) => {
    const pe = p.profissionais_especialidades as
      | Array<{ especialidade_id: string }>
      | undefined
    const rest = { ...p }
    delete rest.profissionais_especialidades
    return {
      ...rest,
      especialidades_permitidas: pe?.map((item) => item.especialidade_id) || [],
    }
  })

  return { success: true, data: mappedData as unknown as Profissional[] }
}

export async function cadastrarProfissional(
  rawData: unknown,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const val = profissionalSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: 'Dados inválidos.' }

  const { especialidades_permitidas, ...profissionalData } = val.data
  const { data: newProfissional, error } = await supabase
    .from('profissionais')
    .insert(profissionalData)
    .select('id')
    .single()
  if (error) return { success: false, error: error.message }

  if (especialidades_permitidas && especialidades_permitidas.length > 0) {
    const especialidadesInsert = especialidades_permitidas.map((espId) => ({
      profissional_id: newProfissional.id,
      especialidade_id: espId,
    }))
    const { error: errEsp } = await supabase
      .from('profissionais_especialidades')
      .insert(especialidadesInsert)
    if (errEsp) return { success: false, error: errEsp.message }
  }

  revalidatePath('/profissionais')
  return { success: true }
}

export async function atualizarProfissional(
  id: string,
  rawData: unknown,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const val = profissionalSchema.safeParse(rawData)
  if (!val.success) return { success: false, error: 'Dados inválidos.' }

  const { especialidades_permitidas, ...profissionalData } = val.data
  const { error } = await supabase
    .from('profissionais')
    .update(profissionalData)
    .eq('id', id)
  if (error) return { success: false, error: error.message }

  const { error: errDel } = await supabase
    .from('profissionais_especialidades')
    .delete()
    .eq('profissional_id', id)
  if (errDel) return { success: false, error: errDel.message }

  if (especialidades_permitidas && especialidades_permitidas.length > 0) {
    const especialidadesInsert = especialidades_permitidas.map((espId) => ({
      profissional_id: id,
      especialidade_id: espId,
    }))
    const { error: errEsp } = await supabase
      .from('profissionais_especialidades')
      .insert(especialidadesInsert)
    if (errEsp) return { success: false, error: errEsp.message }
  }

  revalidatePath('/profissionais')
  return { success: true }
}

export async function toggleAtivoProfissional(
  id: string,
  ativo: boolean,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profissionais')
    .update({ ativo })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/profissionais')
  return { success: true }
}

// ==========================================
// PERFIL E SESSÃO
// ==========================================

// ✅ CORRIGIDO (crítico): era .eq('id', user.id) — campo correto é usuario_auth_id
export const getMeuPerfil = reactCache(
  async (): Promise<DadosUsuario | null> => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data: prof } = await supabase
      .from('profissionais')
      .select('perfil_acesso, nome_completo')
      .eq('usuario_auth_id', user.id)
      .single()

    if (!prof)
      return {
        perfil_acesso: 'Administracao',
        nome_completo: 'Administrador',
        email: user.email ?? '',
      }

    return {
      perfil_acesso: prof.perfil_acesso as PerfilAcesso,
      nome_completo: prof.nome_completo,
      email: user.email ?? '',
    }
  },
)

