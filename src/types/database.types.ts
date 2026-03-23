export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agendamentos_historico: {
        Row: {
          atualizado_em: string | null
          conduta: Database["public"]["Enums"]["conduta_evolucao_enum"] | null
          confirmado_pelo_paciente: boolean | null
          criado_em: string | null
          data_hora_fim: string | null
          data_hora_inicio: string
          deleted_at: string | null
          especialidade_id: string
          evolucao_clinica: string | null
          id: string
          ordem_chegada: number | null
          paciente_id: string
          profissional_id: string | null
          status_comparecimento:
            | Database["public"]["Enums"]["status_presenca_enum"]
            | null
          tipo_agendamento: string | null
          tipo_vaga: string | null
          vaga_fixa_id: string | null
        }
        Insert: {
          atualizado_em?: string | null
          conduta?: Database["public"]["Enums"]["conduta_evolucao_enum"] | null
          confirmado_pelo_paciente?: boolean | null
          criado_em?: string | null
          data_hora_fim?: string | null
          data_hora_inicio: string
          deleted_at?: string | null
          especialidade_id: string
          evolucao_clinica?: string | null
          id?: string
          ordem_chegada?: number | null
          paciente_id: string
          profissional_id?: string | null
          status_comparecimento?:
            | Database["public"]["Enums"]["status_presenca_enum"]
            | null
          tipo_agendamento?: string | null
          tipo_vaga?: string | null
          vaga_fixa_id?: string | null
        }
        Update: {
          atualizado_em?: string | null
          conduta?: Database["public"]["Enums"]["conduta_evolucao_enum"] | null
          confirmado_pelo_paciente?: boolean | null
          criado_em?: string | null
          data_hora_fim?: string | null
          data_hora_inicio?: string
          deleted_at?: string | null
          especialidade_id?: string
          evolucao_clinica?: string | null
          id?: string
          ordem_chegada?: number | null
          paciente_id?: string
          profissional_id?: string | null
          status_comparecimento?:
            | Database["public"]["Enums"]["status_presenca_enum"]
            | null
          tipo_agendamento?: string | null
          tipo_vaga?: string | null
          vaga_fixa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "linhas_cuidado_especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_historico_vaga_fixa_id_fkey"
            columns: ["vaga_fixa_id"]
            isOneToOne: false
            referencedRelation: "vagas_fixas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_servico_social: {
        Row: {
          criado_em: string | null
          data_avaliacao: string
          descricao_barreiras_arquitetonicas: string | null
          id: string
          impacto_incapacidade_trabalho: string | null
          paciente_id: string
          parecer_final: string
          profissional_id: string
          quantidade_membros_familia: number
          recebe_beneficio: boolean | null
          relatorio_social: string
          renda_familiar_total: number
          tem_energia_eletrica: boolean | null
          tem_saneamento_basico: boolean | null
          tipo_beneficio: string | null
          tipo_moradia: string | null
        }
        Insert: {
          criado_em?: string | null
          data_avaliacao: string
          descricao_barreiras_arquitetonicas?: string | null
          id?: string
          impacto_incapacidade_trabalho?: string | null
          paciente_id: string
          parecer_final: string
          profissional_id: string
          quantidade_membros_familia: number
          recebe_beneficio?: boolean | null
          relatorio_social: string
          renda_familiar_total: number
          tem_energia_eletrica?: boolean | null
          tem_saneamento_basico?: boolean | null
          tipo_beneficio?: string | null
          tipo_moradia?: string | null
        }
        Update: {
          criado_em?: string | null
          data_avaliacao?: string
          descricao_barreiras_arquitetonicas?: string | null
          id?: string
          impacto_incapacidade_trabalho?: string | null
          paciente_id?: string
          parecer_final?: string
          profissional_id?: string
          quantidade_membros_familia?: number
          recebe_beneficio?: boolean | null
          relatorio_social?: string
          renda_familiar_total?: number
          tem_energia_eletrica?: boolean | null
          tem_saneamento_basico?: boolean | null
          tipo_beneficio?: string | null
          tipo_moradia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_servico_social_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_servico_social_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      faltas_registros: {
        Row: {
          criado_em: string | null
          data_falta: string
          fila_id: string
          id: string
          justificada: boolean | null
          observacao: string | null
          registrado_por: string | null
        }
        Insert: {
          criado_em?: string | null
          data_falta?: string
          fila_id: string
          id?: string
          justificada?: boolean | null
          observacao?: string | null
          registrado_por?: string | null
        }
        Update: {
          criado_em?: string | null
          data_falta?: string
          fila_id?: string
          id?: string
          justificada?: boolean | null
          observacao?: string | null
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faltas_registros_fila_id_fkey"
            columns: ["fila_id"]
            isOneToOne: false
            referencedRelation: "fila_espera"
            referencedColumns: ["id"]
          },
        ]
      }
      fila_espera: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          data_entrada_fila: string | null
          deleted_at: string | null
          especialidade_id: string
          frequencia_recomendada:
            | Database["public"]["Enums"]["frequencia_recomendada_enum"]
            | null
          id: string
          nivel_prioridade:
            | Database["public"]["Enums"]["nivel_prioridade_enum"]
            | null
          numero_processo_judicial: string | null
          origem_encaminhamento: string | null
          paciente_id: string
          status_fila: Database["public"]["Enums"]["status_fila_enum"] | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          data_entrada_fila?: string | null
          deleted_at?: string | null
          especialidade_id: string
          frequencia_recomendada?:
            | Database["public"]["Enums"]["frequencia_recomendada_enum"]
            | null
          id?: string
          nivel_prioridade?:
            | Database["public"]["Enums"]["nivel_prioridade_enum"]
            | null
          numero_processo_judicial?: string | null
          origem_encaminhamento?: string | null
          paciente_id: string
          status_fila?: Database["public"]["Enums"]["status_fila_enum"] | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          data_entrada_fila?: string | null
          deleted_at?: string | null
          especialidade_id?: string
          frequencia_recomendada?:
            | Database["public"]["Enums"]["frequencia_recomendada_enum"]
            | null
          id?: string
          nivel_prioridade?:
            | Database["public"]["Enums"]["nivel_prioridade_enum"]
            | null
          numero_processo_judicial?: string | null
          origem_encaminhamento?: string | null
          paciente_id?: string
          status_fila?: Database["public"]["Enums"]["status_fila_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fila_espera_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "linhas_cuidado_especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fila_espera_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_horaria: {
        Row: {
          ativo: boolean | null
          capacidade_atendimentos: number
          criado_em: string | null
          data_inicio_vigencia: string | null
          dia_semana: number
          horario_fim: string
          horario_inicio: string
          id: string
          profissional_id: string
        }
        Insert: {
          ativo?: boolean | null
          capacidade_atendimentos?: number
          criado_em?: string | null
          data_inicio_vigencia?: string | null
          dia_semana: number
          horario_fim: string
          horario_inicio: string
          id?: string
          profissional_id: string
        }
        Update: {
          ativo?: boolean | null
          capacidade_atendimentos?: number
          criado_em?: string | null
          data_inicio_vigencia?: string | null
          dia_semana?: number
          horario_fim?: string
          horario_inicio?: string
          id?: string
          profissional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_horaria_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      linhas_cuidado_especialidades: {
        Row: {
          ativo: boolean | null
          criado_em: string | null
          deleted_at: string | null
          equipe_responsavel: string
          id: string
          linha_reabilitacao: string
          nome_especialidade: string
          tipo_atendimento: Database["public"]["Enums"]["tipo_atendimento_enum"]
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string | null
          deleted_at?: string | null
          equipe_responsavel: string
          id?: string
          linha_reabilitacao: string
          nome_especialidade: string
          tipo_atendimento: Database["public"]["Enums"]["tipo_atendimento_enum"]
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string | null
          deleted_at?: string | null
          equipe_responsavel?: string
          id?: string
          linha_reabilitacao?: string
          nome_especialidade?: string
          tipo_atendimento?: Database["public"]["Enums"]["tipo_atendimento_enum"]
        }
        Relationships: []
      }
      logs_auditoria: {
        Row: {
          acao: string
          autor_id: string | null
          dados_antigos: Json | null
          dados_novos: Json | null
          data_hora: string | null
          id: string
          registro_id: string
          tabela_afetada: string
        }
        Insert: {
          acao: string
          autor_id?: string | null
          dados_antigos?: Json | null
          dados_novos?: Json | null
          data_hora?: string | null
          id?: string
          registro_id: string
          tabela_afetada: string
        }
        Update: {
          acao?: string
          autor_id?: string | null
          dados_antigos?: Json | null
          dados_novos?: Json | null
          data_hora?: string | null
          id?: string
          registro_id?: string
          tabela_afetada?: string
        }
        Relationships: []
      }
      pacientes: {
        Row: {
          atualizado_em: string | null
          bairro: string | null
          cid_principal: string | null
          cid_secundario: string | null
          cidade: string | null
          cns: string
          cpf: string | null
          criado_em: string | null
          data_nascimento: string
          data_ultimo_laudo: string | null
          deleted_at: string | null
          eletivo: boolean | null
          email: string | null
          endereco_cep: string | null
          equipe_tecnica:
            | Database["public"]["Enums"]["equipe_tecnica_enum"]
            | null
          estado_civil: string | null
          id: string
          id_legado_vba: string | null
          logradouro: string | null
          motivo_inativacao: string | null
          municipio_pactuado: string | null
          naturalidade: string | null
          necessita_transporte: boolean | null
          nome_completo: string
          nome_mae: string
          nome_pai: string | null
          nome_responsavel: string | null
          numero: string | null
          numero_prontuario: string | null
          observacao_acolhimento: string | null
          opms_solicitadas: string[] | null
          pactuado: boolean | null
          profissao: string | null
          referencia: string | null
          reside_com: string | null
          rg: string | null
          rg_orgao_exp: string | null
          sexo: Database["public"]["Enums"]["sexo_enum"]
          status_cadastro:
            | Database["public"]["Enums"]["status_cadastro_enum"]
            | null
          tags_acessibilidade: string[] | null
          telefone_principal: string | null
          telefone_responsavel: string | null
          telefone_secundario: string | null
          tipo_reabilitacao:
            | Database["public"]["Enums"]["tipo_reabilitacao_enum"]
            | null
          uf: string | null
        }
        Insert: {
          atualizado_em?: string | null
          bairro?: string | null
          cid_principal?: string | null
          cid_secundario?: string | null
          cidade?: string | null
          cns: string
          cpf?: string | null
          criado_em?: string | null
          data_nascimento: string
          data_ultimo_laudo?: string | null
          deleted_at?: string | null
          eletivo?: boolean | null
          email?: string | null
          endereco_cep?: string | null
          equipe_tecnica?:
            | Database["public"]["Enums"]["equipe_tecnica_enum"]
            | null
          estado_civil?: string | null
          id?: string
          id_legado_vba?: string | null
          logradouro?: string | null
          motivo_inativacao?: string | null
          municipio_pactuado?: string | null
          naturalidade?: string | null
          necessita_transporte?: boolean | null
          nome_completo: string
          nome_mae: string
          nome_pai?: string | null
          nome_responsavel?: string | null
          numero?: string | null
          numero_prontuario?: string | null
          observacao_acolhimento?: string | null
          opms_solicitadas?: string[] | null
          pactuado?: boolean | null
          profissao?: string | null
          referencia?: string | null
          reside_com?: string | null
          rg?: string | null
          rg_orgao_exp?: string | null
          sexo: Database["public"]["Enums"]["sexo_enum"]
          status_cadastro?:
            | Database["public"]["Enums"]["status_cadastro_enum"]
            | null
          tags_acessibilidade?: string[] | null
          telefone_principal?: string | null
          telefone_responsavel?: string | null
          telefone_secundario?: string | null
          tipo_reabilitacao?:
            | Database["public"]["Enums"]["tipo_reabilitacao_enum"]
            | null
          uf?: string | null
        }
        Update: {
          atualizado_em?: string | null
          bairro?: string | null
          cid_principal?: string | null
          cid_secundario?: string | null
          cidade?: string | null
          cns?: string
          cpf?: string | null
          criado_em?: string | null
          data_nascimento?: string
          data_ultimo_laudo?: string | null
          deleted_at?: string | null
          eletivo?: boolean | null
          email?: string | null
          endereco_cep?: string | null
          equipe_tecnica?:
            | Database["public"]["Enums"]["equipe_tecnica_enum"]
            | null
          estado_civil?: string | null
          id?: string
          id_legado_vba?: string | null
          logradouro?: string | null
          motivo_inativacao?: string | null
          municipio_pactuado?: string | null
          naturalidade?: string | null
          necessita_transporte?: boolean | null
          nome_completo?: string
          nome_mae?: string
          nome_pai?: string | null
          nome_responsavel?: string | null
          numero?: string | null
          numero_prontuario?: string | null
          observacao_acolhimento?: string | null
          opms_solicitadas?: string[] | null
          pactuado?: boolean | null
          profissao?: string | null
          referencia?: string | null
          reside_com?: string | null
          rg?: string | null
          rg_orgao_exp?: string | null
          sexo?: Database["public"]["Enums"]["sexo_enum"]
          status_cadastro?:
            | Database["public"]["Enums"]["status_cadastro_enum"]
            | null
          tags_acessibilidade?: string[] | null
          telefone_principal?: string | null
          telefone_responsavel?: string | null
          telefone_secundario?: string | null
          tipo_reabilitacao?:
            | Database["public"]["Enums"]["tipo_reabilitacao_enum"]
            | null
          uf?: string | null
        }
        Relationships: []
      }
      profissionais: {
        Row: {
          ativo: boolean | null
          cbo: string | null
          criado_em: string | null
          deleted_at: string | null
          id: string
          nome_completo: string
          perfil_acesso: Database["public"]["Enums"]["perfil_acesso_enum"]
          registro_conselho: string | null
          usuario_auth_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          cbo?: string | null
          criado_em?: string | null
          deleted_at?: string | null
          id?: string
          nome_completo: string
          perfil_acesso: Database["public"]["Enums"]["perfil_acesso_enum"]
          registro_conselho?: string | null
          usuario_auth_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          cbo?: string | null
          criado_em?: string | null
          deleted_at?: string | null
          id?: string
          nome_completo?: string
          perfil_acesso?: Database["public"]["Enums"]["perfil_acesso_enum"]
          registro_conselho?: string | null
          usuario_auth_id?: string | null
        }
        Relationships: []
      }
      profissionais_especialidades: {
        Row: {
          especialidade_id: string
          profissional_id: string
        }
        Insert: {
          especialidade_id: string
          profissional_id: string
        }
        Update: {
          especialidade_id?: string
          profissional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_especialidades_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "linhas_cuidado_especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissionais_especialidades_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      vagas_fixas: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          data_fim_contrato: string | null
          data_inicio_contrato: string
          deleted_at: string | null
          dia_semana: number
          especialidade_id: string
          horario_fim: string
          horario_inicio: string
          id: string
          paciente_id: string
          profissional_id: string
          status_vaga: Database["public"]["Enums"]["status_vaga_enum"] | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          data_fim_contrato?: string | null
          data_inicio_contrato?: string
          deleted_at?: string | null
          dia_semana: number
          especialidade_id: string
          horario_fim: string
          horario_inicio: string
          id?: string
          paciente_id: string
          profissional_id: string
          status_vaga?: Database["public"]["Enums"]["status_vaga_enum"] | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          data_fim_contrato?: string | null
          data_inicio_contrato?: string
          deleted_at?: string | null
          dia_semana?: number
          especialidade_id?: string
          horario_fim?: string
          horario_inicio?: string
          id?: string
          paciente_id?: string
          profissional_id?: string
          status_vaga?: Database["public"]["Enums"]["status_vaga_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "vagas_fixas_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "linhas_cuidado_especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vagas_fixas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vagas_fixas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_tem_acesso: { Args: { cargos?: string[] }; Returns: boolean }
      faltas_consecutivas: {
        Args: { f: Database["public"]["Tables"]["fila_espera"]["Row"] }
        Returns: number
      }
      get_user_role: { Args: never; Returns: string }
    }
    Enums: {
      conduta_evolucao_enum:
        | "Retorno"
        | "Alta por Melhoria"
        | "Alta por Abandono"
        | "Alta a Pedido"
        | "Obito/Transferencia"
        | "Encaminhamento Externo"
        | "Inserir em Fila de Terapia"
      equipe_tecnica_enum: "Estimulacao_Precoce" | "Infanto_Juvenil" | "Adulta"
      frequencia_recomendada_enum:
        | "A definir"
        | "Semanal"
        | "Quinzenal"
        | "Mensal"
      nivel_prioridade_enum: "Rotina" | "Urgencia Clinica" | "Mandado Judicial"
      perfil_acesso_enum:
        | "Recepcao"
        | "Enfermagem"
        | "Medico_Terapeuta"
        | "Administracao"
        | "Motorista"
      sexo_enum: "M" | "F" | "Outro"
      status_cadastro_enum: "Ativo" | "Inativo" | "Obito" | "Alta"
      status_fila_enum:
        | "Aguardando"
        | "Em Atendimento"
        | "Em Risco"
        | "Desistencia"
        | "Alta"
        | "Aguardando Vaga"
      status_presenca_enum:
        | "Agendado"
        | "Presente"
        | "Falta Injustificada"
        | "Falta Justificada"
        | "Cancelado"
        | "Falta Nao Justificada"
      status_vaga_enum: "Ativa" | "Suspensa" | "Encerrada"
      tipo_atendimento_enum:
        | "Consulta Medica"
        | "Terapia Continua"
        | "Dispensacao_OPM"
        | "Avaliacao_Diagnostica"
        | "Acolhimento"
      tipo_reabilitacao_enum: "Fisica" | "Intelectual" | "Ambas"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      conduta_evolucao_enum: [
        "Retorno",
        "Alta por Melhoria",
        "Alta por Abandono",
        "Alta a Pedido",
        "Obito/Transferencia",
        "Encaminhamento Externo",
        "Inserir em Fila de Terapia",
      ],
      equipe_tecnica_enum: ["Estimulacao_Precoce", "Infanto_Juvenil", "Adulta"],
      frequencia_recomendada_enum: [
        "A definir",
        "Semanal",
        "Quinzenal",
        "Mensal",
      ],
      nivel_prioridade_enum: ["Rotina", "Urgencia Clinica", "Mandado Judicial"],
      perfil_acesso_enum: [
        "Recepcao",
        "Enfermagem",
        "Medico_Terapeuta",
        "Administracao",
        "Motorista",
      ],
      sexo_enum: ["M", "F", "Outro"],
      status_cadastro_enum: ["Ativo", "Inativo", "Obito", "Alta"],
      status_fila_enum: [
        "Aguardando",
        "Em Atendimento",
        "Em Risco",
        "Desistencia",
        "Alta",
        "Aguardando Vaga",
      ],
      status_presenca_enum: [
        "Agendado",
        "Presente",
        "Falta Injustificada",
        "Falta Justificada",
        "Cancelado",
        "Falta Nao Justificada",
      ],
      status_vaga_enum: ["Ativa", "Suspensa", "Encerrada"],
      tipo_atendimento_enum: [
        "Consulta Medica",
        "Terapia Continua",
        "Dispensacao_OPM",
        "Avaliacao_Diagnostica",
        "Acolhimento",
      ],
      tipo_reabilitacao_enum: ["Fisica", "Intelectual", "Ambas"],
    },
  },
} as const
