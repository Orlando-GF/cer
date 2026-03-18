# contexto.md — Sistema de Gestão CER 2 SUS

> **Arquivo mestre do projeto.** Lido pela IA antes de qualquer geração de
> código. Contém stack, padrões, design system, banco de dados, regras de
> negócio e estado real da implementação. Atualizado em 17/03/2026.

---

## 1. Visão Geral

Sistema web para substituir software legado em VBA no **CER 2 — Centro
Especializado em Reabilitação Aníbal Barbora Filho**, vinculado ao SUS em
Barreiras/BA. Gerencia mais de 8.000 prontuários com foco em terapias
contínuas (Autismo/TEA, Neurologia, Fonoaudiologia, Fisioterapia, Terapia
Ocupacional, Serviço Social, Psicologia, Nutrição) e dispensação de OPM.

**Problema central:** Crise de judicialização por falta de rastreabilidade
da fila de espera. O sistema deve provar, com logs auditáveis, que a ordem
de atendimento respeita as prioridades legais.

**Objetivo do MVP:**

1. Fila de espera transparente e auditável com prioridade para mandados judiciais
2. Agenda inteligente com vagas fixas recorrentes (sem poluir o banco com registros futuros)
3. Controle de absenteísmo com alerta automático aos 3 faltas consecutivas
4. Prontuário digital substituindo os formulários físicos descritos na Seção 13

**Endereço do CER:**
Rua Nossa Senhora da Conceição, 905, São Miguel — CEP: 47.800-486, Barreiras/BA
Telefone: (77) 3613-4415 / 9540 — cer2barreirasdm@gmail.com

---

## 2. Stack Tecnológica

| Camada         | Tecnologia                    | Observação                                         |
| -------------- | ----------------------------- | -------------------------------------------------- |
| Framework      | Next.js 15 (App Router)       | Server Components por padrão                       |
| UI             | React 19 + TypeScript estrito | Proibido `any`                                     |
| Estilo         | Tailwind CSS v4               | Apenas variáveis semânticas do design system       |
| Primitivas UI  | Base UI (`@base-ui/react`)    | Tabs, Button                                       |
| Componentes    | shadcn/ui                     | Card, Table, Sheet, Dialog, Select, etc.           |
| Banco de dados | Supabase — PostgreSQL         | Região obrigatória: `sa-east-1` (São Paulo / LGPD) |
| Auth           | Supabase Auth + RLS           | Row Level Security em todas as tabelas             |
| Validação      | Zod                           | Formulários e Server Actions                       |
| Formulários    | React Hook Form + Zod         | —                                                  |
| Animações      | Framer Motion                 | Apenas onde agrega valor real ao usuário           |
| Fonte          | Nunito Sans                   | Via `next/font/google`                             |

---

## 3. Regras de Código — OBRIGATÓRIAS

A IA deve gerar código seguindo estas regras sem exceção. Violações devem
ser corrigidas antes de qualquer entrega.

### 3.1 TypeScript Estrito

- Proibido `any` — use tipos explícitos ou `unknown`
- Toda função com tipos de entrada e saída declarados
- Interfaces de props obrigatórias em todos os componentes

```ts
// ✅ Correto
interface SessaoCardProps {
  pacienteNome: string
  especialidade: string
  horaInicio: Date
  status: 'Projetado' | 'Presente' | 'Falta Nao Justificada'
}

// ❌ Proibido
const SessaoCard = (props: any) => { ... }
```

### 3.2 Arquitetura Server-First (Next.js App Router)

- Server Components por padrão
- `'use client'` apenas quando há interatividade (hooks de estado/efeito)
- Mutação de dados via Server Actions (`'use server'`)
- **Estado de UI** (filtros, paginação, abas): `searchParams` na URL — nunca `useState`
- **Proibido `useEffect` para buscar dados** — usar Server Components
- Dados buscados no Server Component da página e passados como props para Client Components

```tsx
// ✅ Correto — page.tsx (Server Component)
export default async function FilaPage() {
  const pacientes = await buscarFilaEspera()
  return <FilaDataTable data={pacientes} />
}

// ❌ Proibido — buscar dados no cliente
useEffect(() => { fetch('/api/fila').then(...) }, [])
```

### 3.3 Guard Clauses (Early Returns)

Sem aninhamento profundo. Erros tratados no início da função.

```ts
// ✅ Correto
async function processarFalta(agendamentoId: string) {
  if (!agendamentoId) return { error: 'ID obrigatório' }
  const agendamento = await buscarAgendamento(agendamentoId)
  if (!agendamento) return { error: 'Não encontrado' }
  if (agendamento.status === 'Cancelado') return { error: 'Já cancelado' }
  // lógica principal sem aninhamento
}
```

### 3.4 Comentários Estratégicos

Comentar o **porquê** da regra de negócio, nunca o quê.

```ts
// ❌ Proibido — óbvio
const total = faltas.length

// ✅ Correto — explica a regra SUS
// 3 faltas injustificadas consecutivas disparam alerta de desligamento
// conforme protocolo de absenteísmo do CER (regra operacional SUS)
const deveAlertarDesligamento = faltasConsecutivas >= 3
```

### 3.5 Separação de Preocupações (SoC)

