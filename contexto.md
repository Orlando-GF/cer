# Contexto Mestre do Projeto: Sistema de Gestão para CER 2 (SUS)

---

## 1. Visão Geral e Objetivo Crítico

Sistema web moderno para substituir software legado em VBA num CER 2 (Centro
Especializado em Reabilitação) vinculado ao SUS em Barreiras/BA. Atende mais
de 8.000 prontuários com foco em terapias contínuas (Autismo, Neurologia,
Fonoaudiologia, etc.) e dispensação de OPM.

**Objetivo do MVP:** Resolver crise de judicialização. O sistema deve gerir
filas de espera com transparência, priorizar mandados judiciais com
rastreabilidade, gerir agenda de atendimentos (com regras de recorrência e
intensivo) e controlar absenteísmo para otimizar o fluxo de vagas.

---

## 2. Stack Tecnológica e Infraestrutura

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript estrito
- **Estilo:** Tailwind CSS v4
- **UI Components:** shadcn/ui + Base UI (`@base-ui/react`) — foco em
  acessibilidade e ergonomia visual
- **Backend/Database:** Supabase (PostgreSQL nativo)
- **Validação:** Zod em todos os formulários e Server Actions
- **Formulários:** React Hook Form + Zod
- **Animações:** Framer Motion (apenas onde agrega valor ao usuário)

**Segurança e LGPD:** Dados de saúde são sensíveis. O Supabase deve rodar
obrigatoriamente na região `sa-east-1` (São Paulo). Acesso blindado via
Supabase Auth + RLS (Row Level Security) diretamente na base de dados.

---

## 3. Regras de Código (Coding Standards) — OBRIGATÓRIAS

A IA deve gerar código estritamente seguindo estas regras. Código que viole
qualquer regra abaixo deve ser recusado e reescrito.

### 3.1 Persona Sênior

Escreva como um Engenheiro de Software Sênior escreveria para produção num
ambiente corporativo de alto nível. O código será revisado por um dev sênior —
priorize legibilidade, manutenibilidade e correção.

### 3.2 TypeScript Estrito

- Uso obrigatório de TypeScript em todos os arquivos
- É **proibido** o uso de `any` — use tipos explícitos ou `unknown`
- Toda função deve ter tipos de entrada e saída declarados
- Interfaces de props obrigatórias em todos os componentes

```ts
// ✅ Correto
interface PatientCardProps {
  name: string
  specialty: string
  nextSession: Date
  therapist: string
}

const PatientCard = ({
  name,
  specialty,
  nextSession,
  therapist,
}: PatientCardProps) => {
  // ...
}

// ❌ Proibido
const PatientCard = (props: any) => { ... }
```

### 3.3 Arquitetura Next.js App Router (Server-First)

- Componentes devem ser **Server Components por padrão**
- Use `'use client'` apenas quando estritamente necessário (interatividade,
  hooks de estado)
- **Mutação de dados:** use Server Actions (`'use server'`) para chamadas ao
  Supabase
- **Estado de UI** (paginação, filtros, abas): use `searchParams` na URL,
  nunca `useState`
- **Proibido** usar `useEffect` para buscar dados — use Server Components ou
  React Query

### 3.4 Guard Clauses (Early Returns)

Evite aninhamento profundo de `if/else`. Trate erros e casos de falha no
início da função e retorne cedo.

```ts
// ✅ Correto
const processarFalta = async (agendamentoId: string) => {
  if (!agendamentoId) return { error: "ID obrigatório" };

  const agendamento = await buscarAgendamento(agendamentoId);
  if (!agendamento) return { error: "Agendamento não encontrado" };

  if (agendamento.status === "Cancelado") return { error: "Já cancelado" };

  // lógica principal aqui, sem aninhamento
};

// ❌ Proibido
const processarFalta = async (agendamentoId: string) => {
  if (agendamentoId) {
    const agendamento = await buscarAgendamento(agendamentoId);
    if (agendamento) {
      if (agendamento.status !== "Cancelado") {
        // lógica principal enterrada em 3 níveis
      }
    }
  }
};
```

### 3.5 Comentários Estratégicos

Não comente **o quê** — comente **o porquê** das regras de negócio.

```ts
// ❌ Proibido — óbvio
// soma o total de faltas
const totalFaltas = faltas.length;

// ✅ Correto — explica a regra de negócio
// 3 faltas injustificadas consecutivas disparam alerta de desligamento,
// conforme protocolo de absenteísmo do CER (regra SUS)
const deveAlertarDesligamento = faltasConsecutivas >= 3;
```

### 3.6 Separação de Preocupações (SoC)

- Lógica de acesso a dados (Supabase) nunca dentro de componentes de UI
- Estrutura obrigatória de pastas:

```
app/          → rotas e páginas (Server Components)
components/   → componentes de UI (sem lógica de dados)
lib/          → funções de acesso ao Supabase e utilitários
actions/      → Server Actions ('use server')
types/        → tipos TypeScript e schemas Zod
```

