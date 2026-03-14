Contexto Mestre do Projeto: Sistema de Gestão para CER 2 (SUS)

1. Visão Geral e Objetivo Crítico

Estamos a desenvolver um sistema web moderno para substituir um software legado em VBA utilizado num CER 2 (Centro Especializado em Reabilitação) vinculado ao SUS em Barreiras/BA. O sistema atende uma demanda de mais de 8.000 prontuários, com foco em terapias contínuas (Autismo, Neurologia, Fonoaudiologia, etc.) e dispensação de OPM (ex: medida de cadeira de rodas).
Objetivo do MVP: Resolver uma crise de judicialização. O sistema precisa de gerir filas de espera de forma transparente, priorizar mandados judiciais com rastreabilidade, gerir a agenda de atendimentos (com regras de recorrência e intensivo) e controlar o absenteísmo (faltas) para otimizar o fluxo de vagas.

2. Stack Tecnológica e Infraestrutura

Frontend: Next.js (App Router), React, Tailwind CSS, TypeScript.

UI Components: shadcn/ui e Radix UI (Foco em acessibilidade e ergonomia visual).

Backend/Database: Supabase (PostgreSQL nativo).

Segurança e LGPD: Dados de saúde são sensíveis. O Supabase deve rodar obrigatoriamente na região sa-east-1 (São Paulo). O acesso aos dados deve ser blindado via Supabase Auth e RLS (Row Level Security) diretamente na base de dados.

3. Diretrizes de Código e Arquitetura (Coding Standards)

A IA deve gerar código estritamente seguindo estas regras:

REGRA ZERO (Uso OBRIGATÓRIO do Diretório /.agent/ e MCP): É TERMINANTEMENTE PROIBIDO à IA atuar com base em suposições (hallucinations) ou tentar resolver problemas complexos sozinha. Antes de planear ou escrever qualquer código, a IA DEVE OBRIGATORIAMENTE:

Aceder ao diretório local /.agent/ na raiz do projeto.

Ler ativamente os especialistas, agentes e habilidades (skills) armazenados nesta pasta para identificar a ferramenta mais qualificada para a tarefa solicitada.

Utilizar ferramentas MCP (ex: Supabase MCP) para verificar o estado real da infraestrutura antes de propor alterações.

- **Regra Zero (DITAME MESTRE)**: É OBRIGATÓRIO o uso de especialistas da pasta `/.agent/`. Toda resposta deve iniciar com a declaração explícita: `🤖 **Applying knowledge of @[agente] e [habilidade]...**`.

Integração DB via MCP (Supabase): Quando instruída a criar a base de dados via Supabase MCP, a IA DEVE agir de forma segura (idempotente). Deve verificar a existência de ENUMs e tabelas antes de as criar (CREATE TYPE IF NOT EXISTS, CREATE TABLE IF NOT EXISTS), e deve obrigatoriamente respeitar a ordem das Chaves Estrangeiras (Foreign Keys) para evitar erros de restrição.

PERSONA SÊNIOR E ESTILO DE CÓDIGO: A IA deve gerar código como um Engenheiro de Software Sênior. Isso significa:

Guard Clauses (Early Returns): Evitar aninhamento profundo de if/else. Tratar os erros e falhas logo no início da função e retornar.

