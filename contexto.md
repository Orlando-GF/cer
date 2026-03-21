Contexto do Projeto e Regras de Engenharia (CER)

Arquivo mestre do projeto. Lido pela IA antes de qualquer geração de código. Contém stack, padrões, design system, banco de dados, regras de negócio e checklist de qualidade de software. Atualizado em Março/2026.

1. Visão Geral do Sistema

Sistema web web-based (Next.js) para substituir software legado em VBA no CER 2 — Centro Especializado em Reabilitação Aníbal Barbora Filho, vinculado ao SUS.
Foco: Gerir +8.000 prontuários, fila de espera transparente, agenda inteligente com vagas fixas recorrentes, e controlo rigoroso de absenteísmo. Sistema de missão crítica, exige alta disponibilidade, rastreabilidade e tolerância a falhas.

2. Stack Tecnológica

Framework: Next.js 15 (App Router) — Server-First Architecture.

Linguagem: TypeScript Estrito (Proibido any, estritamente tipado).

UI/UX: Tailwind CSS v4 + Base UI + shadcn/ui.

Banco de Dados: Supabase (PostgreSQL) — Região sa-east-1 (LGPD).

Validação de Dados e ENV: Zod (Backend, Frontend e Variáveis de Ambiente).

Qualidade e Testes: Vitest (Unitários) + Playwright (E2E) + ESLint/Prettier.

Backend Auxiliar: Python 3.12+ (Isolado, acionado via REST/Webhooks, nunca executado localmente pelo Node.js).

Observabilidade: Integração nativa para logs de erro (ex: Sentry) no Global Error Handler.

3. Os Pilares Arquiteturais (Obrigatórios)

3.1. Single Source of Truth (SSoT) e DRY

Zero Duplicação: Lógica de negócio, validações (Zod) e componentes de UI genéricos (DataTable) devem existir num único ficheiro.

Estado na URL: Paginação, filtros e abas ativas DEVEM ser geridos via searchParams na URL. É proibido usar useState para ditar a navegação global.

3.2. Performance e Escalabilidade (Server-First)

Paginação Obrigatória no BD: Todas as listagens devem usar .range(from, to) ou .limit(). Proibido carregar tabelas inteiras para a memória.

Inversão de Controlo (IoC): Server Components (page.tsx) buscam dados e injetam em Client Components puros. Proibido passar funções/JSX (ex: columns do TanStack) do Servidor para o Cliente via props (causa falha de serialização).

Proibido useEffect para Fetching: Dados devem chegar hidratados do Servidor. O Cliente apenas renderiza e gere interatividade.

3.3. UX Profissional (Streaming, a11y e Tratamento de Erros)

Suspense Boundaries: Todo carregamento pesado deve ter um loading.tsx ou <Suspense fallback={...}> com Skeletons (nunca spinners a bloquear o ecrã).

Tratamento Global: Falhas no Supabase devem ser apanhadas por error.tsx. O utilizador nunca deve ver um ecrã de erro cru.

Acessibilidade (WCAG): Foco em navegação por teclado (Enter/Esc), modais acessíveis e contraste de cores adequado a deficiências visuais.

3.4. Cache e Mutação de Dados

Todas as operações de escrita (POST/PUT/DELETE) devem ser feitas via Server Actions ('use server').

Após o sucesso de uma Server Action, é obrigatório chamar revalidatePath('/rota') ou revalidateTag() para purgar o cache.

3.5. Contratos de API (ActionResponse) e Tipagem

Resposta Padronizada: Todas as Server Actions DEVEM retornar o tipo ActionResponse<T> ({ success: boolean; data?: T; error?: string }). O frontend DEVE validar if (res.success && res.data) antes de aceder aos dados.

Sincronia com Supabase: É proibido tipar o retorno do banco de dados manualmente. Os tipos devem ser gerados/atualizados via Supabase CLI (supabase gen types typescript).

3.6. Segurança, RBAC e Auditoria (LGPD)

Soft Delete: É absolutamente PROIBIDO usar a instrução DELETE no banco de dados. Use status_cadastro = 'Inativo' ou Alta.

Controlo de Acesso: Toda a page.tsx ou Server Action deve validar o perfil do utilizador (validarAcessoRota()) antes de executar queries.

Logs Auditáveis: Todas as ações críticas (agendar, faltar, evoluir) devem inserir um registo na tabela agendamentos_logs com snapshot de dados (Anteriores vs Novos).