### 3.7 Validação com Zod

Todo formulário e toda Server Action **devem** validar o payload com Zod.

```ts
import { z } from "zod";

const CriarAgendamentoSchema = z.object({
  pacienteId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  dataHoraInicio: z.coerce.date(),
  especialidadeId: z.string().uuid(),
});

type CriarAgendamentoInput = z.infer<typeof CriarAgendamentoSchema>;
```

### 3.8 Nomenclatura Semântica (Clean Code)

- **Componentes:** PascalCase (`PatientCard`, `WaitingQueueTable`)
- **Funções e variáveis:** camelCase (`buscarPaciente`, `totalFaltas`)
- **Constantes globais:** UPPER_SNAKE_CASE (`MAX_FALTAS_CONSECUTIVAS`)
- **Arquivos de componente:** kebab-case (`patient-card.tsx`)
- **Proibido** abreviações obscuras ou nomes genéricos (`data`, `info`, `tmp`,
  `obj`, `res2`)

### 3.9 HTML Semântico e Acessibilidade (a11y)

- **Proibido** "div soup" — use tags HTML5 semânticas (`<main>`, `<section>`,
  `<article>`, `<nav>`, `<header>`, `<aside>`)
- Todo elemento interativo deve ter `aria-label` ou conteúdo descritivo
- Imagens devem ter `alt` descritivo
- Formulários devem usar `<label>` associado ao campo via `htmlFor`

### 3.10 Formatação (Prettier)

Todo código deve ser formatado como se tivesse passado pelo Prettier com estas
configurações:

```ts
// prettier.config.ts
const config = {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: "all",
  printWidth: 80,
  plugins: ["prettier-plugin-tailwindcss"],
};
```

Espaçamento lógico obrigatório entre blocos:
`imports` → `tipos` → `configuração` → `lógica principal` → `retorno`

### 3.11 Imports Organizados

```ts
// 1. Externos (node_modules)
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// 2. Internos (do projeto)
import { PatientCard } from "@/components/patient-card";
import { buscarPaciente } from "@/lib/pacientes";

// 3. Tipos
import type { Patient } from "@/types/patient";
```

### 3.12 Integração Supabase via MCP (Idempotência)

Ao criar ou alterar a base de dados via Supabase MCP, a IA **deve**:

- Verificar existência antes de criar (`CREATE TYPE IF NOT EXISTS`,
  `CREATE TABLE IF NOT EXISTS`)
- Respeitar a ordem das Foreign Keys para evitar erros de restrição
- Seguir a ordem de execução definida na seção 10 deste documento
- Ativar RLS em **todas** as tabelas criadas

---

## 4. Design System e Ergonomia Cognitiva

### 4.1 Tipografia

- **Fonte obrigatória:** `Nunito Sans` em toda a interface
- Importação via `next/font/google`:

```ts
import { Nunito_Sans } from "next/font/google";

export const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-sans",
});
```

- Aplicação no `layout.tsx`:

```tsx
<body className={nunitoSans.variable}>{children}</body>
```

- Hierarquia tipográfica:

| Uso                          | Tamanho | Peso                             |
| ---------------------------- | ------- | -------------------------------- |
| Títulos / Nome do paciente   | 20px    | 600                              |
| Labels de formulário         | 11–13px | 600 + uppercase + letter-spacing |
| Corpo de texto e evoluções   | 14px    | 400 / line-height: 1.65          |
| Dados secundários            | 13px    | 400                              |
| Microlabels (badges, status) | 11px    | 600 + letter-spacing: 0.08em     |

### 4.2 Regra Crítica para Dados Numéricos

É **obrigatório** o uso da classe Tailwind `tabular-nums` na exibição de dados
numéricos (CNS, CPF, datas) em tabelas, para garantir alinhamento vertical
exato.

### 4.3 Paleta de Cores

As cores abaixo são definidas via CSS custom properties no `globals.css` e
referenciadas pelo Tailwind. **Proibido** usar classes Tailwind genéricas
(`blue-600`, `slate-800`) para cores do sistema — use sempre as variáveis
semânticas definidas aqui.

#### Primária — Azul Clínico

| Token                 | Hex       | Uso                           |
| --------------------- | --------- | ----------------------------- |
| `--color-primary-50`  | `#E8F1FB` | Fundos de destaque suave      |
| `--color-primary-100` | `#C8D9EE` | Bordas, divisores             |
| `--color-primary-300` | `#5A9BD4` | Hover states, ícones          |
| `--color-primary`     | `#1A5FA8` | Botões, links, ação principal |
| `--color-primary-800` | `#0F3D72` | Hover do botão primário       |
| `--color-primary-900` | `#0F2D52` | Texto de títulos e nomes      |

#### Neutros — Interface