Lógica de acesso a dados (Supabase) nunca dentro de componentes de UI.

```
src/
  app/          → rotas e páginas (Server Components)
  components/   → UI sem lógica de dados
  lib/          → utilitários, motor de agenda, access-control
  actions/      → Server Actions ('use server')
  types/        → interfaces TypeScript e schemas Zod
  utils/        → clientes Supabase (client, server, middleware)
```

### 3.6 Validação com Zod

Todo formulário e toda Server Action validam com Zod.
Schemas em `lib/validations/schema.ts`, tipos inferidos com `z.infer<>`.

### 3.7 Nomenclatura

- **Componentes:** PascalCase — `PacienteSheet`, `FilaDataTable`
- **Funções/variáveis:** camelCase — `buscarPaciente`, `totalFaltas`
- **Constantes globais:** UPPER_SNAKE_CASE — `MAX_FALTAS_CONSECUTIVAS`
- **Arquivos:** kebab-case — `paciente-sheet.tsx`, `agenda-utils.ts`
- Proibido: `data`, `info`, `tmp`, `obj`, `res2`, abreviações obscuras

### 3.8 HTML Semântico

Proibido "div soup". Usar `<main>`, `<section>`, `<article>`, `<nav>`,
`<header>`, `<aside>`. Elementos interativos com `aria-label`. Formulários
com `<label htmlFor>`.

### 3.9 Formatação (Prettier)

```ts
// prettier.config.ts
export default {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  printWidth: 80,
  plugins: ['prettier-plugin-tailwindcss'],
}
```

Ordem obrigatória de blocos: `imports externos` → `imports internos` →
`tipos` → `constantes` → `lógica` → `retorno/export`

### 3.10 Supabase via MCP (Idempotência)

- `CREATE TYPE IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`
- Respeitar ordem de FK (seção 10)
- RLS ativado em todas as tabelas
- Nunca usar `useEffect` em client para chamar Server Actions — usar `startTransition` ou eventos

---

## 4. Design System

### 4.1 Tipografia — Nunito Sans

```ts
// layout.tsx
import { Nunito_Sans } from 'next/font/google'

const nunitoSans = Nunito_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '600'],
})
```

```tsx
<body className={`${nunitoSans.variable} antialiased`}>
```

| Uso                                  | Tamanho | Peso                             |
| ------------------------------------ | ------- | -------------------------------- |
| Títulos de página / nome do paciente | 20px    | 600                              |
| Labels de formulário                 | 11–13px | 600 + uppercase + letter-spacing |
| Corpo de texto e evoluções clínicas  | 14px    | 400 / line-height: 1.65          |
| Dados secundários                    | 13px    | 400                              |
| Microlabels (badges, status)         | 11px    | 600                              |

> **Regra crítica:** dados numéricos (CNS, CPF, horários, contadores) devem
> usar a classe `tabular-nums` para alinhamento vertical exato em tabelas.

### 4.2 Paleta de Cores

Proibido usar classes Tailwind genéricas (`blue-600`, `slate-800`, `white`).
Usar **sempre** as variáveis CSS semânticas abaixo.

#### Primária — Azul Clínico

| Token CSS             | Hex       | Uso principal                                    |
| --------------------- | --------- | ------------------------------------------------ |
| `--color-primary-50`  | `#E8F1FB` | Fundos suaves, container de tabs, hover de linha |
| `--color-primary-100` | `#C8D9EE` | Bordas, divisores, skeleton shimmer              |
| `--color-primary-300` | `#5A9BD4` | Ícones ativos, item de menu ativo na sidebar     |
| `--color-primary`     | `#1A5FA8` | Botão primário, links, focus ring                |
| `--color-primary-800` | `#0F3D72` | Hover do botão primário                          |
| `--color-primary-900` | `#0F2D52` | Fundo da sidebar, texto de títulos               |

#### Neutros — Interface

| Token CSS            | Hex       | Uso                                        |
| -------------------- | --------- | ------------------------------------------ |
| `--color-background` | `#F0F5FB` | Fundo geral da página                      |
| `--color-card`       | `#FFFFFF` | Fundo de cartões, inputs, tab ativa        |
| `--color-foreground` | `#0F2D52` | Texto principal                            |
| `--color-muted`      | `#5A7FA8` | Texto secundário, subtítulos, placeholders |
| `--color-border`     | `#C8D9EE` | Bordas de inputs e cartões                 |

#### Alertas Semânticos (SUS)

| Situação                         | Background token                     | Texto token                            |
| -------------------------------- | ------------------------------------ | -------------------------------------- |
| Laudo vencido / Mandado / Falta  | `--color-alert-danger-bg` `#FEE2E2`  | `--color-alert-danger-text` `#991B1B`  |
| Aguardando / Pendente            | `--color-alert-warning-bg` `#FEF3C7` | `--color-alert-warning-text` `#92400E` |
| Em atendimento / Alta / Presente | `--color-alert-success-bg` `#D1FAE5` | `--color-alert-success-text` `#065F46` |
| Atendimento compartilhado        | `--color-alert-shared-bg` `#EDE9FE`  | `--color-alert-shared-text` `#4C1D95`  |