4. Regras de Negócio Inegociáveis

Mandado Judicial: nivel_prioridade = 'Mandado Judicial' fura a fila automaticamente (ordem de query order('nivel_prioridade')).

Absenteísmo (Regra 8): 3 faltas consecutivas sem justificação ativam alerta de desligamento automático (Busca em massa via array de IDs, nunca queries N+1).

Laudos: Laudo vencido emite alerta visual vermelho, não impede atendimento, mas bloqueia exportação para faturamento SUS.

Proteção de Corrida (Race Condition): Materialização de sessões exige verificação de concorrência para impedir double-booking.

Geração On-The-Fly: Vagas fixas não geram lixo no BD. O sistema projeta-as na memória do servidor para o Frontend e só materializa o registo (id único) no ato do atendimento.

5. Padrão de Integração e Nomenclatura

Páginas: src/app/(authenticated)/[modulo]/page.tsx (Servidor).

Componentes Exclusivos: src/components/[modulo]/[nome]-client.tsx (Cliente).

Componentes Genéricos: src/components/ui/ (Apenas componentes altamente reutilizáveis, sem lógica de domínio).

Ações: src/actions/index.ts (Servidor).

Nomenclatura Supabase: Jamais faça JOINs complexos no Cliente; resolva as Relações Estrangeiras na string de query do Supabase (ex: pacientes!inner(nome_completo)). Se o retorno puder ser Array ou Objeto, use uma função Transformer no backend antes de devolver ao Cliente.

6. O CHECKLIST DE CÓDIGO "PRO" (Para IA e Devs)

Pare e valide estes 10 pontos antes de concluir qualquer implementação ou PR:

[ ] TypeScript Estrito: Erradiquei any? Fiz cast ou verifiquei undefined adequadamente (response.data?.xyz)?

[ ] Acoplamento Ser-Cli: Estou a passar objetos não serializáveis (Funções, Components, Datas cruas não-ISO) via props de um Server para um Client Component? (Se sim, pare e inverta a arquitetura).

[ ] Performance (N+1): A minha Server Action faz loops for que disparam múltiplas queries ao banco? (Se sim, refatore para usar .in() e arrays de IDs).

[ ] Estado & SSoT: A paginação ou aba ativa sobrevive a um F5 (Refresh)? (Deve estar na URL via searchParams, não em useState).

[ ] Feedback de UI: O botão de salvar tem feedback de carregamento (isPending via useTransition) para impedir cliques duplos fantasma?

[ ] Cache de Mutação: Inseri um revalidatePath('/nome-da-rota-exata') ao final do sucesso da minha Server Action?

[ ] Tratamento de Exceções: Envolvi as chamadas de banco de dados em try/catch e devolvi um error.message polido no ActionResponse?

[ ] Ambiente: As variáveis de ambiente novas (process.env.XYZ) foram validadas no esquema do Zod no arranque da aplicação?

[ ] Design System: Usei as cores e espaçamentos padronizados (bg-muted, text-primary, border-border) em vez de magic numbers (ex: #ff0000)?

[ ] Testabilidade: A minha lógica complexa de negócio (ex: projectAgendaSessions) está extraída num ficheiro /lib isolado, puro e testável sem precisar renderizar o React?

7. Dicionário de Dados Base (Core Schema)

Referência para IA e Queries do Supabase: Garante que as consultas usam a nomenclatura exata do banco de dados, evitando alucinações de colunas.

pacientes: id, nome_completo, cns, telefone_principal, status_cadastro (Ativo/Inativo/Alta).

profissionais: id, nome_completo, cargo, status.

linhas_cuidado_especialidades: id, nome_especialidade.

vagas_fixas: id, paciente_id, profissional_id, especialidade_id, dia_semana (0-6), horario_inicio, horario_fim, status_vaga (Ativa/Encerrada).

agendamentos_historico: id, paciente_id, profissional_id, vaga_fixa_id (opcional), data_hora_inicio, data_hora_fim, status_comparecimento (Projetado, Presente, Falta Justificada, Falta Nao Justificada, Cancelado), evolucao_clinica, conduta, tipo_vaga.

agendamentos_logs: Tabela de auditoria (registro_id, tabela_afetada, acao, dados_anteriores, dados_novos, usuario_id).
