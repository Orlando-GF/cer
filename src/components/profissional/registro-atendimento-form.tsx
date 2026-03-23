'use client'

import { useTransition, useEffect } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { registrarSessaoHistorico } from '@/actions'
import { agendamentoHistoricoSchema } from '@/lib/validations/schema'

type FormValues = z.input<typeof agendamentoHistoricoSchema>

interface RegistroAtendimentoFormProps {
  pacienteId: string
  profissionalId: string
  especialidadeId: string
  vagaFixaId?: string
  dataHoraInicio?: string
  dataHoraFim?: string
  onSuccess: () => void
}

export function RegistroAtendimentoForm({
  pacienteId,
  profissionalId,
  especialidadeId,
  vagaFixaId,
  dataHoraInicio,
  dataHoraFim,
  onSuccess,
}: RegistroAtendimentoFormProps) {
  const [isPending, startTransition] = useTransition()
  const DRAFT_KEY = `draft_evolucao_${pacienteId}_${vagaFixaId ?? 'avulso'}`

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(agendamentoHistoricoSchema),
    defaultValues: {
      paciente_id: pacienteId,
      profissional_id: profissionalId,
      especialidade_id: especialidadeId,
      vaga_fixa_id: vagaFixaId || undefined,
      data_hora_inicio: dataHoraInicio || new Date().toISOString(),
      data_hora_fim: dataHoraFim || undefined,
      status_comparecimento: 'Presente',
      evolucao_clinica: undefined,
      conduta: undefined,
      tipo_vaga: 'Regular',
      tipo_agendamento: 'Individual',
    },
  })

  const status = useWatch({ control, name: 'status_comparecimento' })
  const evolucaoAtual = useWatch({ control, name: 'evolucao_clinica' })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const rascunho = localStorage.getItem(DRAFT_KEY)
    if (rascunho) {
      setValue('evolucao_clinica', rascunho)
      toast.info('Rascunho recuperado automaticamente.', {
        position: 'top-center',
      })
    }
  }, [DRAFT_KEY, setValue])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (evolucaoAtual && evolucaoAtual.length > 5) {
      localStorage.setItem(DRAFT_KEY, evolucaoAtual)
    } else if (evolucaoAtual === '') {
      localStorage.removeItem(DRAFT_KEY)
    }
  }, [evolucaoAtual, DRAFT_KEY])

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const payload: FormValues = {
        ...data,
        data_hora_fim:
          data.status_comparecimento === 'Presente'
            ? new Date().toISOString()
            : data.data_hora_fim,
      }

      const result = await registrarSessaoHistorico(payload)

      if (result.success) {
        toast.success('Atendimento registrado com sucesso!')
        if (typeof window !== 'undefined') localStorage.removeItem(DRAFT_KEY)
        onSuccess()
      } else {
        toast.error(result.error ?? 'Erro ao registrar atendimento')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="status_comparecimento"
            className="text-muted-foreground text-[10px] font-black tracking-widest uppercase"
          >
            Status do Atendimento
          </Label>
          <Controller
            name="status_comparecimento"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger
                  id="status_comparecimento"
                  className="border-border h-12 rounded-none text-xs font-bold uppercase"
                >
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-none shadow-2xl">
                  <SelectItem
                    value="Presente"
                    className="text-[11px] font-bold uppercase"
                  >
                    Presente
                  </SelectItem>
                  <SelectItem
                    value="Falta Justificada"
                    className="text-[11px] font-bold uppercase"
                  >
                    Falta Justificada
                  </SelectItem>
                  <SelectItem
                    value="Falta Nao Justificada"
                    className="text-[11px] font-bold uppercase"
                  >
                    Falta Não Justificada
                  </SelectItem>
                  <SelectItem
                    value="Cancelado"
                    className="text-[11px] font-bold uppercase"
                  >
                    Cancelado
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.status_comparecimento && (
            <p className="text-alert-danger-text text-xs">
              {errors.status_comparecimento.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="evolucao_clinica"
              className="text-muted-foreground text-[10px] font-black tracking-widest uppercase"
            >
              Evolução Clínica{' '}
              {status === 'Presente' && (
                <span className="text-alert-danger-text">*</span>
              )}
            </Label>
            {evolucaoAtual && evolucaoAtual.length > 5 && (
              <span className="text-muted-foreground bg-muted px-2 py-0.5 text-[9px] font-bold uppercase">
                Rascunho Salvo
              </span>
            )}
          </div>
          <Controller
            name="evolucao_clinica"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id="evolucao_clinica"
                placeholder="Descreva a evolução do paciente nesta sessão..."
                rows={10}
                className={`border-border focus-visible:ring-primary bg-card resize-none rounded-none text-sm ${errors.evolucao_clinica ? 'border-alert-danger-text' : ''}`}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value || null)}
              />
            )}
          />
          {errors.evolucao_clinica && (
            <p className="text-alert-danger-text text-xs">
              {errors.evolucao_clinica.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="conduta"
            className="text-muted-foreground text-[10px] font-black tracking-widest uppercase"
          >
            Conduta / Próximos Passos
          </Label>
          <Controller
            name="conduta"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                id="conduta"
                placeholder="Orientações, encaminhamentos ou conduta terapêutica..."
                rows={4}
                className={`border-border focus-visible:ring-primary bg-card resize-none rounded-none text-sm ${errors.conduta ? 'border-alert-danger-text' : ''}`}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value || null)}
              />
            )}
          />
          {errors.conduta && (
            <p className="text-alert-danger-text text-xs">
              {errors.conduta.message}
            </p>
          )}
        </div>
      </div>

      <div className="border-border border-t pt-4">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 shadow-primary/20 h-14 w-full rounded-none font-bold tracking-widest text-white uppercase shadow-lg"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> SALVANDO
              EVOLUÇÃO...
            </>
          ) : (
            'REGISTRAR ATENDIMENTO'
          )}
        </Button>
      </div>
    </form>
  )
}