Comentários Estratégicos: Não comentar o o quê (ex: // soma valor), mas sim o porquê das regras de negócio (ex: // Permite o atendimento compartilhado sem gerar conflito na agenda, conforme regra do CER).

Separação de Preocupações (SoC): Lógica de acesso a dados (Supabase) não deve estar misturada com UI de componentes.

Tipagem Estrita (Zod/TS): Exigir tipagem forte para entradas e saídas de funções.

Formatação Impecável: Espaçamento lógico entre blocos de código (imports, configuração, lógica principal, retornos) como se tivesse sido tratado pelo Prettier num ambiente corporativo de alto nível.

Nomenclatura Semântica (Clean Code): O código deve ser autoexplicativo e lógico. É terminantemente proibido o uso de abreviações obscuras ou nomes genéricos.

Formatação e Padronização (Prettier/ESLint): Todo código gerado deve ser limpo, altamente legível e estruturado.

TypeScript Estrito: Uso obrigatório de TypeScript. É proibido o uso de any.

Next.js App Router (Server-First): Componentes devem ser Server Components por padrão.

Mutação de Dados: Utilize Server Actions ("use server") para chamadas ao Supabase.

Gerenciamento de Estado de UI: Para paginação, filtros e abas ativas, utilize o URL (searchParams) em vez de useState.

Validação (Zod): Todo formulário e toda a Server Action DEVE validar o payload recebido utilizando zod.

HTML Semântico e Acessibilidade (a11y): Proibido o uso de "div soup". Utilize tags HTML5 semânticas.

4. Design System e Ergonomia Cognitiva

Tipografia e Legibilidade: Uso obrigatório da fonte Inter para toda a interface.

Regra Crítica para Dados: É OBRIGATÓRIO o uso da classe Tailwind tabular-nums na exibição de dados numéricos (CNS, CPF, Datas) nas tabelas, para garantir o alinhamento vertical exato.

Cores Principais: Fundo em bg-slate-50, cartões em bg-white, textos em text-slate-800.

Cor de Ação: Azul Clínico (bg-blue-600 a bg-blue-700).

Cores Semânticas (Alertas): Vermelho (bg-red-100 text-red-800) para Mandados/Faltas/Laudos Vencidos; Amarelo (bg-amber-100) para Aguardando; Verde (bg-emerald-100) para Atendimento/Alta.

5. Componentes Obrigatórios da UI e Views de Agenda

Data Table: Suportar paginação, busca global e filtros.

Slide-overs (Painéis Laterais): Detalhes do paciente sem mudar de página.

Command Menu (Cmd+K): Busca rápida flutuante.

Views de Agenda:

List View (Recepção): Lista simples e focada no turno atual para marcação rápida de "Presente/Faltou". Exibirá a "Ordem de Chegada" para consultas em bloco.

Day View (Profissional): Calendário focado apenas no dia do profissional para inserção de evolução clínica.

Timeline/Gantt View (Coordenação): Mapa visual de todos os profissionais para identificar horários ociosos ("buracos") e puxar fila de espera.

Route View (Motoristas): Vista restrita com a lista de pacientes do dia que necessitam de transporte, morada e orientações de acessibilidade (risco de crise, uso de maca, etc.).

6. Perfis de Acesso Estritos (RBAC)

Recepção: Gere agendamentos, presença e fila. Bloqueado: Laudos e diagnósticos.

Enfermagem/Acolhimento: Cria prontuários, anexa documentos, define prioridade clínica, CID-10 e Linha de Cuidado.

Corpo Clínico: Visualiza agendas próprias, preenche evoluções, dá altas.

Administração: Relatórios, gestão de mandados e auditoria.

Motorista: Acede apenas à "Route View" (Logística). Nenhum dado clínico visível.

7. Fluxo Operacional (A Jornada do Usuário Atualizada)

Acolhimento: Paciente chega. Busca rápida (Cmd+K). Se não existe, cadastra-se (assinalando CID-10 e necessidade de transporte com tags de risco). Define-se a prioridade e a Linha de Cuidado e entra na fila_espera.

Fluxo de Avaliação Diagnóstica: Pacientes sem diagnóstico passam por consultas de Avaliação. A conduta gera um laudo que pode disparar a inserção na Fila de Terapias.

Convocação (Agenda Médica vs Terapia):

Médico (Demanda em Bloco/Ordem de Chegada): Médico abre o dia. Pacientes são agendados e a receção gera a numeração de "Ordem de Chegada" no sistema.

Terapia (Agendamento Dinâmico): Vaga surge. Paciente assume um "Contrato de Vaga Fixa" (Regra de Recorrência). O sistema visualmente projeta o paciente no calendário futuro, sem gravar milhares de linhas na base de dados.

Gestão de Presença (Diária): Receção usa a List View e marca Presente/Falta. Ao marcar, o sistema "materializa" a sessão do dia na tabela de histórico. O acúmulo de 3 faltas injustificadas gera alerta de desligamento.

Atendimento: Profissional acede à agenda, regista a evolução clínica e decide a conduta.

Ciclo de Reavaliação (6 meses) - REGRA CRÍTICA: A cada 6 meses, o sistema exibe um alerta vermelho berrante ('⚠️ LAUDO VENCIDO'). O sistema NUNCA deve bloquear o profissional de digitar a evolução clínica. O bloqueio ocorre apenas na exportação do faturamento SUS (BPA) e o paciente é atirado para uma "Lista de Pendências" da coordenação.

8. Regras de Negócio Inegociáveis

Fila Baseada em Prioridade: Mandados judiciais furam a fila.

Filas Independentes: Atreladas à especialidade, não apenas ao paciente.

Regra de Absenteísmo: 3 faltas consecutivas = Alerta de Desligamento.

Logs de Auditoria: Alterações em agendamentos geram log imutável.

Pactuação Municipal (PPI): Registar se é de Barreiras ou município pactuado.

9. Regras de Agendamento Avançadas (Motor Dinâmico)

Agendamento Dinâmico (Motor de Recorrência): Proibido criar infinitos agendamentos físicos na base de dados (ex: gerar blocos físicos de 3 meses é TERMINANTEMENTE PROIBIDO). Terapias contínuas operam guardando a "Regra". As sessões são geradas na tela On-The-Fly para permitir visualização de ociosidade. Registos físicos só ocorrem para gravar Presenças, Faltas ou Evoluções.

Exceções Temporárias: O sistema permite remarcar uma única sessão projetada sem quebrar a regra de recorrência matriz.

Agendamento em Bloco vs Hora Marcada: Suporta agendar X pacientes no mesmo turno com numeração de ordem_chegada.

Atendimento Compartilhado (Intensivo): Permite que 2 profissionais diferentes agendem o mesmo paciente no mesmo horário. O sistema não deve barrar a ação (não é conflito), mas DEVE exibir um ícone/alerta visual na agenda (Ex: ⚠️ Atendimento Compartilhado) para a receção.

10. Estrutura da Base de Dados (Supabase / PostgreSQL)

INSTRUÇÃO CRÍTICA PARA O AGENTE DA IDE (VIA MCP):
Ao processar esta arquitetura via MCP, você deve seguir esta ordem de execução para não violar restrições de chave estrangeira:

Criar todos os tipos ENUM nativos (sexo, status, tipos de vaga, condutas, etc.).

Criar tabelas independentes: linhas_cuidado_especialidades e pacientes.

Criar a tabela profissionais (que referencia auth.users e possui array de especialidades).

Criar as tabelas dependentes: grade_horaria, fila_espera e vagas_fixas.

Criar a tabela de materialização: agendamentos_historico.

Implementar a função e os TRIGGERS para a coluna updated_at.

Ativar RLS em TODAS as tabelas e aplicar as Políticas de Acesso iniciais (uso de authenticated).

10.1. Tabela: pacientes

id: UUID (PK), id_legado_vba, cns, cpf, nome_completo, data_nascimento, sexo.

nome_mae, nome_pai, rg, rg_orgao_exp, estado_civil, naturalidade.

Clínica e Logística: cid_principal (VARCHAR), cid_secundario (VARCHAR), necessita_transporte (BOOLEAN DEFAULT false).

Tags Críticas de Transporte: tags_acessibilidade (ARRAY de VARCHAR contendo obrigatoriamente opções como: 'Acamado/Uso de Maca', 'Risco de Agitação Psicomotora', 'Deficiência Visual Severa', 'Obesidade Severa', 'Uso de Oxigénio', 'Cadeirante').

Endereço e Contatos normalizados.

status_cadastro: ENUM ('Ativo', 'Inativo', 'Obito', 'Alta').

10.2. Tabela: linhas_cuidado_especialidades

id: UUID (PK).

equipe_responsavel, linha_reabilitacao (Crucial para Faturamento SUS), nome_especialidade.

tipo_atendimento: ENUM ('Consulta Medica', 'Terapia Continua', 'Dispensacao_OPM', 'Avaliacao_Diagnostica').

10.3. Tabela: fila_espera

id: UUID (PK).

paciente_id (FK), especialidade_id (FK).

data_entrada_fila: TIMESTAMPTZ, nivel_prioridade, numero_processo_judicial.

status_fila: ENUM ('Aguardando', 'Em Atendimento', 'Desistencia', 'Alta').

10.4. Tabela: profissionais e grade_horaria

profissionais: id, nome_completo, registro_conselho, cbo, perfil_acesso.

Filtro de Agendamento: especialidades_permitidas (ARRAY de UUIDs apontando para linhas_cuidado_especialidades) para evitar que a receção marque terapias no profissional errado.

grade_horaria: Define a capacidade base do profissional.

10.5. Tabela: vagas_fixas (O Contrato Dinâmico)

id: UUID (PK).

paciente_id (FK), profissional_id (FK), especialidade_id (FK).

dia_semana: INTEGER (0=Domingo, 6=Sábado).

horario_inicio: TIME, horario_fim: TIME.

data_inicio_contrato: DATE, data_fim_contrato: DATE (Nulo até à Alta).

status_vaga: ENUM ('Ativa', 'Suspensa', 'Encerrada').

Nota: Esta tabela não polui a base de dados. É apenas a regra de leitura para o Frontend desenhar a agenda.

10.6. Tabela: agendamentos_historico (Materialização)

id: UUID (PK).

paciente_id (FK), profissional_id (FK), especialidade_id (FK).

vaga_fixa_id: UUID (FK opcional, para referenciar qual regra gerou este registo).

data_hora_inicio: TIMESTAMPTZ, data_hora_fim: TIMESTAMPTZ.

tipo_vaga, tipo_agendamento, ordem_chegada.

status_comparecimento: ENUM ('Agendado', 'Presente', 'Falta Justificada', 'Falta Nao Justificada', 'Cancelado').

evolucao_clinica: TEXT.

conduta: ENUM ('Retorno', 'Alta por Melhoria', 'Alta por Abandono', 'Alta a Pedido', 'Obito/Transferencia', 'Encaminhamento Externo', 'Inserir em Fila de Terapia').

11. Estrutura de Navegação (Sidebar Menu - UI)

Para garantir a usabilidade e a segurança, o menu lateral da aplicação deve ser categorizado de acordo com o Perfil de Acesso (RBAC). A interface não deve misturar tabelas de configuração administrativa com o fluxo clínico diário.

Recomendação de Estrutura do Menu:

ATENDIMENTO (Foco: Receção e Enfermagem)

Painel Geral (Dashboard da unidade)

Pacientes (CRUD base do paciente)

Fila de Espera (Gestão de chamadas e prioridades)

Agenda Geral (Marcações de consultas, turnos e presenças/faltas)

CLÍNICO (Foco: Médicos e Terapeutas)

Meus Atendimentos (Agenda focada no dia do profissional logado, que abre o Slide-over do Prontuário/Evolução)

Meus Pacientes (Lista de pacientes em que o profissional tem Contrato de Vaga Fixa ativo)

LOGÍSTICA (Foco: Motoristas / Coordenação)

Rotas de Transporte (Vista em lista/mapa de quem precisa da van hoje e orientações de acessibilidade)

GESTÃO E AUDITORIA (Foco: Coordenação)

Absenteísmo (Painel de alerta de pacientes com 3 faltas)

Mandados Judiciais (Acompanhamento legal)

Relatórios (Exportação BPA e produtividade)

CONFIGURAÇÕES (Foco: Administração do Sistema)

Profissionais & Acessos (Criação de utilizadores e permissões)

Especialidades (CRUD das Linhas de Cuidado - movido do menu Clínico)

Grades Horárias (Definição dos dias e horários de atendimento de cada profissional)