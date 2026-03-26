'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  pacienteSchema,
  avaliacaoServicoSocialSchema,
} from '@/lib/validations/schema'
import {
  type Paciente,
  type ActionResponse,
} from '@/types'

// ==========================================
// PACIENTES
// ==========================================

export async function buscarPacientes(
  params: {
    page?: number
    pageSize?: number
    busca?: string
  } = {},
): Promise<ActionResponse<{ data: Paciente[]; total: number }>> {
  const { page = 1, pageSize = 20, busca = '' } = params
  const supabase = await createClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('pacientes')
    .select('id, nome_completo, numero_prontuario, cns, cpf, data_nascimento, status_cadastro', {
      count: 'exact',
    })

  const termo = busca.trim()
  if (termo.length >= 3) {
    const apenasNumeros = termo.replace(/\D/g, '')
    if (apenasNumeros.length > 0) {
      query = query.or(
        `cpf.ilike.%${apenasNumeros}%,cns.ilike.%${apenasNumeros}%,numero_prontuario.ilike.%${apenasNumeros}%`,
      )
    } else {
      query = query.or(
        `nome_completo.ilike.%${termo}%,numero_prontuario.ilike.%${termo}%`,
      )
    }
  }

  const { data, error, count } = await query
    .order('nome_completo', { ascending: true })
    .range(from, to)

  if (error)
    return {
      success: false,
      error: `Erro ao procurar pacientes: ${error.message}`,
    }
  return {
    success: true,
    data: { data: data as Paciente[], total: count || 0 },
  }
}

export async function cadastrarPaciente(
  rawData: unknown,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const validation = pacienteSchema.safeParse(rawData)
  if (!validation.success)
    return {
      success: false,
      error: validation.error.issues.map((i) => i.message).join(', '),
    }

  const { data } = validation
  const { error } = await supabase.from('pacientes').insert({
    ...data,
    cpf: data.cpf || null,
    municipio_pactuado: data.municipio_pactuado || null,
    cid_principal: data.cid_principal || null,
    cid_secundario: data.cid_secundario || null,
    nome_pai: data.nome_pai || null,
    id_legado_vba: data.id_legado_vba || null,
  })

  if (error) {
    if (error.code === '23505')
      return { success: false, error: 'Conflito: CNS ou CPF já cadastrado.' }
    return {
      success: false,
      error: `Erro ao cadastrar paciente: ${error.message}`,
    }
  }

  revalidatePath('/pacientes')
  return { success: true }
}

export async function atualizarPaciente(
  id: string,
  rawData: unknown,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const validation = pacienteSchema.safeParse(rawData)
  if (!validation.success)
    return {
      success: false,
      error: validation.error.issues.map((i) => i.message).join(', '),
    }

  const { data } = validation
  const { error } = await supabase
    .from('pacientes')
    .update({
      ...data,
      cpf: data.cpf || null,
      municipio_pactuado: data.municipio_pactuado || null,
      cid_principal: data.cid_principal || null,
      cid_secundario: data.cid_secundario || null,
      nome_pai: data.nome_pai || null,
      id_legado_vba: data.id_legado_vba || null,
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505')
      return { success: false, error: 'Conflito: CNS ou CPF já cadastrado.' }
    return {
      success: false,
      error: `Erro ao atualizar paciente: ${error.message}`,
    }
  }

  revalidatePath('/pacientes')
  return { success: true }
}

export async function buscarPacientePorDocumento(
  documento: string,
): Promise<ActionResponse<Paciente>> {
  const supabase = await createClient()
  const docLimpo = documento.replace(/\D/g, '')
  let query = supabase
    .from('pacientes')
    .select(
      'id, nome_completo, cns, cpf, data_nascimento, status_cadastro, telefone_principal, endereco_cep, logradouro, numero, bairro, cidade, uf, nome_mae, cid_principal',
    )

  if (docLimpo.length === 11) query = query.eq('cpf', docLimpo)
  else query = query.eq('cns', docLimpo)

  const { data, error } = await query.single()
  if (error || !data)
    return { success: false, error: 'Paciente não encontrado' }
  return { success: true, data: data as Paciente }
}

export async function buscarPacienteCompleto(
  id: string,
): Promise<ActionResponse<Paciente>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !data)
    return { success: false, error: 'Paciente não encontrado' }
  return { success: true, data: data as Paciente }
}

// ==========================================
// AVALIAÇÃO SOCIAL (dependência do domínio de Pacientes)
// ==========================================

export async function cadastrarAvaliacaoSocial(
  rawData: unknown,
): Promise<ActionResponse> {
  const supabase = await createClient()
  const val = avaliacaoServicoSocialSchema.safeParse(rawData)
  if (!val.success)
    return {
      success: false,
      error: val.error.issues.map((i) => i.message).join(', '),
    }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Usuário não autenticado.' }

  const { data: prof } = await supabase
    .from('profissionais')
    .select('id')
    .eq('usuario_auth_id', user.id)
    .single()
  if (!prof) return { success: false, error: 'Profissional não encontrado' }

  const { error } = await supabase.from('avaliacoes_servico_social').insert({
    ...val.data,
    profissional_id: prof.id,
  })

  if (error)
    return {
      success: false,
      error: `Erro ao registrar avaliação: ${error.message}`,
    }

  revalidatePath('/pacientes')
  return { success: true }
}
