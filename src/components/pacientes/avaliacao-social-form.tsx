"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save } from "lucide-react"
import { avaliacaoServicoSocialSchema } from "@/lib/validations/schema"
import { cadastrarAvaliacaoSocial } from "@/actions"
import { toast } from "sonner"

interface AvaliacaoSocialFormProps {
  pacienteId: string
  onSuccess?: () => void
  onCancel?: () => void
}

// ─── componentes locais de consistência ──────────────────────────────────────────

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
function Field({ label, required, children, error }: { label: string; required?: boolean; children: React.ReactNode; error?: any }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-[10px] text-destructive font-bold uppercase">{error}</p>}
    </div>
  )
}

export function AvaliacaoSocialForm({ pacienteId, onSuccess, onCancel }: AvaliacaoSocialFormProps) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(avaliacaoServicoSocialSchema),
    defaultValues: {
      paciente_id: pacienteId,
      profissional_id: "00000000-0000-0000-0000-000000000000",
      quantidade_membros_familia: 1,
      renda_familiar_total: 0,
      recebe_beneficio: false,
      tipo_beneficio: null,
      tipo_moradia: "Propria",
      tem_saneamento_basico: true,
      tem_energia_eletrica: true,
      data_avaliacao: new Date().toISOString().split("T")[0],
      impacto_incapacidade_trabalho: null,
      descricao_barreiras_arquitetonicas: null,
      relatorio_social: "",
      parecer_final: "",
    },
  })

  // Watch fields for conditional rendering or state-dependent components
  // eslint-disable-next-line react-hooks/incompatible-library
  const recebeBeneficio = watch("recebe_beneficio")

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    startTransition(async () => {
      const resp = await cadastrarAvaliacaoSocial(data)
      if (resp.success) {
        toast.success("Avaliação social registrada com sucesso!")
        onSuccess?.()
      } else {
        toast.error(resp.error || "Erro ao registrar avaliação")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
        
        {/* Composição Familiar */}
        <section className="bg-card p-6 rounded-none border border-border shadow-sm">
          <SectionHeader icon={Save} title="Composição Familiar e Renda" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Field label="Membros na Família" required error={errors.quantidade_membros_familia?.message as any}>
              <Input 
                id="quantidade_membros_familia" 
                type="number" 
                {...register("quantidade_membros_familia", { valueAsNumber: true })} 
                className="rounded-none border-border h-12 font-bold"
              />
            </Field>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Field label="Renda Familiar Total (R$)" required error={errors.renda_familiar_total?.message as any}>
              <Input 
                id="renda_familiar_total" 
                type="number" 
                step="0.01"
                {...register("renda_familiar_total", { valueAsNumber: true })} 
                className="rounded-none border-border h-12 font-bold"
              />
            </Field>
          </div>

          <div className="mt-4 p-4 border border-border/50 bg-muted/5 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="recebe_beneficio" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recebe Benefício?</Label>
              <Switch 
                id="recebe_beneficio"
                checked={recebeBeneficio}
                onCheckedChange={(val) => setValue("recebe_beneficio", val)}
              />
            </div>

            {recebeBeneficio && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                <Field label="Ex: BPC, Bolsa Família..." required={recebeBeneficio}>
                  <Input 
                    id="tipo_beneficio" 
                    {...register("tipo_beneficio")} 
                    className="rounded-none border-border h-12 font-bold"
                  />
                </Field>
              </div>
            )}
          </div>
        </section>

        {/* Moradia */}
        <section className="bg-card p-6 rounded-none border border-border shadow-sm">
          <SectionHeader icon={Save} title="Moradia e Saneamento" />
          <div className="space-y-4">
            <Field label="Tipo de Moradia" required>
              <Select onValueChange={(val) => setValue("tipo_moradia", val as "Propria" | "Alugada" | "Cedida" | "Financiada")} defaultValue="Propria">
                <SelectTrigger className="rounded-none border-border h-12 font-bold text-xs uppercase tracking-wider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Propria" className="font-bold uppercase text-[11px]">Própria</SelectItem>
                  <SelectItem value="Alugada" className="font-bold uppercase text-[11px]">Alugada</SelectItem>
                  <SelectItem value="Cedida" className="font-bold uppercase text-[11px]">Cedida</SelectItem>
                  <SelectItem value="Financiada" className="font-bold uppercase text-[11px]">Financiada</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border border-border/50">
                <Label htmlFor="tem_saneamento_basico" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Saneamento</Label>
                <Switch 
                  id="tem_saneamento_basico"
                  defaultChecked
                  onCheckedChange={(val) => setValue("tem_saneamento_basico", val)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border/50">
                <Label htmlFor="tem_energia_eletrica" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Energia</Label>
                <Switch 
                  id="tem_energia_eletrica"
                  defaultChecked
                  onCheckedChange={(val) => setValue("tem_energia_eletrica", val)}
                />
              </div>
            </div>

            <Field label="Impacto de Incapacidade no Trabalho">
              <Input 
                id="impacto_incapacidade_trabalho" 
                {...register("impacto_incapacidade_trabalho")} 
                className="rounded-none border-border h-12 font-bold"
                placeholder="Ex: Impede atividade laboral..."
              />
            </Field>
          </div>
        </section>

        {/* Barreiras e Relatório */}
        <section className="bg-card p-6 rounded-none border border-border shadow-sm">
          <SectionHeader icon={Save} title="Relatório e Parecer" />
          <div className="space-y-6">
            <Field label="Barreiras Arquitetônicas / Domiciliares">
              <Textarea 
                id="descricao_barreiras_arquitetonicas" 
                {...register("descricao_barreiras_arquitetonicas")} 
                className="rounded-none border-border min-h-[80px]"
                placeholder="Descreva se há escadas, portas estreitas, falta de rampa..."
              />
            </Field>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Field label="Relatório Social Detalhado" required error={errors.relatorio_social?.message as any}>
              <Textarea 
                id="relatorio_social" 
                {...register("relatorio_social")} 
                className="rounded-none border-border min-h-[150px]"
                placeholder="Narrativa sobre a situação socioeconômica e dinâmica familiar..."
              />
            </Field>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Field label="Parecer Final / Conduta" required error={errors.parecer_final?.message as any}>
              <Input 
                id="parecer_final" 
                {...register("parecer_final")} 
                className="rounded-none border-border h-12 font-bold"
                placeholder="Ex: Encaminhamento para CRAS..."
              />
            </Field>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <div className="shrink-0 border-t bg-card px-7 py-5 flex gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-14 rounded-none border-border font-bold uppercase tracking-widest text-muted-foreground">
            CANCELAR
          </Button>
        )}
        <Button disabled={isPending} type="submit" className="flex-1 h-14 rounded-none bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-lg shadow-primary/20 gap-2">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              SALVANDO...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              SALVAR AVALIAÇÃO SOCIAL
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