| Token                | Hex       | Uso                        |
| -------------------- | --------- | -------------------------- |
| `--color-background` | `#F0F5FB` | Fundo geral da página      |
| `--color-card`       | `#FFFFFF` | Fundo de cartões e painéis |
| `--color-foreground` | `#0F2D52` | Texto principal            |
| `--color-muted`      | `#5A7FA8` | Texto secundário, labels   |
| `--color-border`     | `#C8D9EE` | Bordas de inputs e cartões |

#### Alertas Semânticos (SUS)

| Token                   | Background | Texto     | Uso                             |
| ----------------------- | ---------- | --------- | ------------------------------- |
| `--color-alert-danger`  | `#FEE2E2`  | `#991B1B` | Laudo vencido / Mandado / Falta |
| `--color-alert-warning` | `#FEF3C7`  | `#92400E` | Aguardando / Pendente           |
| `--color-alert-success` | `#D1FAE5`  | `#065F46` | Em atendimento / Alta           |
| `--color-alert-shared`  | `#EDE9FE`  | `#4C1D95` | Atendimento compartilhado       |

#### Configuração no `globals.css`

```css
@import "tailwindcss";

:root {
  /* Primária */
  --color-primary-50: #e8f1fb;
  --color-primary-100: #c8d9ee;
  --color-primary-300: #5a9bd4;
  --color-primary: #1a5fa8;
  --color-primary-800: #0f3d72;
  --color-primary-900: #0f2d52;

  /* Interface */
  --color-background: #f0f5fb;
  --color-card: #ffffff;
  --color-foreground: #0f2d52;
  --color-muted: #5a7fa8;
  --color-border: #c8d9ee;

  /* Alertas */
  --color-alert-danger-bg: #fee2e2;
  --color-alert-danger-text: #991b1b;
  --color-alert-warning-bg: #fef3c7;
  --color-alert-warning-text: #92400e;
  --color-alert-success-bg: #d1fae5;
  --color-alert-success-text: #065f46;
  --color-alert-shared-bg: #ede9fe;
  --color-alert-shared-text: #4c1d95;
}

@theme inline {
  --font-sans: "Nunito Sans", sans-serif;

  --color-background: var(--color-background);
  --color-foreground: var(--color-foreground);
  --color-card: var(--color-card);
  --color-border: var(--color-border);
  --color-primary: var(--color-primary);
  --color-muted: var(--color-muted);
}

@layer base {
  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* Scrollbar global — fina e discreta */
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
    transition: background 0.2s;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--color-primary-300);
  }

  /* Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--color-primary-100) var(--color-primary-50);
  }
}
```

### 4.4 Mapeamento de Cores por Componente

É **proibido** usar classes Tailwind genéricas (`blue-600`, `slate-800`,
`white`) para estilizar componentes. Use **sempre** as variáveis CSS semânticas
definidas na seção 4.3. A IA deve aplicar este mapeamento em todos os
componentes gerados, sem exceção.

#### Sidebar

| Elemento                                  | Valor                                  |
| ----------------------------------------- | -------------------------------------- |
| Fundo da sidebar                          | `var(--color-primary-900)` → `#0F2D52` |
| Texto dos itens de menu                   | `#FFFFFF` com opacidade 70%            |
| Item de menu ativo                        | `var(--color-primary-300)` → `#5A9BD4` |
| Labels de seção (ATENDIMENTO, CLÍNICO...) | `#FFFFFF` com opacidade 40%            |
| Avatar / logo CER 2                       | `var(--color-primary)` → `#1A5FA8`     |

#### Página e Layout

| Elemento                    | Valor                                 |
| --------------------------- | ------------------------------------- |
| Fundo geral da página       | `var(--color-background)` → `#F0F5FB` |
| Fundo dos cartões e painéis | `var(--color-card)` → `#FFFFFF`       |
| Borda dos cartões           | `var(--color-border)` → `#C8D9EE`     |
| Título da página (h1)       | `var(--color-foreground)` → `#0F2D52` |
| Subtítulo / descrição       | `var(--color-muted)` → `#5A7FA8`      |

#### Botões

| Elemento                    | Valor                                  |
| --------------------------- | -------------------------------------- |
| Botão primário — fundo      | `var(--color-primary)` → `#1A5FA8`     |
| Botão primário — hover      | `var(--color-primary-800)` → `#0F3D72` |
| Botão primário — texto      | `#FFFFFF`                              |
| Botão ghost — borda e texto | `var(--color-primary)` → `#1A5FA8`     |
| Botão ghost — hover fundo   | `var(--color-primary-50)` → `#E8F1FB`  |

#### Tabs

| Elemento                   | Valor                                 |
| -------------------------- | ------------------------------------- |
| Tab ativa — fundo          | `var(--color-card)` → `#FFFFFF`       |
| Tab ativa — texto          | `var(--color-foreground)` → `#0F2D52` |
| Tab ativa — borda          | `var(--color-border)` → `#C8D9EE`     |
| Tab inativa — texto        | `var(--color-muted)` → `#5A7FA8`      |
| Container das tabs — fundo | `var(--color-primary-50)` → `#E8F1FB` |

