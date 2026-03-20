Contexto do Projeto e Regras de Desenvolvimento (CER)

Arquivo mestre do projeto. Lido pela IA antes de qualquer geração de
código. Contém stack, padrões, design system, banco de dados, regras de
negócio e estado real da implementação. Atualizado em 20/03/2026.

1. Visão Geral

Sistema web para substituir software legado em VBA no CER 2 — Centro
Especializado em Reabilitação Aníbal Barbora Filho, vinculado ao SUS em
Barreiras/BA. Gerencia mais de 8.000 prontuários com foco em terapias
contínuas (Autismo/TEA, Neurologia, Fonoaudiologia, Fisioterapia, Terapia
Ocupacional, Serviço Social, Psicologia, Nutrição) e dispensação de OPM.

Problema central: Crise de judicialização por falta de rastreabilidade
da fila de espera e problemas de escalabilidade na base de dados antiga.
O sistema deve provar, com logs auditáveis, a ordem de atendimento e escalar com performance para dezenas de milhares de registos futuros.

Objetivo do MVP:

Fila de espera transparente e auditável com prioridade para mandados judiciais.

Agenda inteligente com vagas fixas recorrentes (sem poluir o banco com registros futuros).

Controle de absenteísmo com alerta automático aos 3 faltas consecutivas.

Prontuário digital substituindo os formulários físicos.

2. Stack Tecnológica e Integração de Ecossistemas

Camada

Tecnologia

Observação

Framework

Next.js 15 (App Router)

Server Components por padrão

UI

React 19 + TypeScript estrito

Proibido any

Estilo

Tailwind CSS v4

Apenas variáveis semânticas do design system

Primitivas UI

Base UI (@base-ui/react)

Tabs, Button

Componentes

shadcn/ui

Card, Table, Sheet, Dialog, Select, etc.

Banco de dados

Supabase — PostgreSQL

Região obrigatória: sa-east-1 (São Paulo / LGPD)

Backend Auxiliar

Python 3.12+ (FastAPI / Scripts)

Isolado do Next.js (Ver Regra 2.1)

Validação

Zod

Formulários e Server Actions

2.1 Contrato de Integração Next.js ↔ Python (OBRIGATÓRIO)

Como o repositório contém uma grande parcela de código Python (38%), a fronteira entre os dois mundos é estrita:

O Next.js é a única face pública. Ele serve a UI e lida com a autenticação.

O Python atua como Worker/Microsserviço. Ele lida com tarefas pesadas (geração de relatórios densos, scripts de migração do VBA antigo, crons de análise de absenteísmo).

Comunicação: O código TypeScript nunca executa scripts Python localmente em produção via child_process. O Python deve expor endpoints REST (ex: FastAPI) protegidos ou ser acionado via Webhooks/Cron Jobs no Supabase. O banco de dados Supabase é o ponto de encontro de ambos, mas a UI só consome o TypeScript.

3. Regras de Código e Arquitetura — OBRIGATÓRIAS

A IA deve gerar código seguindo estas regras sem exceção. Violações devem ser corrigidas antes de qualquer entrega.

3.1 Single Source of Truth (SSoT) e DRY (Contra a "Síndrome do Copy-Paste")

REGRA CRÍTICA: Se uma regra de negócio for aplicada em mais de um lugar, ela deve virar uma função ou hook centralizado.

Nunca repita a lógica de cálculo (ex: "saber se o laudo está vencido"). Isso deve viver em uma única função em lib/utils.ts ou lib/business-rules.ts.

Se criar um layout novo, ele deve usar os componentes de UI já existentes em components/ui/. Nunca crie um <button> ou <table> do zero com classes do Tailwind soltas; importe o <Button> ou <Table> do Shadcn/UI.

3.2 Paginação Server-Side Obrigatória (Regra de Escalabilidade)

Com mais de 8.000 prontuários, é expressamente proibido carregar todos os dados de uma tabela para o cliente.

Todas as queries de listagem no Supabase devem usar paginação LIMIT e OFFSET através do método .range(from, to).

A páginação deve ser controlada via URL (?page=1&per_page=20) usando os searchParams do Next.js.

3.3 TypeScript Estrito

Proibido any — use tipos explícitos ou unknown.

Interfaces de props obrigatórias em todos os componentes.

3.4 Arquitetura Server-First (Next.js App Router)

Server Components por padrão. 'use client' apenas para interatividade.

Mutação de dados via Server Actions ('use server').

Estado de UI (filtros, paginação, abas): searchParams na URL — nunca useState.

Proibido useEffect para buscar dados.

3.5 Supabase e Padrões de Queries

Nunca usar select('\*'). Listar explicitamente os campos necessários.

