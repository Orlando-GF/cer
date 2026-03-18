// 1. Externos
import { useState, useEffect, useMemo } from "react";
import { format, startOfDay, endOfDay, parseISO, isValid } from "date-fns";
import { Truck, MapPin, Accessibility, Phone, User } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// 2. Internos
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { buscarAgendaLogistica } from "@/actions";
import { projectAgendaSessions } from "@/lib/agenda-utils";

// 3. Tipos
import type { AgendaSession } from "@/types";

export function ViewLogistica(): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [sessões, setSessões] = useState<AgendaSession[]>([]);
  const [loading, setLoading] = useState(false);

  // Sincronizar com URL de forma estável para evitar loop de renderização
  const dataSelecionada = useMemo(() => {
    const dateParam = searchParams.get("date");
    if (dateParam && isValid(parseISO(dateParam))) {
      return parseISO(dateParam);
    }
    return startOfDay(new Date());
  }, [searchParams]); // Só muda se os parâmetros da URL mudarem

  const setUrlParams = (
    paramsToUpdate: Record<string, string | null | undefined>,
  ): void => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    async function updateLogistica() {
      setLoading(true);
      const start = startOfDay(dataSelecionada).toISOString();
      const end = endOfDay(dataSelecionada).toISOString();

      const res = await buscarAgendaLogistica(start, end);
      if (res.success && res.data) {
        // O motor funciona igual, mas os dados vêm filtrados por necessidade de transporte
        const projetadas = projectAgendaSessions(
          res.data.vagas,
          res.data.hist,
          dataSelecionada,
          dataSelecionada,
        );
        setSessões(projetadas);
      }
    }
    updateLogistica();
  }, [dataSelecionada]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-5 rounded-none border border-border shadow-none">
        <div className="flex items-center gap-4">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-foreground tracking-tight">
              Transporte da data
            </h3>
            <Input
              type="date"
              className="w-full"
              value={format(dataSelecionada, "yyyy-MM-dd")}
              onChange={(e) => setUrlParams({ date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Badge className="bg-primary/10 text-primary border-transparent px-3 py-1 flex gap-2">
            <Truck className="h-4 w-4" /> Rota do dia
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Card className="border-border shadow-none overflow-hidden bg-card rounded-none">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-[80px]">Hora</TableHead>
                  <TableHead>Paciente / Morada</TableHead>
                  <TableHead>Acessibilidade Crítica</TableHead>
                  <TableHead>Terapeuta / Destino</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      Carregando rota...
                    </TableCell>
                  </TableRow>
                ) : sessões.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-12 text-muted-foreground"
                    >
                      Nenhum paciente necessita de transporte hoje.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessões.map((sessao) => (
                    <TableRow key={sessao.id} className="hover:bg-muted border-border transition-colors">
                      <TableCell className="font-bold tabular-nums text-muted-foreground">
                        {format(sessao.data_hora_inicio, "HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">
                            {sessao.paciente_nome}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {sessao.paciente_logradouro ||
                              "Endereço não informado"}
                            , {sessao.paciente_numero} -{" "}
                            {sessao.paciente_bairro}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sessao.tags_acessibilidade?.map((tag: string) => (
                            <Badge
                              key={tag}
                              className="bg-alert-danger-bg text-alert-danger-text border-alert-danger-text/20 text-[9px] px-1.5 py-0 rounded-none shadow-none"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {(!sessao.tags_acessibilidade ||
                            sessao.tags_acessibilidade.length === 0) && (
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              Sem restrições
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-none bg-muted flex items-center justify-center text-muted-foreground border border-border">
                            <User className="h-3 w-3" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">
                              {sessao.profissional_nome}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              {sessao.especialidade_nome}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-4">
          <div className="p-4 bg-alert-warning-bg rounded-none border border-alert-warning-text/20 space-y-3">
            <h3 className="text-sm font-bold text-alert-warning-text flex items-center gap-2">
              <Accessibility className="h-4 w-4" /> Resumo de críticos
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-alert-warning-text font-semibold">Cadeirantes</span>
                <Badge className="bg-alert-warning-text/20 text-alert-warning-text border-none shadow-none rounded-none tabular-nums font-bold">
                  {
                    sessões.filter((s) =>
                      s.tags_acessibilidade?.includes("Cadeirante"),
                    ).length
                  }
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-alert-warning-text font-semibold">Uso de Oxigênio</span>
                <Badge className="bg-alert-warning-text/20 text-alert-warning-text border-none shadow-none rounded-none tabular-nums font-bold">
                  {
                    sessões.filter((s) =>
                      s.tags_acessibilidade?.includes("Uso de Oxigénio"),
                    ).length
                  }
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-alert-warning-text font-semibold">Acamados/Maca</span>
                <Badge className="bg-alert-warning-text/20 text-alert-warning-text border-none shadow-none rounded-none tabular-nums font-bold">
                  {
                    sessões.filter((s) =>
                      s.tags_acessibilidade?.includes("Acamado/Uso de Maca"),
                    ).length
                  }
                </Badge>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-12 text-muted-foreground border-border rounded-none shadow-none hover:bg-muted"
          >
            <Phone className="h-4 w-4" /> Contatos da Logística
          </Button>
        </div>
      </div>
    </div>
  );
}