#### Tabela de Dados

| Elemento                   | Valor                                 |
| -------------------------- | ------------------------------------- |
| Header da tabela — fundo   | `var(--color-primary-50)` → `#E8F1FB` |
| Header da tabela — texto   | `var(--color-foreground)` → `#0F2D52` |
| Linha — borda inferior     | `var(--color-border)` → `#C8D9EE`     |
| Linha — hover              | `var(--color-primary-50)` → `#E8F1FB` |
| Dados numéricos (CNS, CPF) | `tabular-nums` obrigatório            |

#### Campos de Formulário e Busca

| Elemento               | Valor                                 |
| ---------------------- | ------------------------------------- |
| Fundo do input         | `var(--color-card)` → `#FFFFFF`       |
| Borda do input         | `var(--color-border)` → `#C8D9EE`     |
| Borda do input — focus | `var(--color-primary)` → `#1A5FA8`    |
| Texto placeholder      | `var(--color-muted)` → `#5A7FA8`      |
| Texto digitado         | `var(--color-foreground)` → `#0F2D52` |

#### Badges e Status

| Status                          | Fundo                                       | Texto                                         |
| ------------------------------- | ------------------------------------------- | --------------------------------------------- |
| AGUARDANDO                      | `var(--color-alert-warning-bg)` → `#FEF3C7` | `var(--color-alert-warning-text)` → `#92400E` |
| EM ATENDIMENTO / PRESENTE       | `var(--color-alert-success-bg)` → `#D1FAE5` | `var(--color-alert-success-text)` → `#065F46` |
| LAUDO VENCIDO / MANDADO / FALTA | `var(--color-alert-danger-bg)` → `#FEE2E2`  | `var(--color-alert-danger-text)` → `#991B1B`  |
| ATENDIMENTO COMPARTILHADO       | `var(--color-alert-shared-bg)` → `#EDE9FE`  | `var(--color-alert-shared-text)` → `#4C1D95`  |

#### Cartões de Métricas (Dashboard)

| Elemento         | Valor                                  |
| ---------------- | -------------------------------------- |
| Fundo            | `var(--color-card)` → `#FFFFFF`        |
| Borda            | `var(--color-border)` → `#C8D9EE`      |
| Label da métrica | `var(--color-muted)` → `#5A7FA8`       |
| Valor numérico   | `var(--color-foreground)` → `#0F2D52`  |
| Ícone decorativo | `var(--color-primary-300)` → `#5A9BD4` |

#### Barra de Rolagem (Scrollbar)

Aplicar em todo o projeto via `globals.css`. A barra deve ser fina,
discreta e seguir a paleta do sistema.

| Elemento       | Valor                                  |
| -------------- | -------------------------------------- |
| Largura        | `6px`                                  |
| Trilho (track) | `var(--color-primary-50)` → `#E8F1FB`  |
| Thumb          | `var(--color-primary-100)` → `#C8D9EE` |
| Thumb — hover  | `var(--color-primary-300)` → `#5A9BD4` |
| Border-radius  | `999px` (arredondado)                  |

CSS a adicionar no `globals.css` dentro de `@layer base`:

```css
/* Scrollbar global */
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
  transition: background 0.2s;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-300);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-primary-100) var(--color-primary-50);
}
```

#### Dropdown / Select

| Elemento                          | Valor                                 |
| --------------------------------- | ------------------------------------- |
| Fundo do painel                   | `var(--color-card)` → `#FFFFFF`       |
| Borda do painel                   | `var(--color-border)` → `#C8D9EE`     |
| Border-radius                     | `8px`                                 |
| Sombra                            | `0 4px 16px rgba(15, 45, 82, 0.08)`   |
| Texto dos itens                   | `var(--color-foreground)` → `#0F2D52` |
| Item — hover                      | `var(--color-primary-50)` → `#E8F1FB` |
| Item — selecionado fundo          | `var(--color-primary-50)` → `#E8F1FB` |
| Item — selecionado texto          | `var(--color-primary)` → `#1A5FA8`    |
| Trigger (botão do select) — fundo | `var(--color-card)` → `#FFFFFF`       |
| Trigger — borda                   | `var(--color-border)` → `#C8D9EE`     |
| Trigger — texto                   | `var(--color-foreground)` → `#0F2D52` |
| Trigger — ícone chevron           | `var(--color-muted)` → `#5A7FA8`      |

#### Slide-over (Painel Lateral)

