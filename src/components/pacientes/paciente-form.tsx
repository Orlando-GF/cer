"use client"

import { useState, useTransition, useCallback, useEffect } from "react"
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
  X,
  Stethoscope,
  Truck,
  Tag,
} from "lucide-react"
import { cadastrarPaciente, atualizarPaciente, type ActionResponse } from "@/actions"
import { useRouter } from "next/navigation"
import { formatarNomeClinico, buscarEnderecoPorCep } from "@/lib/utils/string-utils"

// ─── tipos ────────────────────────────────────────────────────────────────────

export interface PacienteFormData {
  id?: string
  nome_completo?: string
  data_nascimento?: string
  sexo?: string
  nome_mae?: string
  nome_pai?: string
  cns?: string
  cpf?: string
  endereco_cep?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  uf?: string
  telefone_principal?: string
  telefone_secundario?: string
  nome_responsavel?: string
  telefone_responsavel?: string
  pactuado?: boolean
  municipio_pactuado?: string
  cid_principal?: string
  cid_secundario?: string
  necessita_transporte?: boolean
  tags_acessibilidade?: string[]
  id_legado_vba?: string
  status_cadastro?: "Ativo" | "Inativo" | "Obito" | "Alta"
}

// ─── funções de máscara ───────────────────────────────────────────────────────

const onlyDigits = (v: string) => v.replace(/\D/g, "")

