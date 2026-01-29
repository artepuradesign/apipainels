import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, FileText, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { consultasCpfHistoryService, type ConsultaCpfHistoryItem } from '@/services/consultasCpfHistoryService';
import { consultationsService } from '@/services/consultationsService';
import { toast } from 'sonner';

const formatCPF = (cpf: string) => {
  if (!cpf || cpf === 'CPF consultado') return 'N/A';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 11) return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  return cpf;
};

const formatFullDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const HistoricoConsultasCpf: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ConsultaCpfHistoryItem[]>([]);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await consultasCpfHistoryService.getHistory(1, 200);
      if (res.success && res.data?.data) {
        setItems(res.data.data);
      } else {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = items.length;

  const openConsultation = async (item: ConsultaCpfHistoryItem) => {
    // Recarregar do banco (API) e abrir na tela de consulta SEM cobrar
    setOpeningId(item.id);
    try {
      const res = await consultationsService.getById(item.id);

      if (!res.success || !res.data) {
        toast.error(res.message || res.error || 'Não foi possível carregar a consulta');
        return;
      }

      const consultationData = (res.data as any).result_data ?? res.data;
      const cpf = (res.data as any).document ?? item.document;

      navigate('/dashboard/consultar-cpf-puxa-tudo', {
        state: {
          fromHistory: true,
          consultationData,
          cpf,
          noCharge: true,
        },
      });
    } catch (e) {
      console.error('❌ [HIST_CPF] Erro ao abrir consulta:', e);
      toast.error('Erro ao abrir consulta');
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="px-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <FileText className="h-4 w-4 md:h-5 md:w-5" />
                Histórico de Consultas (CPF)
              </CardTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{total} registros</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Toque em um registro para recarregar do banco e abrir sem cobrança.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/consultar-cpf-puxa-tudo')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="h-9 w-9 p-0" aria-label="Atualizar">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span className="ml-3 text-muted-foreground">Carregando histórico...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma consulta encontrada.
            </div>
          ) : isMobile ? (
            <div className="space-y-2">
              {items.map((item) => {
                const isOpening = openingId === item.id;

                return (
                  <button
                    key={`${item.source_table}-${item.id}`}
                    type="button"
                    onClick={() => openConsultation(item)}
                    disabled={openingId !== null}
                    className="w-full text-left rounded-lg border border-border bg-card px-3 py-3 disabled:opacity-60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              item.status === 'completed'
                                ? 'inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full bg-success'
                                : 'inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full bg-muted'
                            }
                            aria-label={item.status === 'completed' ? 'Concluída' : item.status}
                            title={item.status === 'completed' ? 'Concluída' : item.status}
                          />
                          <div className="font-mono text-xs truncate">{formatCPF(item.document)}</div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{formatFullDate(item.created_at)}</div>
                      </div>

                      {isOpening ? (
                        <div className="mt-0.5 animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      ) : (
                        <div className="text-right">
                          <div className="text-xs font-medium text-destructive">{formatCurrency(Number(item.cost) || 0)}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">abrir</div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}

            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-52 whitespace-nowrap">CPF</TableHead>
                  <TableHead className="whitespace-nowrap">Data e Hora</TableHead>
                  <TableHead className="w-32 text-right whitespace-nowrap">Valor</TableHead>
                  <TableHead className="w-28 text-center whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={`${item.source_table}-${item.id}`}
                    className="cursor-pointer"
                    onClick={() => openConsultation(item)}
                  >
                    <TableCell className="font-mono text-sm whitespace-nowrap">{formatCPF(item.document)}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatFullDate(item.created_at)}</TableCell>
                    <TableCell className="text-right text-sm font-medium text-destructive whitespace-nowrap">
                      {formatCurrency(Number(item.cost) || 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={item.status === 'completed' ? 'secondary' : 'outline'}
                        className={
                          item.status === 'completed'
                            ? 'text-xs rounded-full bg-foreground text-background hover:bg-foreground/90'
                            : 'text-xs rounded-full'
                        }
                      >
                        {item.status === 'completed' ? 'Concluída' : item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoricoConsultasCpf;
