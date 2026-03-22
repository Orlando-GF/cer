"use client"

import { useTransition, useEffect } from "react"
import { useForm, Controller, Resolver, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { ActionResponse, Paciente } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Loader2,
  User,
  Home,
  Phone,
  CheckCircle2,
  Stethoscope,
  Truck,
} from "lucide-react"

import { cadastrarPaciente, atualizarPaciente } from "@/actions"
import { formatarNomeClinico, buscarEnderecoPorCep } from "@/lib/utils/string-utils"
import { pacienteSchema } from "@/lib/validations/schema"

// ─── tipos ────────────────────────────────────────────────────────────────────
const pacienteFormSchema = pacienteSchema
export type PacienteFormData = z.infer<typeof pacienteFormSchema> & { id?: string }

// ─── funções de máscara ───────────────────────────────────────────────────────

const onlyDigits = (v: string) => v.replace(/\D/g, "")

const TAGS_ACESSIBILIDADE = [
  "Cadeirante",
  "Acamado/Uso de Maca",
  "Deficiência Visual Severa",
  "Risco de Agitação Psicomotora",
  "Uso de Oxigênio",
  "Obesidade Severa",
] as const

type TagAcessibilidade = typeof TAGS_ACESSIBILIDADE[number]

function maskCPF(value: string): string {
  const d = onlyDigits(value).substring(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function maskCNS(value: string): string {
  const d = onlyDigits(value).substring(0, 15)
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3)}`
  if (d.length <= 11) return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`
  return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7, 11)} ${d.slice(11)}`
}

function maskPhone(value: string): string {
  const d = onlyDigits(value).substring(0, 11)
  if (d.length === 0) return ""
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function maskCEP(value: string): string {
  const d = onlyDigits(value).substring(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

// ─── sub-componentes de layout ────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
      <div className="flex items-center justify-center w-7 h-7 rounded-none bg-muted shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">{title}</span>
    </div>
  )
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5 flex flex-col justify-end">
      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label} {required && <span className="text-alert-danger-text">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-alert-danger-text">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

interface PacienteFormProps {
  initialData?: Partial<Paciente> & { id?: string }
  onSuccess?: () => void
  onCancel?: () => void
}

export function PacienteForm({ initialData, onSuccess, onCancel }: PacienteFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const defaultValues: any = {
    cidade: "Barreiras",
    uf: "BA",
    pactuado: false,
    municipio_pactuado: "",
    necessita_transporte: false,
    tags_acessibilidade: [],
    id_legado_vba: "",
    status_cadastro: "Ativo",
    ...initialData,
    cpf: initialData?.cpf ? maskCPF(initialData.cpf) : "",
    cns: initialData?.cns ? maskCNS(initialData.cns) : "",
    endereco_cep: initialData?.endereco_cep ? maskCEP(initialData.endereco_cep) : "",
    telefone_principal: initialData?.telefone_principal ? maskPhone(initialData.telefone_principal) : "",
    telefone_secundario: initialData?.telefone_secundario ? maskPhone(initialData.telefone_secundario) : "",
    telefone_responsavel: initialData?.telefone_responsavel ? maskPhone(initialData.telefone_responsavel) : "",
  }

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<z.infer<typeof pacienteFormSchema>>({
    resolver: zodResolver(pacienteFormSchema) as Resolver<z.infer<typeof pacienteFormSchema>>,
    defaultValues: defaultValues,
  })

  // Sincroniza forms após sheet opens/changes
  useEffect(() => {
    if (initialData) {
      reset({
        ...defaultValues,
        ...initialData,
        cpf: initialData.cpf ? maskCPF(initialData.cpf) : "",
        cns: initialData.cns ? maskCNS(initialData.cns) : "",
        endereco_cep: initialData.endereco_cep ? maskCEP(initialData.endereco_cep) : "",
        telefone_principal: initialData.telefone_principal ? maskPhone(initialData.telefone_principal) : "",
        telefone_secundario: initialData.telefone_secundario ? maskPhone(initialData.telefone_secundario) : "",
        telefone_responsavel: initialData.telefone_responsavel ? maskPhone(initialData.telefone_responsavel) : "",
      } as Record<string, unknown>)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, reset])

  // Busca CEP através de watch otimizado para não forçar render global
  const cepAtual = watch("endereco_cep")
  useEffect(() => {
    const cepLimpo = (cepAtual || "").replace(/\D/g, "")
    if (cepLimpo.length === 8) {
      const timer = setTimeout(async () => {
        const info = await buscarEnderecoPorCep(cepLimpo)
        if (info) {
          setValue("logradouro", info.logradouro)
          setValue("bairro", info.bairro)
          setValue("cidade", info.cidade)
          setValue("uf", info.uf)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [cepAtual, setValue])

  const pactuadoAtual = watch("pactuado")

  const onSubmit = (data: z.infer<typeof pacienteFormSchema>) => {
    startTransition(async () => {
      // O Zod já fez todo o trabalho sujo de validação (DRY)
      // As máscaras foram limpas pelo .transform() e .preprocess() e data agora tem os dados puros para o DB.

      const payload = {
        ...data,
      } // passamos a representação do Zod validada para payload.

      const result: ActionResponse = initialData?.id
        ? await atualizarPaciente(initialData.id, payload)
        : await cadastrarPaciente(payload)

      if (!result.success) {
        toast.error(result.error || "Ocorreu um erro desconhecido.")
      } else {
        toast.success(initialData?.id ? "Paciente atualizado com sucesso!" : "Paciente cadastrado com sucesso!")
        if (onSuccess) onSuccess()
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit as SubmitHandler<z.infer<typeof pacienteFormSchema>>, (err) => {
      toast.error("Por favor, preencha os campos obrigatórios corretamente.")
      console.error(err)
    })} className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-7 py-6 space-y-8">
        
        {/* IDENTIFICAÇÃO */}
        <section>
          <SectionHeader icon={User} title="Identificação do paciente" />
          <div className="space-y-4">
            <Field label="Nome completo" required error={errors.nome_completo?.message}>
              <Controller
                name="nome_completo"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    autoFocus
                    onChange={(e) => field.onChange(formatarNomeClinico(e.target.value))}
                    value={field.value == null ? "" : String(field.value)}
                    placeholder="NOME COMO CONSTA NO DOCUMENTO"
                    className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-wider"
                  />
                )}
              />
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Data de Nascimento" required error={errors.data_nascimento?.message}>
                <Controller
                  name="data_nascimento"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="date"
                      value={field.value == null ? "" : String(field.value)}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val) {
                          const parts = val.split('-');
                          if (parts[0] && parts[0].length > 4) {
                            parts[0] = parts[0].substring(0, 4);
                            val = parts.join('-');
                          }
                        }
                        field.onChange(val);
                      }}
                      min="1900-01-01"
                      max={new Date().toISOString().split("T")[0]}
                      className="rounded-none border border-border h-12 w-full px-2.5 font-bold bg-card text-xs tracking-wider cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  )}
                />
              </Field>
              <Field label="Sexo" required error={errors.sexo?.message}>
                <Controller
                  name="sexo"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value == null ? "" : String(field.value)} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full h-12 rounded-none border-border font-bold bg-card text-xs uppercase tracking-wider"><SelectValue placeholder="SELECIONE" /></SelectTrigger>
                      <SelectContent className="rounded-none border-none shadow-2xl">
                        <SelectItem value="M" className="font-bold uppercase text-[11px]">Masculino</SelectItem>
                        <SelectItem value="F" className="font-bold uppercase text-[11px]">Feminino</SelectItem>
                        <SelectItem value="Outro" className="font-bold uppercase text-[11px]">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Status do Cadastro" required error={errors.status_cadastro?.message}>
                <Controller
                  name="status_cadastro"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value == null ? "" : String(field.value)} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full h-12 rounded-none border-border font-bold bg-card text-xs uppercase tracking-wider"><SelectValue placeholder="SELECIONE" /></SelectTrigger>
                      <SelectContent className="rounded-none border-none shadow-2xl">
                        <SelectItem value="Ativo" className="font-bold uppercase text-[11px]">Ativo</SelectItem>
                        <SelectItem value="Inativo" className="font-bold uppercase text-[11px]">Inativo</SelectItem>
                        <SelectItem value="Obito" className="font-bold uppercase text-[11px]">Óbito</SelectItem>
                        <SelectItem value="Alta" className="font-bold uppercase text-[11px]">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="CNS" hint="15 dígitos" required error={errors.cns?.message}>
                <Controller
                  name="cns"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="campo-cns"
                      value={field.value == null ? "" : String(field.value)}
                      onChange={(e) => field.onChange(maskCNS(e.target.value))}
                      placeholder="000.0000.0000.0000"
                      className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-widest tabular-nums"
                      maxLength={19}
                    />
                  )}
                />
              </Field>
              <Field label="CPF" hint="Opcional" error={errors.cpf?.message}>
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value == null ? "" : String(field.value)}
                      onChange={(e) => field.onChange(maskCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-widest tabular-nums"
                      maxLength={14}
                    />
                  )}
                />
              </Field>
              <Field label="ID Legado (VBA)" hint="Opcional" error={errors.id_legado_vba?.message}>
                <Controller
                  name="id_legado_vba"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value == null ? "" : String(field.value)}
                      placeholder="EX: 1234"
                      className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-widest font-mono"
                    />
                  )}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome da mãe" required error={errors.nome_mae?.message}>
                <Controller
                  name="nome_mae"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value == null ? "" : String(field.value)}
                      onChange={(e) => field.onChange(formatarNomeClinico(e.target.value))}
                      placeholder="ESSENCIAL PARA BUSCAS NO SUS"
                      className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-wider"
                    />
                  )}
                />
              </Field>
              <Field label="Nome do pai" error={errors.nome_pai?.message}>
                <Controller
                  name="nome_pai"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value == null ? "" : String(field.value)}
                      onChange={(e) => field.onChange(formatarNomeClinico(e.target.value))}
                      placeholder="OPCIONAL"
                      className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-wider"
                    />
                  )}
                />
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-none border border-border bg-card p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vínculo Municipal</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-bold uppercase tracking-tight">O paciente é de município pactuado?</p>
              </div>
              <Controller
                name="pactuado"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            {pactuadoAtual && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <Field label="Município de Origem (Pactuado)" required error={errors.municipio_pactuado?.message}>
                  <Controller
                    name="municipio_pactuado"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value == null ? "" : String(field.value)} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full h-12 rounded-none border-border font-bold bg-card text-xs uppercase tracking-wider">
                          <SelectValue placeholder="SELECIONE O MUNICÍPIO" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none border-none shadow-2xl">
                          {["Angical", "Baianópolis", "Catolândia", "Cristópolis", "Formosa do Rio Preto", "Luís Eduardo Magalhães", "Mansidão", "Riachão das Neves", "Santa Rita de Cássia", "São Desidério", "Wanderley", "Outro"].map(m => (
                            <SelectItem key={m} value={m} className="font-bold uppercase text-[11px]">{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>
            )}
          </div>
        </section>

        {/* ENDEREÇO */}
        <section>
          <SectionHeader icon={Home} title="Endereço atual" />
          <div className="space-y-4">
            <div className="grid grid-cols-[140px_1fr] gap-4">
              <Field label="CEP" error={errors.endereco_cep?.message}>
                <Controller
                  name="endereco_cep"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value == null ? "" : String(field.value)}
                      onChange={(e) => field.onChange(maskCEP(e.target.value))}
                      placeholder="00000-000"
                      className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-widest tabular-nums"
                      maxLength={9}
                    />
                  )}
                />
              </Field>
              <Field label="Bairro" error={errors.bairro?.message}>
                <Controller
                  name="bairro"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value == null ? "" : String(field.value)} placeholder="NOME DO BAIRRO" className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-wider" />
                  )}
                />
              </Field>
            </div>
            <div className="grid grid-cols-[1fr_100px] gap-4">
              <Field label="Logradouro" error={errors.logradouro?.message}>
                <Controller
                  name="logradouro"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value == null ? "" : String(field.value)} placeholder="RUA OU AVENIDA" className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-wider" />
                  )}
                />
              </Field>
              <Field label="Nº" error={errors.numero?.message}>
                <Controller
                  name="numero"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value == null ? "" : String(field.value)} placeholder="S/N" className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-wider" />
                  )}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cidade" error={errors.cidade?.message}>
                <Controller
                  name="cidade"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value == null ? "" : String(field.value)} className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-wider" />
                  )}
                />
              </Field>
              <Field label="UF" error={errors.uf?.message}>
                <Controller
                  name="uf"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value == null ? "" : String(field.value)} maxLength={2} className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-wider" />
                  )}
                />
              </Field>
            </div>
          </div>
        </section>

        {/* CONTATOS */}
        <section>
          <SectionHeader icon={Phone} title="Contatos" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Telefone Principal" error={errors.telefone_principal?.message}>
                <Controller
                  name="telefone_principal"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value == null ? "" : String(field.value)}
                      onChange={(e) => field.onChange(maskPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-widest tabular-nums"
                      maxLength={15}
                    />
                  )}
                />
              </Field>
              <Field label="Telefone Secundário" error={errors.telefone_secundario?.message}>
                <Controller
                  name="telefone_secundario"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value == null ? "" : String(field.value)}
                      onChange={(e) => field.onChange(maskPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-widest tabular-nums"
                      maxLength={15}
                    />
                  )}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome do responsável" error={errors.nome_responsavel?.message}>
                <Controller
                  name="nome_responsavel"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} value={field.value == null ? "" : String(field.value)} onChange={(e) => field.onChange(formatarNomeClinico(e.target.value))} className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-wider" />
                  )}
                />
              </Field>
              <Field label="Telefone do Responsável" error={errors.telefone_responsavel?.message}>
                <Controller
                  name="telefone_responsavel"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value == null ? "" : String(field.value)}
                      onChange={(e) => field.onChange(maskPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-widest tabular-nums"
                      maxLength={15}
                    />
                  )}
                />
              </Field>
            </div>
          </div>
        </section>

        {/* CLÍNICA E LOGÍSTICA */}
        <section>
          <SectionHeader icon={Stethoscope} title="Informações clínicas e logística" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="CID Principal" error={errors.cid_principal?.message}>
                <Controller
                  name="cid_principal"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      {...field}
                      value={field.value == null ? "" : String(field.value)} 
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())} 
                      placeholder="EX: F84.0"
                      className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-widest"
                    />
                  )}
                />
              </Field>
              <Field label="CID Secundário" error={errors.cid_secundario?.message}>
                <Controller
                  name="cid_secundario"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      {...field}
                      value={field.value || ""} 
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())} 
                      placeholder="OPCIONAL"
                      className="rounded-none border-border h-12 font-bold focus-visible:ring-primary bg-card uppercase text-xs tracking-widest"
                    />
                  )}
                />
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-none border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-none">
                  <Truck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Necessita de Transporte?</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 font-bold uppercase tracking-tight">Ativa a visualização para motoristas</p>
                </div>
              </div>
              <Controller
                name="necessita_transporte"
                control={control}
                render={({ field }) => (
                  <Switch 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                )}
              />
            </div>

            <Field label="Tags de Acessibilidade / Observações de Risco" error={errors.tags_acessibilidade?.message}>
              <Controller
                name="tags_acessibilidade"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2 p-3 border rounded-none bg-card min-h-[80px]">
                    {TAGS_ACESSIBILIDADE.map((tag: TagAcessibilidade) => (
                      <Button
                        key={tag}
                        type="button"
                        variant={field.value?.includes(tag) ? "default" : "outline"}
                        className="h-8 rounded-none border-border font-bold uppercase tracking-widest text-[10px] px-2"
                        onClick={() => {
                          const current = field.value || []
                          if (current.includes(tag)) {
                            field.onChange(current.filter((t: string) => t !== tag))
                          } else {
                            field.onChange([...current, tag])
                          }
                        }}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                )}
              />
            </Field>
          </div>
        </section>

      </div>

      {/* FOOTER */}
      <div className="shrink-0 border-t bg-background px-7 py-5 flex gap-3">
        <Button type="button" variant="outline" className="flex-1 h-14 rounded-none border-border font-bold uppercase tracking-widest text-muted-foreground" onClick={onCancel} disabled={isPending}>
          CANCELAR
        </Button>
        <Button type="submit" className="flex-1 h-14 rounded-none bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-lg shadow-primary/20 gap-2" disabled={isPending}>
          {isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" />SALVANDO...</>
          ) : (
            <>{initialData?.id ? "SALVAR ALTERAÇÕES" : "CADASTRAR PACIENTE"}<CheckCircle2 className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </form>
  )
}