### 4.3 Mapeamento de Cores por Componente

#### Sidebar

| Elemento                       | Valor                             |
| ------------------------------ | --------------------------------- |
| Fundo                          | `--color-primary-900` (`#0F2D52`) |
| Texto dos itens                | `#FFFFFF` 70% opacidade           |
| Item ativo                     | `--color-primary-300` (`#5A9BD4`) |
| Labels de seção (ATENDIMENTO…) | `#FFFFFF` 40% opacidade           |
| Separadores                    | `#FFFFFF` 10% opacidade           |

#### Botões

| Variante             | Fundo                     | Texto                       | Hover fundo           |
| -------------------- | ------------------------- | --------------------------- | --------------------- |
| `default` (primário) | `--color-primary`         | `#FFFFFF`                   | `--color-primary-800` |
| `outline`            | `--color-card`            | `--color-foreground`        | `--color-primary-50`  |
| `ghost`              | transparente              | `--color-foreground`        | `--color-primary-50`  |
| `destructive`        | `--color-alert-danger-bg` | `--color-alert-danger-text` | —                     |

#### Tabs (variante `agenda`)

| Elemento             | Valor                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| Container (TabsList) | `--color-primary-50` com borda `--color-primary-100`                  |
| Tab inativa          | texto `--color-muted`                                                 |
| Tab ativa            | fundo `--color-card`, texto `--color-primary`, borda `--color-border` |

#### Inputs e Formulários

| Estado | Fundo                     | Borda                       |
| ------ | ------------------------- | --------------------------- |
| Normal | `--color-card`            | `--color-border`            |
| Focus  | `--color-card`            | `--color-primary` (ring)    |
| Erro   | `--color-alert-danger-bg` | `--color-alert-danger-text` |

#### Tabelas

| Elemento       | Valor                                                  |
| -------------- | ------------------------------------------------------ |
| Header         | fundo `--color-primary-50`, texto `--color-foreground` |
| Linha hover    | `--color-primary-50`                                   |
| Borda inferior | `--color-border`                                       |

#### Badges de Status

| Status                    | Fundo                      | Texto                        |
| ------------------------- | -------------------------- | ---------------------------- |
| AGUARDANDO                | `--color-alert-warning-bg` | `--color-alert-warning-text` |
| EM ATENDIMENTO / PRESENTE | `--color-alert-success-bg` | `--color-alert-success-text` |
| FALTA / LAUDO VENCIDO     | `--color-alert-danger-bg`  | `--color-alert-danger-text`  |
| COMPARTILHADO             | `--color-alert-shared-bg`  | `--color-alert-shared-text`  |

#### Outros componentes

| Componente         | Elemento     | Valor                                                |
| ------------------ | ------------ | ---------------------------------------------------- |
| Dropdown/Select    | Painel fundo | `--color-card`                                       |
| Dropdown/Select    | Item hover   | `--color-primary-50`                                 |
| Dropdown/Select    | Sombra       | `0 4px 16px rgba(15,45,82,0.08)`                     |
| Slide-over (Sheet) | Overlay      | `rgba(15,45,82,0.4)`                                 |
| Slide-over (Sheet) | Header fundo | `--color-primary-50`                                 |
| Tooltip            | Fundo        | `--color-primary-900` / texto `#FFFFFF`              |
| Toast sucesso      | —            | `--color-alert-success-*` + borda esq. `4px solid`   |
| Toast erro         | —            | `--color-alert-danger-*` + borda esq. `4px solid`    |
| Skeleton           | Base         | `--color-primary-50` / shimmer `--color-primary-100` |
| Switch ativo       | Track        | `--color-primary`                                    |
| Checkbox marcado   | Fundo        | `--color-primary`                                    |
| Paginação ativa    | Fundo        | `--color-primary` / texto `#FFFFFF`                  |

### 4.4 Scrollbar Global

Aplicado no `globals.css` dentro de `@layer base`:

```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--color-primary-50);
  border-radius: 999px;
}
::-webkit-scrollbar-thumb {
  background: var(--color-primary-100);
  border-radius: 999px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-300);
}
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-primary-100) var(--color-primary-50);
}
```

### 4.5 Sharp Design

Todos os componentes usam `border-radius: 0` (`rounded-none`) por padrão —
cantos retos, visual institucional/clínico. Exceções explícitas: avatares
(`rounded-full`), tooltips (`rounded-md`), toasts (`rounded-lg`).

---

## 5. Perfis de Acesso (RBAC)

| Perfil             | Acesso                                                     |
| ------------------ | ---------------------------------------------------------- |
| `Administracao`    | Tudo                                                       |
| `Recepcao`         | Agenda, Fila, Pacientes, Absenteísmo, Mandados, Relatórios |
| `Enfermagem`       | Agenda, Fila, Pacientes, Meus Atendimentos, Meus Pacientes |
| `Medico_Terapeuta` | Meus Atendimentos, Meus Pacientes, agenda própria          |
| `Motorista`        | Apenas Logística (rotas de transporte, sem dados clínicos) |

RBAC implementado em duas camadas:

1. **Server-side:** `validarAcessoRota()` em `lib/access-control.ts` — redireciona se sem permissão
2. **UI:** Sidebar filtra grupos e itens conforme perfil