function maskCPF(value: string): string {
  const d = onlyDigits(value).substring(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function maskCNS(value: string): string {
  return onlyDigits(value).substring(0, 15)
}

function maskPhone(value: string): string {
  const d = onlyDigits(value).substring(0, 11)
  if (d.length === 0) return ""
  if (d.length <= 2) return `(${d}`
  if (d.length <= 3) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
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
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
      <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 shrink-0">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <span className="text-xs font-semibold tracking-widest text-slate-500">{title}</span>
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
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

interface PacienteFormProps {
  initialData?: PacienteFormData
  onSuccess?: () => void
  onCancel?: () => void
}

export function PacienteForm({ initialData, onSuccess, onCancel }: PacienteFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [dados, setDados] = useState<PacienteFormData>(initialData || {
    cidade: "Barreiras",
    uf: "BA",
    sexo: "M",
    pactuado: false,
    municipio_pactuado: "",
    necessita_transporte: false,
    tags_acessibilidade: [],
    id_legado_vba: "",
    status_cadastro: "Ativo"
  })

  // Aplica máscaras nos dados iniciais se existirem
  useEffect(() => {
    if (initialData) {
      setDados({
        ...initialData,
        cpf: initialData.cpf ? maskCPF(initialData.cpf) : "",
        cns: initialData.cns ? maskCNS(initialData.cns) : "",
        endereco_cep: initialData.endereco_cep ? maskCEP(initialData.endereco_cep) : "",
        telefone_principal: initialData.telefone_principal ? maskPhone(initialData.telefone_principal) : "",
        telefone_secundario: initialData.telefone_secundario ? maskPhone(initialData.telefone_secundario) : "",
        telefone_responsavel: initialData.telefone_responsavel ? maskPhone(initialData.telefone_responsavel) : "",
      })
    }
  }, [initialData])

  // Busca CEP automática
  useEffect(() => {
    const cepLimpo = (dados.endereco_cep || "").replace(/\D/g, "")
    if (cepLimpo.length === 8) {
      const timer = setTimeout(async () => {
        const info = await buscarEnderecoPorCep(cepLimpo)
        if (info) {
          setDados(prev => ({
            ...prev,
            logradouro: prev.logradouro || info.logradouro,
            bairro: prev.bairro || info.bairro,
            cidade: info.cidade,
            uf: info.uf
          }))
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [dados.endereco_cep])

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const setField = useCallback((field: keyof PacienteFormData) => 
    (v: any) => setDados((d) => ({ ...d, [field]: v })), 
  [])

  function validateField(name: string, value: string) {
    const errors: Record<string, string> = {}
    const digits = onlyDigits(value)
    
    if (name === "cns" && digits.length > 0 && digits.length !== 15) {
      errors.cns = "CNS deve ter 15 dígitos"
    }
    if (name === "cpf" && digits.length > 0 && digits.length !== 11) {
      errors.cpf = "CPF deve ter 11 dígitos"
    }
    if (name === "endereco_cep" && digits.length > 0 && digits.length !== 8) {
      errors.endereco_cep = "CEP deve ter 8 dígitos"
    }
    setFieldErrors((prev) => ({ ...prev, ...errors, [name]: errors[name] || "" }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    const payload = {
      ...dados,
      cns: onlyDigits(dados.cns || ""),
      cpf: onlyDigits(dados.cpf || "") || undefined,
      endereco_cep: onlyDigits(dados.endereco_cep || "") || undefined,
      telefone_principal: onlyDigits(dados.telefone_principal || "") || undefined,
      telefone_secundario: onlyDigits(dados.telefone_secundario || "") || undefined,
      telefone_responsavel: onlyDigits(dados.telefone_responsavel || "") || undefined,
    }

    startTransition(async () => {
      const result: ActionResponse = dados.id 
        ? await atualizarPaciente(dados.id, payload)
        : await cadastrarPaciente(payload)

      if (!result.success) {
        setSubmitError(result.error || "Ocorreu um erro desconhecido.")
      } else {
        if (onSuccess) onSuccess()
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-7 py-6 space-y-8">
        
        {/* IDENTIFICAÇÃO */}
        <section>
          <SectionHeader icon={User} title="Identificação do paciente" />
          <div className="space-y-4">
            <Field label="Nome completo" required>
              <Input
                value={dados.nome_completo || ""}
                onChange={(e) => setField("nome_completo")(formatarNomeClinico(e.target.value))}
                placeholder="Nome como consta no documento"
                required
              />
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Data de Nascimento" required>
                <Input
                  type="date"
                  value={dados.data_nascimento || ""}
                  onChange={(e) => setField("data_nascimento")(e.target.value)}
                  required
                />
              </Field>
              <Field label="Sexo" required>
                <Select value={dados.sexo} onValueChange={(v) => setField("sexo")(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status do Cadastro" required>
                <Select value={dados.status_cadastro} onValueChange={(v) => setField("status_cadastro")(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Obito">Óbito</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="CNS" hint="15 dígitos" error={fieldErrors.cns}>
                <Input
                  value={dados.cns || ""}
                  onChange={(e) => setField("cns")(maskCNS(e.target.value))}
                  onBlur={(e) => validateField("cns", e.target.value)}
                  placeholder="000.0000.0000.0000"
                  className="font-mono tracking-wider tabular-nums"
                  maxLength={19}
                />
              </Field>
              <Field label="CPF" hint="Opcional" error={fieldErrors.cpf}>
                <Input
                  value={dados.cpf || ""}
                  onChange={(e) => setField("cpf")(maskCPF(e.target.value))}
                  onBlur={(e) => validateField("cpf", e.target.value)}
                  placeholder="000.000.000-00"
                  className="font-mono tracking-wider tabular-nums"
                  maxLength={14}
                />
              </Field>
              <Field label="ID Legado (VBA)" hint="Opcional">
                <Input
                  value={dados.id_legado_vba || ""}
                  onChange={(e) => setField("id_legado_vba")(e.target.value)}
                  placeholder="Ex: 1234"
                  className="font-mono"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome da mãe" required>
                <Input
                  value={dados.nome_mae || ""}
                  onChange={(e) => setField("nome_mae")(formatarNomeClinico(e.target.value))}
                  placeholder="Essencial para buscas no SUS"
                  required
                />
              </Field>
              <Field label="Nome do pai">
                <Input
                  value={dados.nome_pai || ""}
                  onChange={(e) => setField("nome_pai")(formatarNomeClinico(e.target.value))}
                  placeholder="Opcional"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-sm font-medium text-slate-800">Vínculo Municipal</p>
                <p className="text-xs text-slate-500 mt-0.5">O paciente é de município pactuado?</p>
              </div>
              <Switch checked={dados.pactuado} onCheckedChange={(v) => setField("pactuado")(v)} />
            </div>

            {dados.pactuado && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <Field label="Município de Origem (Pactuado)" required>
                  <Select value={dados.municipio_pactuado || ""} onValueChange={(v) => setField("municipio_pactuado")(v)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione o município" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Angical">Angical</SelectItem>
                      <SelectItem value="Baianópoliss">Baianópolis</SelectItem>
                      <SelectItem value="Catolândia">Catolândia</SelectItem>
                      <SelectItem value="Cristópolis">Cristópolis</SelectItem>
                      <SelectItem value="Formosa do Rio Preto">Formosa do Rio Preto</SelectItem>
                      <SelectItem value="Luís Eduardo Magalhães">Luís Eduardo Magalhães</SelectItem>
                      <SelectItem value="Mansidão">Mansidão</SelectItem>
                      <SelectItem value="Riachão das Neves">Riachão das Neves</SelectItem>
                      <SelectItem value="Santa Rita de Cássia">Santa Rita de Cássia</SelectItem>
                      <SelectItem value="São Desidério">São Desidério</SelectItem>
                      <SelectItem value="Wanderley">Wanderley</SelectItem>
                      <SelectItem value="Outro">Outro município pactuado</SelectItem>
                    </SelectContent>
                  </Select>
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
              <Field label="CEP" error={fieldErrors.endereco_cep}>
                <Input
                  value={dados.endereco_cep || ""}
                  onChange={(e) => setField("endereco_cep")(maskCEP(e.target.value))}
                  onBlur={(e) => validateField("endereco_cep", e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </Field>
              <Field label="Bairro">
                <Input value={dados.bairro || ""} onChange={(e) => setField("bairro")(e.target.value)} placeholder="Nome do bairro" />
              </Field>
            </div>
            <div className="grid grid-cols-[1fr_100px] gap-4">
              <Field label="Logradouro">
                <Input value={dados.logradouro || ""} onChange={(e) => setField("logradouro")(e.target.value)} placeholder="Rua ou Avenida" />
              </Field>
              <Field label="Nº">
                <Input value={dados.numero || ""} onChange={(e) => setField("numero")(e.target.value)} placeholder="S/N" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cidade">
                <Input value={dados.cidade || ""} onChange={(e) => setField("cidade")(e.target.value)} />
              </Field>
              <Field label="UF">
                <Input value={dados.uf || ""} onChange={(e) => setField("uf")(e.target.value)} maxLength={2} className="uppercase" />
              </Field>
            </div>
          </div>
        </section>

        {/* CONTATOS */}
        <section>
          <SectionHeader icon={Phone} title="Contatos" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Telefone Principal">
                <Input
                  value={dados.telefone_principal || ""}
                  onChange={(e) => setField("telefone_principal")(maskPhone(e.target.value))}
                  placeholder="(77) 99999-9999"
                  maxLength={15}
                />
              </Field>
              <Field label="Telefone Secundário">
                <Input
                  value={dados.telefone_secundario || ""}
                  onChange={(e) => setField("telefone_secundario")(maskPhone(e.target.value))}
                  placeholder="(77) 99999-9999"
                  maxLength={15}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome do responsável">
                <Input value={dados.nome_responsavel || ""} onChange={(e) => setField("nome_responsavel")(formatarNomeClinico(e.target.value))} />
              </Field>
              <Field label="Telefone do Responsável">
                <Input
                  value={dados.telefone_responsavel || ""}
                  onChange={(e) => setField("telefone_responsavel")(maskPhone(e.target.value))}
                  placeholder="(77) 99999-9999"
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
              <Field label="CID Principal">
                <Input 
                  value={dados.cid_principal || ""} 
                  onChange={(e) => setField("cid_principal")(e.target.value.toUpperCase())} 
                  placeholder="Ex: F84.0"
                />
              </Field>
              <Field label="CID Secundário">
                <Input 
                  value={dados.cid_secundario || ""} 
                  onChange={(e) => setField("cid_secundario")(e.target.value.toUpperCase())} 
                  placeholder="Opcional"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Necessita de Transporte?</p>
                  <p className="text-xs text-slate-500 mt-0.5">Ativa a visualização para motoristas</p>
                </div>
              </div>
              <Switch 
                checked={dados.necessita_transporte} 
                onCheckedChange={(v) => setField("necessita_transporte")(v)} 
              />
            </div>

            <Field label="Tags de Acessibilidade / Observações de Risco">
              <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-white min-h-[80px]">
                {["Cadeirante", "Acamado", "Risco Agitação", "Deficiência Visual", "Deficiência Auditiva", "Uso de Maca"].map(tag => (
                  <Button
                    key={tag}
                    type="button"
                    variant={dados.tags_acessibilidade?.includes(tag) ? "default" : "outline"}
                    className="h-7 text-xs px-2 py-0"
                    onClick={() => {
                      const current = dados.tags_acessibilidade || []
                      if (current.includes(tag)) {
                        setField("tags_acessibilidade")(current.filter(t => t !== tag))
                      } else {
                        setField("tags_acessibilidade")([...current, tag])
                      }
                    }}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </Field>
          </div>
        </section>

        {submitError && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <X className="w-4 h-4 shrink-0 mt-0.5" />
            {submitError}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t bg-white px-7 py-4 flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 gap-2" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {dados.id ? "Salvar Alterações" : "Cadastrar Paciente"}
        </Button>
      </div>
    </form>
  )
}