| Elemento                     | Valor                                 |
| ---------------------------- | ------------------------------------- |
| Overlay (fundo escurecido)   | `rgba(15, 45, 82, 0.4)`               |
| Fundo do painel              | `var(--color-card)` → `#FFFFFF`       |
| Borda lateral                | `var(--color-border)` → `#C8D9EE`     |
| Header do painel — fundo     | `var(--color-primary-50)` → `#E8F1FB` |
| Header do painel — título    | `var(--color-foreground)` → `#0F2D52` |
| Header do painel — subtítulo | `var(--color-muted)` → `#5A7FA8`      |
| Botão fechar (×)             | `var(--color-muted)` → `#5A7FA8`      |
| Botão fechar — hover         | `var(--color-foreground)` → `#0F2D52` |
| Divisores internos           | `var(--color-border)` → `#C8D9EE`     |

#### Tooltip

| Elemento      | Valor                                  |
| ------------- | -------------------------------------- |
| Fundo         | `var(--color-primary-900)` → `#0F2D52` |
| Texto         | `#FFFFFF`                              |
| Border-radius | `6px`                                  |
| Padding       | `6px 10px`                             |
| Font-size     | `12px`                                 |

#### Toast / Notificações

| Tipo    | Fundo                                       | Texto                                         | Borda esquerda |
| ------- | ------------------------------------------- | --------------------------------------------- | -------------- |
| Sucesso | `var(--color-alert-success-bg)` → `#D1FAE5` | `var(--color-alert-success-text)` → `#065F46` | `#065F46`      |
| Erro    | `var(--color-alert-danger-bg)` → `#FEE2E2`  | `var(--color-alert-danger-text)` → `#991B1B`  | `#991B1B`      |
| Aviso   | `var(--color-alert-warning-bg)` → `#FEF3C7` | `var(--color-alert-warning-text)` → `#92400E` | `#92400E`      |
| Info    | `var(--color-primary-50)` → `#E8F1FB`       | `var(--color-primary)` → `#1A5FA8`            | `#1A5FA8`      |

> Toasts devem ter `border-left: 4px solid` na cor indicada, border-radius
> `8px` e sombra `0 4px 16px rgba(15, 45, 82, 0.08)`.

#### Switch / Toggle

| Elemento              | Valor                                  |
| --------------------- | -------------------------------------- |
| Track — inativo       | `var(--color-border)` → `#C8D9EE`      |
| Track — ativo         | `var(--color-primary)` → `#1A5FA8`     |
| Track — hover inativo | `var(--color-primary-300)` → `#5A9BD4` |
| Thumb (bolinha)       | `#FFFFFF`                              |
| Label — texto         | `var(--color-foreground)` → `#0F2D52`  |
| Label — font-size     | `13px / 600`                           |

#### Checkbox e Radio

| Elemento            | Valor                                  |
| ------------------- | -------------------------------------- |
| Borda — não marcado | `var(--color-border)` → `#C8D9EE`      |
| Fundo — não marcado | `var(--color-card)` → `#FFFFFF`        |
| Fundo — marcado     | `var(--color-primary)` → `#1A5FA8`     |
| Borda — marcado     | `var(--color-primary)` → `#1A5FA8`     |
| Ícone check         | `#FFFFFF`                              |
| Hover — borda       | `var(--color-primary-300)` → `#5A9BD4` |
| Focus ring          | `rgba(26, 95, 168, 0.15)`              |

#### Paginação

| Elemento                       | Valor                                 |
| ------------------------------ | ------------------------------------- |
| Botão página — fundo           | `var(--color-card)` → `#FFFFFF`       |
| Botão página — borda           | `var(--color-border)` → `#C8D9EE`     |
| Botão página — texto           | `var(--color-muted)` → `#5A7FA8`      |
| Botão página — hover fundo     | `var(--color-primary-50)` → `#E8F1FB` |
| Botão página ativa — fundo     | `var(--color-primary)` → `#1A5FA8`    |
| Botão página ativa — texto     | `#FFFFFF`                             |
| Botão Anterior/Próxima — fundo | `var(--color-card)` → `#FFFFFF`       |
| Botão Anterior/Próxima — borda | `var(--color-border)` → `#C8D9EE`     |
| Botão Anterior/Próxima — texto | `var(--color-foreground)` → `#0F2D52` |
| Botão desabilitado — texto     | `var(--color-border)` → `#C8D9EE`     |

#### Loading / Skeleton

| Elemento                 | Valor                                  |
| ------------------------ | -------------------------------------- |
| Base do skeleton         | `var(--color-primary-50)` → `#E8F1FB`  |
| Shimmer (brilho animado) | `var(--color-primary-100)` → `#C8D9EE` |
| Border-radius            | `6px` para blocos, `999px` para pills  |

> O shimmer deve ser animado com `@keyframes` usando `background-position`
> de esquerda para direita, duração `1.4s`, loop infinito.

#### Empty State (Tabela sem dados)

| Elemento                  | Valor                                  |
| ------------------------- | -------------------------------------- |
| Ícone ilustrativo         | `var(--color-primary-100)` → `#C8D9EE` |
| Título                    | `var(--color-foreground)` → `#0F2D52`  |
| Descrição                 | `var(--color-muted)` → `#5A7FA8`       |
| Botão de ação (se houver) | Botão primário padrão                  |