---

## 6. Navegação (Sidebar)

```
ATENDIMENTO       → Recepção, Enfermagem
  Painel Geral
  Pacientes
  Fila de Espera
  Agenda Geral

CLÍNICO           → Médicos, Terapeutas, Enfermagem
  Meus Atendimentos
  Meus Pacientes

LOGÍSTICA         → Motoristas
  Rotas de Transporte

GESTÃO E AUDITORIA → Administração, Recepção
  Absenteísmo
  Mandados Judiciais
  Relatórios

CONFIGURAÇÕES     → Administração
  Profissionais & Acessos
  Especialidades
  Grades Horárias
```

---

## 7. Views da Agenda

| View                             | Perfil                       | Função                                                         |
| -------------------------------- | ---------------------------- | -------------------------------------------------------------- |
| **Recepção** (List View)         | Recepção, Enfermagem         | Lista do turno, marcação Presente/Falta, ordem de chegada      |
| **Profissional** (Day View)      | Médico_Terapeuta, Enfermagem | Agenda do dia próprio, inserção de evolução clínica            |
| **Coordenação** (Timeline/Gantt) | Administração, Recepção      | Mapa visual de todos os profissionais, detecção de ociosidade  |
| **Logística** (Route View)       | Motorista                    | Pacientes que precisam de transporte, endereço e tags de risco |
| **Configuração**                 | Administração                | Cadastro e gestão de vagas fixas                               |

---

## 8. Fluxo Operacional

1. **Acolhimento** — Busca rápida (Cmd+K). Se não existe, cadastra com dados
   da Ficha de Acolhimento (CID, equipe técnica, OPMs). Define prioridade e
   Linha de Cuidado → entra na `fila_espera`.

2. **Avaliação Diagnóstica** — Pacientes sem diagnóstico passam por consultas
   de avaliação. O laudo pode disparar inserção em fila de terapias.

3. **Convocação:**
   - **Bloco (médico):** N pacientes agendados com `ordem_chegada` gerada pela recepção
   - **Vaga Fixa (terapia):** Paciente assume "contrato de vaga fixa". Sessões projetadas on-the-fly pelo motor `lib/agenda-utils.ts`, sem gravar registros físicos futuros.

4. **Presença Diária** — Recepção usa a view Recepção. Ao marcar Presente/Falta,
   o sistema "materializa" a sessão em `agendamentos_historico`.

5. **Atendimento** — Profissional acessa a view Profissional, registra evolução
   clínica e define conduta.

6. **Ciclo de Reavaliação (6 meses) — REGRA CRÍTICA:**
   - Alerta vermelho `⚠️ LAUDO VENCIDO` quando `data_ultimo_laudo` > 180 dias
   - O sistema **nunca** bloqueia o profissional de registrar evolução
   - Bloqueia apenas a exportação BPA (faturamento SUS)
   - Paciente é incluído na lista de pendências da coordenação

---

## 9. Regras de Negócio Inegociáveis

| Regra                                        | Detalhe                                                                                                        |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Mandado Judicial fura a fila**             | `nivel_prioridade = 'Mandado Judicial'` sempre no topo, com `numero_processo_judicial` obrigatório             |
| **Filas independentes por especialidade**    | Um paciente pode estar em múltiplas filas simultaneamente                                                      |
| **3 faltas consecutivas = alerta**           | `faltas_consecutivas >= 3` dispara alerta de desligamento                                                      |
| **Laudo vencido não bloqueia evolução**      | Apenas bloqueia exportação BPA                                                                                 |
| **Atendimento compartilhado não é conflito** | Dois profissionais com o mesmo paciente no mesmo horário → exibir `⚠️ Atendimento Compartilhado`, não bloquear |
| **Logs de auditoria imutáveis**              | Toda alteração em `agendamentos_historico` gera registro em `agendamentos_logs`                                |
| **Proibido registros futuros em massa**      | Nunca gerar blocos de agendamentos antecipados. Apenas `vagas_fixas` como regra                                |

---

## 10. Motor de Agendamento Dinâmico

Implementado em `lib/agenda-utils.ts` — função `projectAgendaSessions()`.

**Como funciona:**

- `vagas_fixas` armazena apenas a **regra** (dia da semana, horário, vigência)
- O motor gera sessões **on-the-fly** para exibição, iterando dia a dia no período solicitado
- Para cada slot: busca se já existe materialização em `agendamentos_historico`
  - Se existe → usa os dados reais (status, evolução, etc.)
  - Se não existe → cria sessão virtual com `status: 'Projetado'` e `id: 'proj_...'`
- Detecta `conflito_intensivo` (mesmo paciente, mesmo horário, profissionais diferentes)
- Detecta `laudo_vencido` (> 180 dias sem laudo)
- Adiciona atendimentos avulsos (sem `vaga_fixa_id`)

**Materialização:** Registro físico em `agendamentos_historico` ocorre APENAS ao:

- Registrar presença (`Presente`)
- Registrar falta (`Falta Nao Justificada` ou `Falta Justificada`)
- Salvar evolução clínica
- Cancelar/remarcar sessão

---

## 11. Banco de Dados (Supabase / PostgreSQL)

