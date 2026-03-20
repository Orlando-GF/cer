# contexto.md — Sistema de Gestão CER 2 SUS

> **Arquivo mestre do projeto.** Lido pela IA antes de qualquer geração de
> código. Contém stack, padrões, design system, banco de dados, regras de
> negócio e estado real da implementação. Atualizado em 19/03/2026.

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

### 3.11 Queries Supabase — Padrões Obrigatórios

```ts
// ❌ Proibido — carrega todos os campos de todas as linhas
supabase.from('pacientes').select('*')

// ✅ Correto — selecionar apenas os campos usados na UI
supabase
  .from('pacientes')
  .select('id, nome_completo, cns, data_nascimento, status_cadastro')
```

- **Nunca usar `select('*')`** em tabelas grandes — listar explicitamente os campos necessários
- **FK de usuário autenticado** é sempre `.eq('id', user.id)` — a tabela `profissionais` usa a UUID do Supabase Auth como PK, **não email**
- Queries independentes na mesma page devem usar `Promise.all([])` — nunca `await` sequencial
- Usar `{ count: 'exact', head: true }` para contagens — nunca buscar linhas só para contar

### 3.12 React.cache para Dados de Sessão

Funções que buscam dados do usuário logado (perfil, permissões) devem usar `cache` do React
para evitar round-trips duplicados dentro do mesmo render tree (layout + page):

```ts
import { cache } from 'react'

// ✅ Correto — executa 1x por request, mesmo chamado em layout E page
export const getMeuPerfil = cache(async (): Promise<DadosUsuario | null> => {
  // ...
})
```

### 3.13 Input de Busca com Debounce

Inputs de busca que atualizam URL **não devem** chamar `router.replace()` diretamente no `onChange`.
Isso causa re-render a cada tecla, perda de foco e letras puladas.

Padrão obrigatório para inputs de busca com URL:

```tsx
// ❌ Proibido — re-render a cada tecla
<Input value={searchTerm} onChange={(e) => setUrlParams({ q: e.target.value })} />

// ✅ Correto — estado local + debounce de 300ms
const [inputValue, setInputValue] = useState(searchTerm)

useEffect(() => {
  const timer = setTimeout(() => setUrlParams({ q: inputValue || null }), 300)
  return () => clearTimeout(timer)
}, [inputValue])

<Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
```

> Inputs que filtram dados locais em memória (ex: `MeusPacientesList`) podem usar
> `useState` diretamente sem debounce — o re-render é local e não causa navegação.

---

## 4. Design System

### 4.1 Tipografia — Nunito Sans

```ts
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

| Uso                                  | Tamanho | Peso                                  |
| ------------------------------------ | ------- | ------------------------------------- |
| Títulos de página / nome do paciente | 20px    | 600                                   |
| Labels de formulário                 | 11–13px | 600 + `uppercase` + `tracking-widest` |
| Corpo de texto e evoluções clínicas  | 14px    | 400 / `leading-relaxed`               |
| Dados secundários                    | 13px    | 400                                   |
| Microlabels (badges, status)         | 11px    | 600                                   |

**Proibições tipográficas absolutas:**

```
❌ italic          — proibido em todo o sistema. Visual clínico exige clareza.
❌ font-light      — proibido. Apenas peso 400 e 600.
❌ font-thin       — proibido.
❌ text-primary-900 como COR DE TEXTO — esse token é exclusivo para fundos escuros
                    (sidebar e SheetHeader). Como texto produz azul igual ao sidebar.
                    Para títulos escuros: usar text-foreground.
```

> `tabular-nums` obrigatório em dados numéricos (CNS, CPF, horários, contadores) em tabelas.

### 4.2 Paleta de Cores

**Proibido** qualquer ramp numérico do Tailwind que não esteja na tabela abaixo:
`slate-*`, `blue-*`, `green-*`, `red-*`, `amber-*`, `emerald-*`, `gray-*`, `white`, `black`.
Se não está na tabela de tokens do projeto, não usar.

#### Primária — Azul Clínico

| Token                                    | Hex       | Uso exclusivo                                                                                                              |
| ---------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--color-primary-50` / `bg-primary-50`   | `#E8F1FB` | Hover de linhas, container de tabs, fundos suaves                                                                          |
| `--color-primary-100` / `bg-primary-100` | `#C8D9EE` | Bordas, divisores, skeleton shimmer                                                                                        |
| `--color-primary-300` / `bg-primary-300` | `#5A9BD4` | Ícone ativo na sidebar                                                                                                     |
| `--color-primary` / `bg-primary`         | `#1A5FA8` | Botão primário, links, focus ring                                                                                          |
| `--color-primary-800` / `bg-primary-800` | `#0F3D72` | Hover do botão primário **somente**                                                                                        |
| `--color-primary-900` / `bg-clinico-900` | `#0F2D52` | **APENAS** fundo da sidebar e SheetHeader. Proibido como fundo em qualquer outro elemento. **Proibido como cor de texto.** |