> Centralizado verticalmente na área da tabela. Altura mínima de `200px`.

#### Estado de Erro em Formulários

| Elemento                     | Valor                                        |
| ---------------------------- | -------------------------------------------- |
| Borda do input com erro      | `var(--color-alert-danger-text)` → `#991B1B` |
| Fundo do input com erro      | `var(--color-alert-danger-bg)` → `#FEE2E2`   |
| Mensagem de erro — texto     | `var(--color-alert-danger-text)` → `#991B1B` |
| Mensagem de erro — font-size | `12px`                                       |
| Ícone de erro                | `var(--color-alert-danger-text)` → `#991B1B` |

#### Breadcrumb

| Elemento                 | Valor                                 |
| ------------------------ | ------------------------------------- |
| Item atual (último)      | `var(--color-foreground)` → `#0F2D52` |
| Itens anteriores (links) | `var(--color-muted)` → `#5A7FA8`      |
| Separador (/)            | `var(--color-border)` → `#C8D9EE`     |
| Hover nos links          | `var(--color-primary)` → `#1A5FA8`    |
| Font-size                | `13px`                                |

#### Labels de Seção dentro de Páginas

Títulos intermediários como "Prontuários da fila", "Visualização macro":

| Elemento                  | Valor                                       |
| ------------------------- | ------------------------------------------- |
| Texto                     | `var(--color-foreground)` → `#0F2D52`       |
| Font-size                 | `16px`                                      |
| Font-weight               | `600`                                       |
| Margem inferior           | `12px`                                      |
| Divisor abaixo (opcional) | `var(--color-border)` → `#C8D9EE` / `0.5px` |

---

## 5. Componentes Obrigatórios da UI

- **Data Table:** paginação, busca global e filtros por coluna
- **Slide-overs (Painéis Laterais):** detalhes do paciente sem mudar de página
- **Command Menu (Cmd+K):** busca rápida flutuante global

### 5.1 Views de Agenda

| View               | Perfil       | Foco                                                                    |
| ------------------ | ------------ | ----------------------------------------------------------------------- |
| **List View**      | Recepção     | Lista do turno atual, marcação Presente/Faltou, ordem de chegada        |
| **Day View**       | Profissional | Calendário do dia, inserção de evolução clínica                         |
| **Timeline/Gantt** | Coordenação  | Mapa visual de todos os profissionais, identificação de ociosidade      |
| **Route View**     | Motorista    | Lista de pacientes que precisam de transporte, endereço e tags de risco |

---

## 6. Perfis de Acesso Estritos (RBAC)

| Perfil                     | Pode                                                       | Bloqueado               |
| -------------------------- | ---------------------------------------------------------- | ----------------------- |
| **Recepção**               | Agendamentos, presença, fila                               | Laudos, diagnósticos    |
| **Enfermagem/Acolhimento** | Criar prontuários, anexar docs, definir prioridade, CID-10 | —                       |
| **Corpo Clínico**          | Ver agenda própria, preencher evoluções, dar altas         | —                       |
| **Administração**          | Relatórios, mandados, auditoria                            | —                       |
| **Motorista**              | Apenas Route View                                          | Todos os dados clínicos |

---

## 7. Fluxo Operacional (Jornada do Usuário)

1. **Acolhimento:** Busca rápida (Cmd+K). Se não existe, cadastra com CID-10
   e tags de acessibilidade. Define prioridade e Linha de Cuidado → entra na
   `fila_espera`.

2. **Avaliação Diagnóstica:** Pacientes sem diagnóstico passam por consultas de
   avaliação. O laudo pode disparar inserção na fila de terapias.

3. **Convocação:**
   - **Médico (Bloco):** Pacientes agendados com numeração de `ordem_chegada`
     gerada pela recepção.
   - **Terapia (Dinâmico):** Vaga surge → paciente assume "Contrato de Vaga
     Fixa". Sessões são projetadas na tela on-the-fly, sem gravar registos
     físicos futuros na base.

4. **Presença Diária:** Recepção usa List View. Ao marcar Presente/Falta, o
   sistema "materializa" a sessão na tabela `agendamentos_historico`. 3 faltas
   injustificadas consecutivas = alerta de desligamento.

5. **Atendimento:** Profissional acede à agenda, regista evolução clínica e
   define conduta.

6. **Ciclo de Reavaliação (6 meses) — REGRA CRÍTICA:** A cada 6 meses, exibir
   alerta vermelho `⚠️ LAUDO VENCIDO`. O sistema **nunca** bloqueia o
   profissional de digitar evolução. O bloqueio ocorre apenas na exportação do
   faturamento SUS (BPA), e o paciente é movido para a Lista de Pendências da
   coordenação.

---

## 8. Regras de Negócio Inegociáveis