### 11.1 Ordem de Execução via MCP (obrigatória)

1. ENUMs nativos
2. `linhas_cuidado_especialidades` e `pacientes`
3. `profissionais` (referencia `auth.users`)
4. `grade_horaria`, `fila_espera`, `vagas_fixas`
5. `agendamentos_historico`
6. `agendamentos_logs`, `faltas_registros`
7. `avaliacoes_servico_social`
8. Função `set_updated_at()` + TRIGGERs em todas as tabelas
9. RLS em todas as tabelas

### 11.2 ENUMs

```sql
CREATE TYPE sexo_enum           AS ENUM ('M', 'F', 'Outro');
CREATE TYPE status_cadastro_enum AS ENUM ('Ativo', 'Inativo', 'Obito', 'Alta');
CREATE TYPE tipo_reabilitacao_enum AS ENUM ('Fisica', 'Intelectual', 'Ambas');
CREATE TYPE equipe_tecnica_enum  AS ENUM ('Estimulacao_Precoce', 'Infanto_Juvenil', 'Adulta');
CREATE TYPE nivel_prioridade_enum AS ENUM ('Rotina', 'Urgencia Clinica', 'Mandado Judicial');
CREATE TYPE status_fila_enum     AS ENUM ('Aguardando', 'Em Atendimento', 'Em Risco', 'Desistencia', 'Alta');
CREATE TYPE freq_recomendada_enum AS ENUM ('A definir', 'Semanal', 'Quinzenal', 'Mensal');
CREATE TYPE perfil_acesso_enum   AS ENUM ('Recepcao', 'Enfermagem', 'Medico_Terapeuta', 'Administracao', 'Motorista');
CREATE TYPE status_vaga_enum     AS ENUM ('Ativa', 'Suspensa', 'Encerrada');
CREATE TYPE tipo_atendimento_enum AS ENUM ('Consulta Medica', 'Terapia Continua', 'Dispensacao_OPM', 'Avaliacao_Diagnostica', 'Acolhimento', 'Pedagogico');
CREATE TYPE status_comparecimento_enum AS ENUM ('Agendado', 'Presente', 'Falta Nao Justificada', 'Falta Justificada', 'Cancelado');
CREATE TYPE conduta_enum AS ENUM ('Retorno', 'Alta por Melhoria', 'Alta por Abandono', 'Alta a Pedido', 'Obito/Transferencia', 'Encaminhamento Externo', 'Inserir em Fila de Terapia');
```

> **Atenção:** `status_comparecimento_enum` usa `'Falta Nao Justificada'`
> (sem acento). Esta é a forma canônica em todo o projeto — schema Zod,
> types TS e banco devem estar alinhados.

### 11.3 Tabela: `pacientes`

```sql
CREATE TABLE IF NOT EXISTS pacientes (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identificadores
  numero_prontuario      VARCHAR UNIQUE,          -- Nº sequencial interno do CER
  id_legado_vba          VARCHAR,                 -- Referência ao sistema VBA antigo
  cns                    VARCHAR(15) UNIQUE NOT NULL,
  cpf                    VARCHAR(11) UNIQUE,
  -- Identificação pessoal
  nome_completo          VARCHAR NOT NULL,
  data_nascimento        DATE NOT NULL,
  sexo                   sexo_enum NOT NULL,
  nome_mae               VARCHAR NOT NULL,
  nome_pai               VARCHAR,
  rg                     VARCHAR,
  rg_orgao_exp           VARCHAR,
  estado_civil           VARCHAR,
  naturalidade           VARCHAR,
  profissao              VARCHAR,
  reside_com             VARCHAR,                 -- "Reside com quem?" da Ficha de Acolhimento
  -- Endereço
  endereco_cep           VARCHAR(8),
  logradouro             VARCHAR,
  numero                 VARCHAR,
  bairro                 VARCHAR,
  cidade                 VARCHAR DEFAULT 'Barreiras',
  uf                     VARCHAR(2) DEFAULT 'BA',
  referencia             VARCHAR,
  -- Contatos
  telefone_principal     VARCHAR,
  telefone_secundario    VARCHAR,
  telefone_responsavel   VARCHAR,
  email                  VARCHAR,
  nome_responsavel       VARCHAR,
  -- Clínico
  cid_principal          VARCHAR(10),
  cid_secundario         VARCHAR(10),
  data_ultimo_laudo      DATE,
  tipo_reabilitacao      tipo_reabilitacao_enum,  -- Física | Intelectual | Ambas
  equipe_tecnica         equipe_tecnica_enum,     -- Est. Precoce | Infanto-Juvenil | Adulta
  eletivo                BOOLEAN DEFAULT false,
  -- Logística e Acessibilidade
  necessita_transporte   BOOLEAN DEFAULT false,
  pactuado               BOOLEAN DEFAULT false,
  municipio_pactuado     VARCHAR,
  tags_acessibilidade    VARCHAR[] DEFAULT '{}',
  opms_solicitadas       VARCHAR[] DEFAULT '{}',  -- OPMs da Ficha de Acolhimento
  -- Administrativo
  status_cadastro        status_cadastro_enum DEFAULT 'Ativo',
  observacao_acolhimento TEXT,
  criado_em              TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em          TIMESTAMPTZ DEFAULT NOW()
);
```