#### Neutros — Interface

| Token                                  | Hex       | Uso                                                                    |
| -------------------------------------- | --------- | ---------------------------------------------------------------------- |
| `bg-background`                        | `#F0F5FB` | Fundo geral da página                                                  |
| `bg-card`                              | `#FFFFFF` | Cards, inputs, tab ativa, corpo de Sheets                              |
| `text-foreground`                      | `#0F2D52` | **Texto** principal — nunca usar como fundo (`bg-foreground` proibido) |
| `text-muted-foreground` / `text-muted` | `#5A7FA8` | Texto secundário, subtítulos, placeholders                             |
| `border-border`                        | `#C8D9EE` | Bordas de inputs e cartões                                             |

#### Alertas Semânticos — tokens obrigatórios para status

| Situação                               | Background                      | Texto                               |
| -------------------------------------- | ------------------------------- | ----------------------------------- |
| Falta / Laudo vencido / Mandado / Erro | `bg-alert-danger-bg` `#FEE2E2`  | `text-alert-danger-text` `#991B1B`  |
| Aguardando / Pendente / Aviso          | `bg-alert-warning-bg` `#FEF3C7` | `text-alert-warning-text` `#92400E` |
| Presente / Ativo / Sucesso             | `bg-alert-success-bg` `#D1FAE5` | `text-alert-success-text` `#065F46` |
| Compartilhado / Info especial          | `bg-alert-shared-bg` `#EDE9FE`  | `text-alert-shared-text` `#4C1D95`  |
| Neutro / Inativo / Projetado           | `bg-muted`                      | `text-muted-foreground`             |

> **Nunca usar `green-*` ou `red-*` hardcoded para estados de sucesso/erro.**
> Sempre usar os tokens `alert-success-*` e `alert-danger-*` acima.

### 4.3 Mapeamento por Componente

#### Badges de Status — regra crítica

Badges de status **nunca** usam `variant="default"` (azul primário é para ações, não estados).
Usar sempre classes semânticas diretas:

```tsx
// ✅ Profissional Ativo/Inativo
<Badge className={`rounded-none border-none font-bold text-[10px] uppercase tracking-widest ${
  prof.ativo
    ? 'bg-alert-success-bg text-alert-success-text'
    : 'bg-muted text-muted-foreground'
}`}>

// ✅ Status de comparecimento
// Presente      → bg-alert-success-bg text-alert-success-text
// Falta         → bg-alert-danger-bg text-alert-danger-text
// Aguardando    → bg-alert-warning-bg text-alert-warning-text
// Compartilhado → bg-alert-shared-bg text-alert-shared-text
// Neutro        → bg-muted text-muted-foreground
```

#### Sidebar

| Elemento        | Classe                                         |
| --------------- | ---------------------------------------------- |
| Fundo           | `bg-sidebar` (token `--color-primary-900`)     |
| Texto dos itens | `text-sidebar-foreground` (branco 70%)         |
| Item ativo      | `text-sidebar-primary` (`--color-primary-300`) |
| Labels de seção | `text-sidebar-foreground/40`                   |
| Hover item      | `hover:bg-sidebar-accent`                      |

#### Botões

| Variante      | Fundo               | Hover                     | Texto                           |
| ------------- | ------------------- | ------------------------- | ------------------------------- |
| `default`     | `bg-primary`        | `hover:bg-primary/90`     | `text-white`                    |
| `outline`     | `bg-background`     | `hover:bg-muted`          | `text-foreground`               |
| `ghost`       | transparente        | `hover:bg-muted`          | `text-foreground`               |
| `destructive` | `bg-destructive/10` | `hover:bg-destructive/20` | `text-destructive`              |
| `disabled`    | —                   | sem hover                 | `opacity-70 cursor-not-allowed` |