- **Fila por Prioridade:** Mandados judiciais furam a fila
- **Filas Independentes:** Atreladas à especialidade, não apenas ao paciente
- **Absenteísmo:** 3 faltas consecutivas injustificadas = Alerta de
  Desligamento
- **Logs de Auditoria:** Alterações em agendamentos geram log imutável
- **Pactuação Municipal (PPI):** Registar se é de Barreiras ou município
  pactuado

---

## 9. Motor de Agendamento Dinâmico

**PROIBIDO** criar registos físicos futuros em massa na base de dados. É
**terminantemente proibido** gerar blocos físicos de agendamentos
(ex: 3 meses à frente).

### Como funciona

- Terapias contínuas guardam apenas a **regra** na tabela `vagas_fixas`
- O frontend gera as sessões **on-the-fly** para exibição e visualização de
  ociosidade
- Registos físicos na `agendamentos_historico` **só ocorrem** ao gravar
  presença, falta ou evolução

### Exceções e Casos Especiais

- **Remarcação pontual:** Permite remarcar uma única sessão projetada sem
  quebrar a regra de recorrência matriz
- **Bloco vs Hora Marcada:** Suporta agendar N pacientes no mesmo turno com
  `ordem_chegada`
- **Atendimento Compartilhado (Intensivo):** Permite 2 profissionais diferentes
  agendarem o mesmo paciente no mesmo horário. Não é conflito — mas o sistema
  **deve** exibir ícone visual `⚠️ Atendimento Compartilhado` na agenda para
  a recepção

---

## 10. Estrutura da Base de Dados (Supabase / PostgreSQL)

### Ordem de Execução Obrigatória via MCP

1. Criar todos os ENUMs nativos
2. Criar tabelas independentes: `linhas_cuidado_especialidades` e `pacientes`
3. Criar tabela `profissionais` (referencia `auth.users`)
4. Criar tabelas dependentes: `grade_horaria`, `fila_espera`, `vagas_fixas`
5. Criar tabela de materialização: `agendamentos_historico`
6. Implementar função e TRIGGERS para `updated_at`
7. Ativar RLS em **todas** as tabelas e aplicar políticas iniciais

### 10.1 Tabela: `pacientes`

| Campo                  | Tipo      | Detalhe                                                                                                                                              |
| ---------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | UUID PK   | —                                                                                                                                                    |
| `id_legado_vba`        | VARCHAR   | Referência ao sistema antigo                                                                                                                         |
| `cns`                  | VARCHAR   | Cartão Nacional de Saúde                                                                                                                             |
| `cpf`                  | VARCHAR   | —                                                                                                                                                    |
| `nome_completo`        | VARCHAR   | —                                                                                                                                                    |
| `data_nascimento`      | DATE      | —                                                                                                                                                    |
| `sexo`                 | ENUM      | —                                                                                                                                                    |
| `nome_mae`             | VARCHAR   | —                                                                                                                                                    |
| `nome_pai`             | VARCHAR   | —                                                                                                                                                    |
| `rg`                   | VARCHAR   | —                                                                                                                                                    |
| `rg_orgao_exp`         | VARCHAR   | —                                                                                                                                                    |
| `estado_civil`         | VARCHAR   | —                                                                                                                                                    |
| `naturalidade`         | VARCHAR   | —                                                                                                                                                    |
| `cid_principal`        | VARCHAR   | —                                                                                                                                                    |
| `cid_secundario`       | VARCHAR   | —                                                                                                                                                    |
| `necessita_transporte` | BOOLEAN   | DEFAULT false                                                                                                                                        |
| `tags_acessibilidade`  | VARCHAR[] | `'Acamado/Uso de Maca'`, `'Risco de Agitação Psicomotora'`, `'Deficiência Visual Severa'`, `'Obesidade Severa'`, `'Uso de Oxigênio'`, `'Cadeirante'` |
| `status_cadastro`      | ENUM      | `'Ativo'`, `'Inativo'`, `'Obito'`, `'Alta'`                                                                                                          |

### 10.2 Tabela: `linhas_cuidado_especialidades`

| Campo                | Tipo    | Detalhe                                                                                   |
| -------------------- | ------- | ----------------------------------------------------------------------------------------- |
| `id`                 | UUID PK | —                                                                                         |
| `nome_especialidade` | VARCHAR | —                                                                                         |
| `equipe_responsavel` | VARCHAR | —                                                                                         |
| `linha_reabilitacao` | VARCHAR | Crucial para faturamento SUS                                                              |
| `tipo_atendimento`   | ENUM    | `'Consulta Medica'`, `'Terapia Continua'`, `'Dispensacao_OPM'`, `'Avaliacao_Diagnostica'` |

### 10.3 Tabela: `fila_espera`