Queries independentes na mesma page devem usar Promise.all([]).

FK de usuário: Sempre .eq('id', user.id) — usando UUID do Supabase Auth.

4. Design System

(As regras de design system permanecem as mesmas: Nunito Sans, Cores Blue-Clinico, Alertas Semânticos, e Proibições absolutas de "div soup" e gradientes).

5. Fluxo Operacional e Regras de Negócio Inegociáveis

Regra

Detalhe

Mandado Judicial fura a fila

nivel_prioridade = 'Mandado Judicial' sempre no topo.

3 faltas consecutivas = alerta

faltas_consecutivas >= 3 dispara alerta de desligamento.

Laudo vencido não bloqueia evolução

Apenas bloqueia exportação BPA.

Logs de auditoria imutáveis

Toda alteração gera registro em agendamentos_logs.

Proibido registros futuros em massa

Apenas vagas_fixas como regra, sem instanciar slots no banco antes do fato.

SOFT DELETE OBRIGATÓRIO (LGPD/SUS)

Nenhum registo no banco de dados sofre a instrução SQL DELETE. Tudo é resolvido mudando a coluna de status (ex: ativo = false, status_cadastro = 'Inativo'). Apagar dados do SUS destrói o histórico de auditoria.

Proteção contra Race Conditions

Se duas recepcionistas marcarem a presença de um paciente exato no mesmo segundo, o banco de dados (via UNIQUE constraint de paciente_id + data_hora_inicio na materialização) ou um Lock Otimista deve rejeitar a segunda transação.

6. Motor de Agendamento Dinâmico (lib/agenda-utils.ts)

Como funciona:

vagas_fixas armazena apenas a regra (dia da semana, horário, vigência).

O motor gera sessões on-the-fly para exibição.

Para cada slot: busca se já existe materialização em agendamentos_historico.

Se existe → usa os dados reais.

Se não existe → cria sessão virtual com status: 'Projetado'.

Materialização: Ocorre APENAS ao registrar presença, falta, salvar evolução ou remarcar.

7. Banco de Dados e Esquema de Tabelas

(Todas as tabelas pacientes, linhas_cuidado_especialidades, profissionais, grade_horaria, fila_espera, vagas_fixas, agendamentos_historico, agendamentos_logs e avaliacoes_servico_social mantêm a estrutura atual detalhada na v7).

Nota Arquitetural sobre o Banco: Qualquer trigger, função ou RLS alterado via código Python deve garantir que o Supabase Client do Next.js consiga ler a informação sem quebra de tipagem. Os Schemas do Zod (lib/validations/schema.ts) devem refletir 1:1 com as Views e Tabelas.

8. Template para Nova Feature e Formulários

Sequência obrigatória ao implementar qualquer funcionalidade nova (Aplicando a Regra de SSoT):

Verifique se o componente visual já existe em components/ui. Não o recrie.

Schema Zod em lib/validations/schema.ts (Validar a tipagem do BD).

Server Actions em actions/index.ts (com revalidatePath e try/catch).

Server Component em app/(authenticated)/[rota]/page.tsx (busca dados paginados via URL params, passa props).

Client Component em components/[modulo]/ (recebe props, formulário com React Hook Form + validação).

8.1 Padrão de Página Seguro

// ✅ CORRETO — Recebe searchParams para Paginação e Filtros
export default async function MinhaPage({ searchParams }: { searchParams: { page?: string, query?: string } }) {
const page = Number(searchParams.page) || 1
// Função que engloba o Supabase .range(from, to) internamente
const { dados, totalCount } = await buscarDadosPaginados(page, searchParams.query)

return (
<div className="p-6 space-y-8">
<div className="flex items-center justify-between">
<div>
<h1 className="text-2xl font-bold text-foreground">Título</h1>
</div>
</div>
<DataTable data={dados} total={totalCount} currentPage={page} />
</div>
)
}

9. Armadilhas Conhecidas do Cursor/IA (Checklist Pós-Geração)

Regras Absolutas. A IA deve parar e verificar isso antes de dar a resposta:

Existe lógica de negócio repetida no componente que eu acabei de criar? (Se sim, extrair para um utilitário exportável).

Eu usei um <input type="date"> padrão nativo? (Obrigatório, não usar customizações pesadas que quebram o mobile).

A query do Supabase que escrevi tem .range() ou .limit()? (Proibido buscar milhares de registos sem limite).

Eu usei um DELETE no backend/action? (Se sim, apagar e substituir por update({ status: 'Inativo' })).

A FK do utilizador está a usar .eq('id', user.id)? (Proibido usar email).

Eu introduzi algum any no TypeScript? (Reescrever tipando corretamente).