#### Tabelas

| Elemento              | Classe                                            |
| --------------------- | ------------------------------------------------- |
| Header                | `bg-primary-50 text-foreground font-medium`       |
| Linha clicável        | `cursor-pointer hover:bg-muted transition-colors` |
| Linha somente leitura | `hover:bg-muted transition-colors`                |

#### Inputs

| Estado   | Fundo                    | Borda                      |
| -------- | ------------------------ | -------------------------- |
| Normal   | `bg-card`                | `border-border`            |
| Focus    | `bg-background`          | ring `border-ring`         |
| Erro     | `bg-alert-danger-bg`     | `border-alert-danger-text` |
| Disabled | `bg-muted/50 opacity-50` | —                          |

#### Sheet / Slide-over

| Elemento              | Classe                                                             |
| --------------------- | ------------------------------------------------------------------ |
| Header                | `bg-clinico-900` — única exceção de `primary-900` fora da sidebar  |
| Texto no header       | `text-white` / subtítulos `text-white/60` / ícones `text-white/70` |
| Botão fechar          | `text-white/50 hover:text-white hover:bg-white/10`                 |
| Corpo                 | `bg-background` ou `bg-card`                                       |
| Footer botão primário | `bg-primary hover:bg-primary/90 text-white`                        |

#### Outros

| Componente          | Classe                                                       |
| ------------------- | ------------------------------------------------------------ |
| Tooltip             | `bg-primary-900 text-white`                                  |
| Skeleton base       | `bg-primary-50` / shimmer `bg-primary-100`                   |
| Switch ativo        | `bg-primary`                                                 |
| Checkbox marcado    | `bg-primary`                                                 |
| Paginação ativa     | `bg-primary text-white`                                      |
| Paginação inativa   | `bg-card border-border text-muted-foreground hover:bg-muted` |
| Dropdown item hover | `focus:bg-primary-50 focus:text-primary`                     |

### 4.4 Regras Absolutas — Lista Completa de Proibições

Aplicar em **todo** elemento gerado, sem exceção:

```
── CORES ──────────────────────────────────────────────────────────────────────
❌ Qualquer ramp numérico Tailwind não listado na seção 4.2
   (slate-*, blue-*, green-*, red-*, amber-*, emerald-*, gray-*, white, black)
❌ bg-foreground  — token de texto, nunca de fundo
❌ bg-clinico-900 / bg-primary-900 fora de: sidebar e SheetHeader
❌ text-primary-900 como cor de texto (usar text-foreground)
❌ variant="default" em Badge de status (azul primário é para ações)
❌ green-* / red-* hardcoded para sucesso/erro (usar alert-success-* / alert-danger-*)

── TIPOGRAFIA ──────────────────────────────────────────────────────────────────
❌ italic   — proibido em todo o sistema
❌ font-light / font-thin — apenas peso 400 e 600

── EFEITOS VISUAIS (Sharp Design = Flat) ──────────────────────────────────────
❌ bg-gradient-to-*  — gradientes proibidos
❌ blur-*            — proibido (exceto página /login, exceção declarada)
❌ backdrop-blur-*   — idem
❌ shadow-* decorativo — apenas shadow-sm funcional em cards

── FORMAS ─────────────────────────────────────────────────────────────────────
❌ rounded-xl / rounded-lg / rounded-md / rounded-sm — tudo é rounded-none
   Exceções: rounded-full em avatares de pessoa, rounded-md em tooltips,
   rounded-lg em toasts do sonner
❌ rounded-full em containers de ícone decorativo (só em avatares de perfil humano)

── INTERAÇÃO ──────────────────────────────────────────────────────────────────
✅ cursor-pointer em todo elemento clicável que não seja <button> nativo
✅ hover:bg-muted em linhas de tabela e itens de lista
✅ transition-colors em toda transição de cor
✅ hover:bg-primary/90 no botão primário (nunca hover:bg-primary-800)

── LAYOUT ─────────────────────────────────────────────────────────────────────
❌ max-w-* / mx-auto no wrapper raiz de páginas internas (ver seção 15.1)
❌ min-h-screen em páginas (o layout pai gerencia altura)
```