**`tags_acessibilidade` — valores válidos:**
`'Cadeirante'`, `'Acamado/Uso de Maca'`, `'Uso de Oxigênio'`,
`'Risco de Agitação Psicomotora'`, `'Deficiência Visual Severa'`, `'Obesidade Severa'`

**`opms_solicitadas` — valores válidos:**
`'Bolsa de Colostomia'`, `'Órtese'`, `'Prótese'`, `'Cadeira de Locomoção'`, `'Cadeira de Banho'`

### 11.4 Tabela: `linhas_cuidado_especialidades`

```sql
CREATE TABLE IF NOT EXISTS linhas_cuidado_especialidades (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_especialidade  VARCHAR NOT NULL,
  equipe_responsavel  VARCHAR,
  linha_reabilitacao  VARCHAR,            -- Campo crucial para faturamento BPA
  tipo_atendimento    tipo_atendimento_enum DEFAULT 'Terapia Continua',
  ativo               BOOLEAN DEFAULT true,
  criado_em           TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.5 Tabela: `profissionais`

```sql
CREATE TABLE IF NOT EXISTS profissionais (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Vinculado ao Supabase Auth (pode ser null para profissionais sem login)
  nome_completo            VARCHAR NOT NULL,
  registro_conselho        VARCHAR,
  cbo                      VARCHAR,
  perfil_acesso            perfil_acesso_enum NOT NULL DEFAULT 'Medico_Terapeuta',
  especialidades_permitidas UUID[] DEFAULT '{}',  -- FK lógica → linhas_cuidado_especialidades
  ativo                    BOOLEAN DEFAULT true,
  criado_em                TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em            TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.6 Tabela: `grade_horaria`

Define a capacidade base por profissional (usado para detecção de ociosidade na view Coordenação).

```sql
CREATE TABLE IF NOT EXISTS grade_horaria (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id  UUID NOT NULL REFERENCES profissionais(id),
  dia_semana       INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  horario_inicio   TIME NOT NULL,
  horario_fim      TIME NOT NULL,
  capacidade       INTEGER NOT NULL DEFAULT 1,
  ativo            BOOLEAN DEFAULT true,
  criado_em        TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em    TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.7 Tabela: `fila_espera`

```sql
CREATE TABLE IF NOT EXISTS fila_espera (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id              UUID NOT NULL REFERENCES pacientes(id),
  especialidade_id         UUID NOT NULL REFERENCES linhas_cuidado_especialidades(id),
  UNIQUE (paciente_id, especialidade_id),         -- Paciente não duplica na mesma fila
  data_entrada_fila        TIMESTAMPTZ DEFAULT NOW(),
  nivel_prioridade         nivel_prioridade_enum DEFAULT 'Rotina',
  numero_processo_judicial VARCHAR,               -- Obrigatório se Mandado Judicial
  origem_encaminhamento    VARCHAR,
  frequencia_recomendada   freq_recomendada_enum DEFAULT 'A definir',
  status_fila              status_fila_enum DEFAULT 'Aguardando',
  faltas_consecutivas      INTEGER DEFAULT 0,
  criado_em                TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em            TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.8 Tabela: `vagas_fixas` — O Contrato Dinâmico

> Esta tabela armazena apenas a **regra de recorrência**. Nunca gera registros
> físicos de atendimentos futuros. O motor `projectAgendaSessions()` a lê
> para projetar a agenda on-the-fly.

```sql
CREATE TABLE IF NOT EXISTS vagas_fixas (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id          UUID NOT NULL REFERENCES pacientes(id),
  profissional_id      UUID NOT NULL REFERENCES profissionais(id),
  especialidade_id     UUID NOT NULL REFERENCES linhas_cuidado_especialidades(id),
  dia_semana           INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  horario_inicio       TIME NOT NULL,
  horario_fim          TIME NOT NULL,
  data_inicio_contrato DATE NOT NULL,
  data_fim_contrato    DATE,                      -- NULL até a alta
  status_vaga          status_vaga_enum DEFAULT 'Ativa',
  criado_em            TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em        TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.9 Tabela: `agendamentos_historico` — Materialização

> Só recebe registros ao materializar uma sessão (presença, falta, evolução).
> Nunca populada antecipadamente.

```sql
CREATE TABLE IF NOT EXISTS agendamentos_historico (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id               UUID NOT NULL REFERENCES pacientes(id),
  profissional_id           UUID NOT NULL REFERENCES profissionais(id),
  especialidade_id          UUID NOT NULL REFERENCES linhas_cuidado_especialidades(id),
  vaga_fixa_id              UUID REFERENCES vagas_fixas(id),  -- NULL se avulso
  data_hora_inicio          TIMESTAMPTZ NOT NULL,
  data_hora_fim             TIMESTAMPTZ,
  status_comparecimento     status_comparecimento_enum DEFAULT 'Agendado',
  evolucao_clinica          TEXT,
  conduta                   conduta_enum,
  tipo_vaga                 VARCHAR DEFAULT 'Regular',        -- 'Regular' | 'Bloco' | 'Avulso'
  tipo_agendamento          VARCHAR DEFAULT 'Individual',     -- 'Individual' | 'Compartilhado'
  ordem_chegada             INTEGER,                          -- Para atendimentos em bloco
  confirmado_pelo_paciente  BOOLEAN DEFAULT false,            -- Substituto digital da assinatura
  criado_em                 TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em             TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.10 Tabela: `agendamentos_logs` — Auditoria Imutável

```sql
CREATE TABLE IF NOT EXISTS agendamentos_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id   UUID NOT NULL REFERENCES agendamentos_historico(id),
  usuario_id       UUID,                    -- auth.users.id
  acao             VARCHAR NOT NULL,        -- 'CRIAR' | 'EDITAR' | 'CANCELAR'
  dados_anteriores JSONB,
  dados_novos      JSONB,
  criado_em        TIMESTAMPTZ DEFAULT NOW()
  -- Sem atualizado_em — logs são imutáveis por definição
);
```

### 11.11 Tabela: `faltas_registros`

```sql
CREATE TABLE IF NOT EXISTS faltas_registros (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fila_id         UUID NOT NULL REFERENCES fila_espera(id),
  justificada     BOOLEAN DEFAULT false,
  observacao      TEXT,
  registrado_por  UUID,                    -- auth.users.id
  data_falta      DATE DEFAULT CURRENT_DATE,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.12 Tabela: `avaliacoes_servico_social`

```sql
CREATE TABLE IF NOT EXISTS avaliacoes_servico_social (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id           UUID NOT NULL REFERENCES pacientes(id),
  profissional_id       UUID NOT NULL REFERENCES profissionais(id),
  data_avaliacao        DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Dados socioeconômicos (da Avaliação SS física)
  raca                  VARCHAR,
  religiao              VARCHAR,
  grau_instrucao        VARCHAR,
  ponto_referencia      VARCHAR,
  -- Incapacidade
  incapacidade_avd      TEXT,
  tempo_incapacidade    VARCHAR,
  tempo_sem_trabalhar   VARCHAR,
  ocupacao_antes_lesao  VARCHAR,
  -- Narrativa
  relatorio_social      TEXT,
  criado_em             TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em         TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 12. Schemas Zod — Estado Atual

Definidos em `lib/validations/schema.ts`. Manter alinhados com a tabela de banco.

**Enums Zod canônicos:**

```ts
export const StatusComparecimentoEnum = z.enum([
  'Agendado',
  'Presente',
  'Falta Nao Justificada',
  'Falta Justificada',
  'Cancelado',
])
// ⚠️ Usar SEMPRE 'Falta Nao Justificada' — nunca 'Falta Injustificada'
```

**Schemas existentes:** `pacienteSchema`, `filaEsperaSchema`, `incluirNaFilaSchema`,
`vagaFixaSchema`, `agendamentoHistoricoSchema`, `profissionalSchema`,
`especialidadeSchema`, `gradeHorariaSchema`

**Schemas a criar:** `avaliacaoServicoSocialSchema`

**Transforms obrigatórios no `pacienteSchema`:**

- `cns` → `digitsOnly` → validar 15 dígitos
- `cpf` → `digitsOnly` → validar 11 dígitos
- `nome_completo`, `nome_mae`, `nome_pai` → `formatarNomeClinico()`
- `cid_principal`, `cid_secundario` → `.trim().toUpperCase()`

---

## 13. Auditoria do Código Atual

> Análise do código-fonte real em `/src`, realizada em 17/03/2026.

### 13.1 Implementado e Correto ✅

- `globals.css` — paleta, tokens CSS, scrollbar, compatibilidade shadcn
- `layout.tsx` — Nunito Sans, header fixo, CommandMenu
- `types/index.ts` — interfaces completas para entidades principais
- `actions/index.ts` — padrão `ActionResponse<T>`, Zod, guard clauses, revalidatePath, log de auditoria
- `lib/agenda-utils.ts` — motor dinâmico: projeção, merge com histórico, `conflito_intensivo`, laudo vencido
- `lib/validations/schema.ts` — schemas Zod com transforms e enums
- `lib/access-control.ts` — RBAC por rota, redirect se sem perfil
- `components/ui/tabs.tsx` — variante `agenda` correta, seletores resilientes
- `components/ui/button.tsx` — Base UI, todas as variantes, `rounded-none`
- `components/app-sidebar.tsx` — RBAC na UI, skeleton de loading, grupos corretos
- `agendamentos/page.tsx` — Server Component, profissionais carregados server-side
- DataTables — filtros via URL, sem `useState` para estado de filtros

### 13.2 Dívidas Técnicas ⚠️

**CRÍTICO — Viola regras do projeto:**

| #   | Arquivo                                   | Problema                                                                 | Solução                                                                       |
| --- | ----------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| 1   | `lib/agenda-utils.ts` linha 12            | `vagasFixas: any[]`, `historico: any[]`                                  | Criar `VagaFixaComJoins` e `AgendamentoHistoricoComJoins` em `types/index.ts` |
| 2   | `components/app-sidebar.tsx`              | `useEffect` para `getMeuPerfil()` — viola regra 3.2                      | Buscar perfil no `layout.tsx` (Server Component) e passar como prop           |
| 3   | `components/agenda/view-configuracao.tsx` | `useEffect` para carregar profissionais/especialidades                   | Receber como props do Server Component                                        |
| 4   | `components/agenda/view-profissional.tsx` | `(sessao as any).tags_acessibilidade`                                    | `tags_acessibilidade` já existe em `AgendaSession` — remover cast             |
| 5   | Múltiplos componentes                     | `alert()` nativo em view-profissional, view-recepcao, view-configuracao  | Implementar `sonner` ou Toast do shadcn                                       |
| 6   | `schema.ts` vs `types/index.ts`           | Enum inconsistente: `'Falta Injustificada'` vs `'Falta Nao Justificada'` | Padronizar para `'Falta Nao Justificada'` em todos os arquivos                |

**MÉDIO — Inconsistências de design:**

| #   | Problema                                                             | Solução                                                     |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| 7   | `app/page.tsx` usa `bg-white`, `rounded-xl`, `text-slate-900`        | Substituir por `bg-card`, `rounded-none`, `text-foreground` |
| 8   | `view-coordenacao.tsx` e `view-logistica.tsx` usam classes `slate-*` | Usar variáveis CSS do design system                         |
| 9   | `text-[20px]` hardcoded em view-profissional e view-recepcao         | Usar `text-lg`                                              |
| 10  | Card "Resumo do Dia" usa `from-blue-600 to-blue-800`                 | Usar `bg-primary`                                           |

### 13.3 Funcionalidades Pendentes 🔲

| Prioridade | Módulo                                                | Observação                                              |
| ---------- | ----------------------------------------------------- | ------------------------------------------------------- |
| 🔴 ALTA    | Página `/login`                                       | `redirect('/login')` referenciado mas página não existe |
| 🔴 ALTA    | Toast/Notification system                             | Substituir `alert()` nativo em 3 componentes            |
| 🔴 ALTA    | Busca de paciente por nome/CNS em `ViewConfiguracao`  | Campo UUID temporário                                   |
| 🔴 ALTA    | `paciente-sheet-master.tsx` — prontuário completo     | Arquivo existe, conteúdo incompleto                     |
| 🟡 MÉDIA   | Refactor `AppSidebar` para receber `perfil` como prop | Eliminar `useEffect` proibido                           |
| 🟡 MÉDIA   | Página `/meus-atendimentos`                           | Página existe, sem conteúdo real                        |
| 🟡 MÉDIA   | Página `/meus-pacientes`                              | Página existe, sem conteúdo real                        |
| 🟡 MÉDIA   | Página `/absenteismo`                                 | Action `buscarAlertasAbsenteismo` pronta ✅             |
| 🟡 MÉDIA   | `ViewConfiguracao` — listar vagas ativas              | Placeholder atual                                       |
| 🟢 BAIXA   | Página `/judiciais`                                   | Estrutura de dados disponível                           |
| 🟢 BAIXA   | Página `/relatorios` e exportação BPA                 | Alta complexidade                                       |

---

## 14. Documentos Físicos Mapeados

> Fotografias dos formulários reais usados atualmente no CER II (17/03/2026).
> O sistema deve digitalizar integralmente estes documentos.

| Documento                             | Status de Digitalização                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Ficha de Acolhimento**              | ✅ Parcialmente — campos `equipe_tecnica`, `tipo_reabilitacao`, `opms_solicitadas`, `eletivo` adicionados ao modelo (seção 11.3) |
| **Folha de Evolução**                 | ✅ Coberta por `agendamentos_historico.evolucao_clinica`                                                                         |
| **Controle de Frequência Individual** | ✅ Coberto pela view Recepção + materialização de sessões                                                                        |
| **Avaliação: Serviço Social**         | 🔲 Pendente — tabela `avaliacoes_servico_social` modelada (seção 11.12)                                                          |

**Campos confirmados pelos documentos físicos e incorporados ao modelo:**

- `numero_prontuario` — Nº sequencial interno do CER
- `equipe_tecnica` — Estimulação Precoce / Infanto-Juvenil / Adulta
- `tipo_reabilitacao` — Física / Intelectual / Ambas
- `opms_solicitadas` — lista de OPMs solicitadas no acolhimento
- `profissao`, `reside_com`, `email` — da Ficha de Acolhimento
- `eletivo` — atendimento eletivo S/N
- `confirmado_pelo_paciente` em `agendamentos_historico` — substituto digital da assinatura do paciente na lista de frequência (obrigação legal)

---

## 15. Template para Nova Feature

Sequência obrigatória ao implementar qualquer funcionalidade nova:

1. **Schema Zod** em `lib/validations/schema.ts`
2. **Tipos TypeScript** em `types/index.ts`
3. **Server Actions** em `actions/index.ts` (com `revalidatePath`)
4. **Server Component** da página em `app/[rota]/page.tsx` — busca dados, passa props
5. **Client Component** em `components/[modulo]/` — recebe props, lida com UI interativa
6. Nunca `useEffect` para buscar dados
7. Nunca `useState` para filtros — usar URL (`searchParams`)
8. Nunca `alert()` — usar toast
9. Nunca classes `slate-*`, `blue-*`, `white` — usar variáveis CSS do design system