| Campo                      | Tipo        | Detalhe                                                       |
| -------------------------- | ----------- | ------------------------------------------------------------- |
| `id`                       | UUID PK     | —                                                             |
| `paciente_id`              | FK          | → `pacientes`                                                 |
| `especialidade_id`         | FK          | → `linhas_cuidado_especialidades`                             |
| `data_entrada_fila`        | TIMESTAMPTZ | —                                                             |
| `nivel_prioridade`         | INTEGER     | —                                                             |
| `numero_processo_judicial` | VARCHAR     | Nulo se não for mandado                                       |
| `status_fila`              | ENUM        | `'Aguardando'`, `'Em Atendimento'`, `'Desistencia'`, `'Alta'` |

### 10.4 Tabelas: `profissionais` e `grade_horaria`

**profissionais:**

| Campo                       | Tipo    | Detalhe                                                                   |
| --------------------------- | ------- | ------------------------------------------------------------------------- |
| `id`                        | UUID PK | —                                                                         |
| `user_id`                   | FK      | → `auth.users`                                                            |
| `nome_completo`             | VARCHAR | —                                                                         |
| `registro_conselho`         | VARCHAR | —                                                                         |
| `cbo`                       | VARCHAR | —                                                                         |
| `perfil_acesso`             | ENUM    | RBAC                                                                      |
| `especialidades_permitidas` | UUID[]  | → `linhas_cuidado_especialidades` — evita marcação no profissional errado |

**grade_horaria:** Define a capacidade base de atendimento do profissional por
dia e turno.

### 10.5 Tabela: `vagas_fixas` (O Contrato Dinâmico)

| Campo                  | Tipo    | Detalhe                                |
| ---------------------- | ------- | -------------------------------------- |
| `id`                   | UUID PK | —                                      |
| `paciente_id`          | FK      | → `pacientes`                          |
| `profissional_id`      | FK      | → `profissionais`                      |
| `especialidade_id`     | FK      | → `linhas_cuidado_especialidades`      |
| `dia_semana`           | INTEGER | 0=Domingo … 6=Sábado                   |
| `horario_inicio`       | TIME    | —                                      |
| `horario_fim`          | TIME    | —                                      |
| `data_inicio_contrato` | DATE    | —                                      |
| `data_fim_contrato`    | DATE    | Nulo até à Alta                        |
| `status_vaga`          | ENUM    | `'Ativa'`, `'Suspensa'`, `'Encerrada'` |

> Esta tabela não polui a base. É apenas a regra lida pelo frontend para
> desenhar a agenda on-the-fly. Registos físicos nunca são gerados
> antecipadamente a partir desta tabela.

### 10.6 Tabela: `agendamentos_historico` (Materialização)

| Campo                   | Tipo        | Detalhe                                                                                                                                                           |
| ----------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                    | UUID PK     | —                                                                                                                                                                 |
| `paciente_id`           | FK          | → `pacientes`                                                                                                                                                     |
| `profissional_id`       | FK          | → `profissionais`                                                                                                                                                 |
| `especialidade_id`      | FK          | → `linhas_cuidado_especialidades`                                                                                                                                 |
| `vaga_fixa_id`          | UUID FK?    | Opcional — referencia a regra que gerou o registo                                                                                                                 |
| `data_hora_inicio`      | TIMESTAMPTZ | —                                                                                                                                                                 |
| `data_hora_fim`         | TIMESTAMPTZ | —                                                                                                                                                                 |
| `ordem_chegada`         | INTEGER     | Para consultas em bloco                                                                                                                                           |
| `status_comparecimento` | ENUM        | `'Agendado'`, `'Presente'`, `'Falta Justificada'`, `'Falta Nao Justificada'`, `'Cancelado'`                                                                       |
| `evolucao_clinica`      | TEXT        | —                                                                                                                                                                 |
| `conduta`               | ENUM        | `'Retorno'`, `'Alta por Melhoria'`, `'Alta por Abandono'`, `'Alta a Pedido'`, `'Obito/Transferencia'`, `'Encaminhamento Externo'`, `'Inserir em Fila de Terapia'` |

---

## 11. Estrutura de Navegação (Sidebar — RBAC)

### ATENDIMENTO _(Recepção e Enfermagem)_

- Painel Geral (Dashboard da unidade)
- Pacientes (CRUD)
- Fila de Espera
- Agenda Geral

### CLÍNICO _(Médicos e Terapeutas)_

- Meus Atendimentos (agenda do dia + slide-over de evolução clínica)
- Meus Pacientes (contratos de vaga fixa ativos)

### LOGÍSTICA _(Motoristas / Coordenação)_

- Rotas de Transporte (lista do dia com tags de acessibilidade)

### GESTÃO E AUDITORIA _(Coordenação)_

- Absenteísmo (alertas de pacientes com 3 faltas)
- Mandados Judiciais (acompanhamento legal)
- Relatórios (exportação BPA e produtividade)

### CONFIGURAÇÕES _(Administração)_

- Profissionais & Acessos (criação de usuários e permissões)
- Especialidades (CRUD das Linhas de Cuidado)
- Grades Horárias (definição dos dias e horários por profissional)