### 4.5 Scrollbar Global

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

## 13. Estado Atual do Sistema

> Última revisão: **19/03/2026 — v7**. Reflete o código real em `/src`.

### 13.1 Módulos Implementados e Estáveis 🔒

Os itens abaixo estão corretos. **Não alterar sem necessidade explícita.**

| Módulo                      | O que está correto — não mexer                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**                    | `login/page.tsx`, `auth-actions.ts` (signIn/signOut), route group `(authenticated)`, `src/middleware.ts` simplificado                              |
| **Sidebar**                 | Footer com avatar (iniciais de `nome_completo`), nome, perfil e `LogoutButton` com `useTransition` + spinner                                       |
| **`getMeuPerfil()`**        | Retorna `DadosUsuario { perfil_acesso, nome_completo, email }`, wrappado com `React.cache` — executa 1× por request mesmo chamado em layout + page |
| **`getMeuPerfil()` FK**     | Usa `.eq('id', user.id)` — **nunca trocar para `.eq('email', ...)`**                                                                               |
| **`buscarPacientes()`**     | `select('id, nome_completo, cns, data_nascimento, status_cadastro')` — sem `select('*')`                                                           |
| **Painel Geral**            | `Promise.all([...])` nas 3 queries de contagem — paralelas                                                                                         |
| **`loading.tsx`**           | Em `app/(authenticated)/` — skeleton global para todas as rotas                                                                                    |
| **`/pacientes`**            | DataTable com busca debounce 300ms + estado local — digitação fluida                                                                               |
| **`/fila`**                 | DataTable com busca debounce 300ms + `AlertDialog` para Alta/Desistência                                                                           |
| **`/agendamentos`**         | 4 views (Recepção, Profissional, Coordenação, Logística) com `Suspense`                                                                            |
| **`/profissionais`**        | Server Component com tabela, `NovoProfissionalSheet` recebendo especialidades como prop                                                            |
| **`/especialidades`**       | Server Component com tabela e `NovaEspecialidadeSheet`                                                                                             |
| **`/judiciais`**            | `JudiciaisList` com colunas específicas                                                                                                            |
| **`/meus-atendimentos`**    | `AtendimentosDia` com cards de vagas e histórico                                                                                                   |
| **`/meus-pacientes`**       | `MeusPacientesList` com busca local em memória                                                                                                     |
| **`/absenteismo`**          | Alertas de absenteísmo com processamento de desligamento                                                                                           |
| **Prontuário**              | `HistoricoClinico` (timeline) + `AvaliacaoSocialForm` (RHF + Zod) no `paciente-sheet-master.tsx`                                                   |
| **`paciente-form.tsx`**     | `<input type="date">` nativo com `min`/`max`, `autoFocus`, `toast.success`, CNS `required`, insert com `...data`                                   |
| **Enums**                   | `"Falta Nao Justificada"` consistente em schema, types e actions                                                                                   |
| **`alert()` / `confirm()`** | Zero ocorrências — substituídos por `toast` e `AlertDialog`                                                                                        |

### 13.2 Dívidas Técnicas Abertas ⚠️

| #   | Prioridade | Arquivo                                                 | Problema                                                        | Solução                                                               |
| --- | ---------- | ------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | 🟢         | `actions/index.ts`                       | `(data as any[])` em `buscarFilaJudicial`                       | **Resolvido** — Interface `FilaJudicialRow` implementada      |
| 2   | 🟢         | `fila/columns.tsx`                       | `row: any, table: any` em `CellActions`                         | **Resolvido** — Tipado com generic `Row<T>` e `Table<T>`      |
| 3   | 🟢         | `avaliacao-social-form.tsx`               | `any` em erros de validação e submit                            | **Resolvido** — `AvaliacaoServicoSocialInput` aplicado       |
| 4   | 🔴         | `AtendimentosDia`, `MeusPacientesList`, `JudiciaisList` | `useEffect` de fetch — viola regra 3.2                          | Pages buscam server-side e passam como prop                   |
| 5   | 🟡         | `atendimentos-dia.tsx`                   | `bg-green-500/10` e `bg-red-500/10`                             | Tokens `alert-success-*` e `alert-danger-*`                   |
| 6   | 🟡         | `atendimentos-dia.tsx`                   | `as unknown as Paciente`                                        | Ampliar `Pick<>` em `AgendamentoHistoricoComJoins`            |
| 7   | 🟢         | `view-configuracao.tsx`                   | `confirm()` ainda presente                                      | **Resolvido** — Substituído por `AlertDialog`                 |
| 8   | 🟡         | `novo-paciente-sheet.tsx`                               | 2 `text-slate-*` residuais                                      | `text-white/60` e `text-muted-foreground`                             |
| 9   | 🟡         | `app/prontuarios/page.tsx`                              | `text-slate-900` e `text-slate-500`                             | `text-foreground` e `text-muted-foreground`                           |
| 10  | 🟢         | `next.config.js`                                        | `viacep.com.br` pode ser bloqueado em produção                  | Adicionar à allowlist ou criar Server Action proxy                    |
| 11  | 🟢         | `/relatorios`                                           | Página `EmBreve`                                                | Pós-MVP                                                               |

**Exceções documentadas — estas inconsistências são intencionais:**

| Arquivo                                            | Por que é aceitável                                                                       |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `login/page.tsx`                                   | Página de auth tem identidade visual própria — blur e rounded-full decorativos permitidos |
| `paciente-sheet-master.tsx`                        | `text-white/50`, `bg-white/10` dentro do SheetHeader escuro — correto por definição       |
| `historico-clinico.tsx`, `fila/paciente-sheet.tsx` | `useEffect` lazy load disparado por interação do usuário — exceção válida à regra 3.2     |
| `string-utils.ts`, `fila/paciente-sheet.tsx`       | `console.error` para erros de rede internos — aceitável                                   |

### 13.3 CRUD por Entidade — Status Atual

Sequência obrigatória de operação: Especialidades → Profissionais → Grades → Pacientes → Fila → Vagas Fixas.

| Entidade        | Listar    | Criar         | Editar                   | Ativar/Desativar     | Observação                         |
| --------------- | --------- | ------------- | ------------------------ | -------------------- | ---------------------------------- |
| Especialidades  | ✅        | ✅            | ✅            | ✅                    | —                                  |
| Profissionais   | ✅        | ✅            | ✅            | ✅                    | —                                  |
| Grades Horárias | ✅ action | ✅ action     | ✅ action     | —                     | ✅ Página UI operacional.          |
| Vagas Fixas     | ✅        | ✅ via agenda | ✅ encerrar              | —                    | Sem gestão dedicada fora da agenda |
| Pacientes       | ✅        | ✅            | ✅ via sheet             | ❌ sem atalho rápido | —                                  |
| Fila de Espera  | ✅        | ✅            | ❌ sem editar prioridade | ✅ Alta/Desistência  | —                                  |

---

## 14. Documentos Físicos Mapeados

> Fotografias dos formulários físicos reais do CER II (17/03/2026).

| Documento                         | Status                                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| Ficha de Acolhimento              | ✅ Parcial — campos `equipe_tecnica`, `tipo_reabilitacao`, `opms_solicitadas`, `eletivo` no modelo |
| Folha de Evolução                 | ✅ `agendamentos_historico.evolucao_clinica`                                                       |
| Controle de Frequência Individual | ✅ View Recepção + materialização de sessões                                                       |
| Avaliação: Serviço Social         | ✅ Tabela modelada + `AvaliacaoSocialForm` implementado                                            |

Campos físicos incorporados: `numero_prontuario`, `equipe_tecnica`, `tipo_reabilitacao`, `opms_solicitadas`, `profissao`, `reside_com`, `email`, `eletivo`, `confirmado_pelo_paciente`.

---

## 15. Template para Nova Feature

Sequência obrigatória ao implementar qualquer funcionalidade nova:

1. **Schema Zod** em `lib/validations/schema.ts`
2. **Tipos TypeScript** em `types/index.ts`
3. **Server Actions** em `actions/index.ts` (com `revalidatePath`)
4. **Server Component** em `app/(authenticated)/[rota]/page.tsx` — busca dados, passa props
5. **Client Component** em `components/[modulo]/` — recebe props, lida com UI interativa

**Proibições absolutas em todo código novo:**

- Nunca `useEffect` para buscar dados
- Nunca `useState` para filtros — usar `searchParams` na URL
- Nunca `alert()` ou `confirm()` — usar `toast` e `AlertDialog`
- Nunca `any` — tipos explícitos ou `unknown`
- Nunca `select('*')` em tabelas grandes — listar campos necessários
- Nunca `max-w-*` ou `mx-auto` no wrapper raiz da página

### 15.1 Estrutura Obrigatória de Página

```tsx
// ✅ CORRETO — copiar este padrão para toda nova page.tsx
export default async function MinhaPage() {
  const dados = await minhaAction()
  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Título</h1>
          <p className="text-muted-foreground mt-1">Subtítulo descritivo.</p>
        </div>
        <BotaoAcaoPrincipal /> {/* opcional */}
      </div>
      {/* conteúdo */}
    </div>
  )
}

// ❌ PROIBIDO
<div className="p-6 max-w-7xl mx-auto">   // max-w cria coluna estreita
<div className="p-8 ...">                  // p-8 quebra consistência
<main className="...">                     // <main> já existe no AuthenticatedLayout
```

### 15.2 Padrão de Sheet (Cadastro / Edição)

Todo Sheet de cadastro ou edição deve seguir:

```tsx
// ✅ Header obrigatório
<SheetHeader>             {/* bg-clinico-900 aplicado automaticamente via ui/sheet.tsx */}
  <SheetTitle>...</SheetTitle>             {/* text-white */}
</SheetHeader>

// ✅ Corpo
<div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
  {/* campos */}
</div>

// ✅ Footer fixo
<div className="shrink-0 border-t bg-card px-7 py-5 flex gap-3">
  <Button variant="outline" onClick={onCancel}>CANCELAR</Button>
  <Button type="submit" disabled={isPending}>
    {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> SALVANDO...</> : 'SALVAR'}
  </Button>
</div>
```

Sheet em modo **criação vs edição**:

- Prop opcional: `entidade?: TipoEntidade` — se presente, modo edição
- Título: `{entidade ? 'Editar X' : 'Novo X'}`
- Botão submit: `{entidade ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR'}`
- Action: `entidade ? atualizarX(entidade.id, payload) : cadastrarX(payload)`

### 15.3 Padrão de Tabela com Ações

```tsx
// ✅ Linha de tabela com botões de editar e ativar/desativar
<TableRow key={item.id} className="hover:bg-muted transition-colors">
  <TableCell>{item.nome}</TableCell>
  <TableCell>
    {/* Badge de status — NUNCA variant="default" */}
    <Badge
      className={`rounded-none border-none text-[10px] font-bold tracking-widest uppercase ${
        item.ativo
          ? 'bg-alert-success-bg text-alert-success-text'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {item.ativo ? 'Ativo' : 'Inativo'}
    </Badge>
  </TableCell>
  <TableCell className="text-right">
    {/* Botão editar — abre Sheet em modo edição */}
    <Button variant="ghost" size="sm" onClick={() => setEditando(item)}>
      <Pencil className="h-4 w-4" />
    </Button>
    {/* Ativar/desativar — com AlertDialog de confirmação */}
    <AlertDialog>...</AlertDialog>
  </TableCell>
</TableRow>
```

---

## 16. Padrão de Qualidade para Formulários

### 16.1 Defaults Obrigatórios

| Campo                              | Default              | Racional                                |
| ---------------------------------- | -------------------- | --------------------------------------- |
| `status_cadastro`                  | `"Ativo"`            | 100% dos novos cadastros começam ativos |
| `sexo`                             | `"M"`                | Usuário sempre confirma                 |
| `cidade`                           | `"Barreiras"`        | Maioria dos pacientes é local           |
| `uf`                               | `"BA"`               | Idem                                    |
| `pactuado`                         | `false`              | Caso majoritário                        |
| `necessita_transporte`             | `false`              | Caso majoritário                        |
| `perfil_acesso` (profissional)     | `"Medico_Terapeuta"` | Perfil mais comum                       |
| `nivel_prioridade` (fila)          | `"Rotina"`           | Caso majoritário                        |
| `tipo_atendimento` (especialidade) | `"Terapia Continua"` | Caso majoritário                        |

### 16.2 Máscaras e Limites

| Campo                | `maxLength` | Comportamento                                                    |
| -------------------- | ----------- | ---------------------------------------------------------------- |
| CPF                  | `14`        | Máscara `000.000.000-00`                                         |
| CNS                  | `15`        | Apenas dígitos                                                   |
| CEP                  | `9`         | Máscara `00000-000`                                              |
| Telefone             | `15`        | Máscara `(00) 00000-0000`                                        |
| CID                  | `10`        | `.toUpperCase()` no onChange                                     |
| UF                   | `2`         | `.toUpperCase()` no onChange                                     |
| Nº processo judicial | `40`        | Sem máscara                                                      |
| Data de nascimento   | —           | `<input type="date">` nativo + `min="1900-01-01"` + `max={hoje}` |

> **Data:** usar `<input>` HTML nativo (não o `<Input>` do Base UI) para garantir o date picker correto do browser.

### 16.3 Validação em Duas Camadas

| Camada          | Quando           | Implementação                                                       |
| --------------- | ---------------- | ------------------------------------------------------------------- |
| Inline (onBlur) | Ao sair do campo | `validateField()` → `fieldErrors` → erro abaixo do campo            |
| Submit (Zod)    | Ao enviar        | Schema Zod na Server Action → `submitError` → alerta acima do botão |

### 16.4 Feedback Obrigatório

```tsx
// ✅ Toast de sucesso — obrigatório após salvar
toast.success('Paciente cadastrado com sucesso!')

// ✅ Toast de erro — obrigatório ao falhar
toast.error('Erro: ' + result.error)

// ✅ Botão durante submit
<Button disabled={isPending}>
  {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> SALVANDO...</> : 'SALVAR'}
</Button>
```

### 16.5 Tags de Acessibilidade — Valores Canônicos

```ts
// ✅ Usar EXATAMENTE estes valores — idênticos ao banco
const TAGS_ACESSIBILIDADE = [
  'Cadeirante',
  'Acamado/Uso de Maca',
  'Uso de Oxigênio',
  'Risco de Agitação Psicomotora',
  'Deficiência Visual Severa',
  'Obesidade Severa',
] as const
```

### 16.6 Reset de Formulário

- Sheets não controlados (com `FormData`): usar `formRef.current?.reset()` após `setOpen(false)`
- Sheets controlados (com `useState`): resetar cada campo no bloco de sucesso
- Ambos: também limpar `fieldErrors` e `submitError`

---

## 17. Armadilhas Conhecidas do Cursor/IA

> Bugs introduzidos recorrentemente. Verificar após toda sessão de geração.

### 17.1 `middleware.ts` — nunca renomear

```
✅ src/middleware.ts    ← único nome que o Next.js executa
❌ src/proxy.ts         ← ignorado silenciosamente = sistema desprotegido
```

### 17.2 FK de usuário — sempre `.eq('id', user.id)`

```ts
❌ .eq('email', user.email)  // tabela profissionais não tem coluna email
✅ .eq('id', user.id)        // FK é a UUID do Supabase Auth
```

### 17.3 `validarAcessoRota` — não bloquear rotas não mapeadas

```ts
❌ } else { redirect('/') }   // bloqueia /configuracoes, /prontuarios, etc.
✅ return perfil               // se autenticado, permitir acesso
```

### 17.4 `select('*')` em tabelas grandes

```ts
❌ supabase.from('pacientes').select('*')
✅ supabase.from('pacientes').select('id, nome_completo, cns, data_nascimento, status_cadastro')
```

### 17.5 `any` em React Hook Form

```ts
❌ function Field({ error }: { error?: any })
❌ onSubmit(data: any)
✅ function Field({ error }: { error?: string })
✅ onSubmit(data: TipoDoSchema)
```

### 17.6 Layout de páginas novas

```ts
❌ <div className="p-6 max-w-7xl mx-auto">
✅ <div className="p-6 space-y-8">
```

### 17.7 Checklist pós-sessão

```
□ src/middleware.ts existe?
□ getMeuPerfil usa .eq('id', user.id)?
□ Novo select('*') em tabela com muitos registros?
□ validarAcessoRota tem bloco else que redireciona?
□ Algum any novo introduzido?
□ Páginas novas com max-w/mx-auto?
□ Cores hardcoded: green-*, red-*, slate-*, blue-*?
□ italic em algum texto?
□ rounded-full em container de ícone (não avatar)?
□ bg-gradient-* em algum elemento?
□ Toast de sucesso/erro em todos os formulários?
□ middleware.ts foi renomeado?
```
