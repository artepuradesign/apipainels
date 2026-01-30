import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { consultasCpfHistoryService, type ConsultaCpfHistoryItem } from '@/services/consultasCpfHistoryService';
import SimpleTitleBar from '@/components/dashboard/SimpleTitleBar';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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
  const [page, setPage] = useState(1);

  const limit = 10;

  const load = async () => {
    setLoading(true);
    try {
      const res = await consultasCpfHistoryService.getHistory(1, 200);
      if (res.success && res.data?.data) {
        setItems(res.data.data);
      } else {
        setItems([]);
      }
      setPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * limit;
    return items.slice(start, start + limit);
  }, [items, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const title = useMemo(() => {
    // “• N” conforme solicitado (apenas número, sem texto “registros”)
    return `Histórico de Consultas (CPF) • ${total}`;
  }, [total]);

  const getModuloLabel = (item: ConsultaCpfHistoryItem): string => {
    const moduleTitle = (item as any)?.metadata?.module_title;
    if (typeof moduleTitle === 'string' && moduleTitle.trim()) return moduleTitle.trim();

    const pageRoute = (item as any)?.metadata?.page_route?.toString?.() || '';
    const route = pageRoute.toLowerCase();

    if (route.includes('consultar-cpf-simples')) return 'CPF Simples';
    if (route.includes('consultar-cpf-completo')) return 'CPF Completo';
    if (route.includes('consultar-cpf-puxa-tudo')) return 'CPF Puxa Tudo';
    if (route.includes('consultar-cpf-basico')) return 'CPF Básico';
    if (route.includes('consultar-cpf-simple')) return 'CPF Simples';

    return '—';
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto">
        <SimpleTitleBar
          title={title}
          icon={<FileText className="h-4 w-4 md:h-5 md:w-5" />}
          onBack={handleBack}
          right={
            <Button
              variant="ghost"
              size="sm"
              onClick={load}
              disabled={loading}
              className="h-9 w-9 p-0"
              aria-label="Atualizar"
              title="Atualizar"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          }
        />

        <Card className="mt-4 md:mt-6">
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
              {paginatedItems.map((item) => {
                const modulo = getModuloLabel(item);

                return (
                  <div
                    key={`${item.source_table}-${item.id}`}
                    className="w-full rounded-lg border border-border bg-card px-3 py-3"
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
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{modulo}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-medium text-destructive whitespace-nowrap">
                          {formatCurrency(Number(item.cost) || 0)}
                        </div>
                        <div className="mt-1">
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
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-52 whitespace-nowrap">CPF</TableHead>
                    <TableHead className="whitespace-nowrap">Módulo</TableHead>
                    <TableHead className="whitespace-nowrap">Data e Hora</TableHead>
                    <TableHead className="w-32 text-right whitespace-nowrap">Valor</TableHead>
                    <TableHead className="w-28 text-center whitespace-nowrap">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow key={`${item.source_table}-${item.id}`}>
                      <TableCell className="font-mono text-sm whitespace-nowrap">{formatCPF(item.document)}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{getModuloLabel(item)}</TableCell>
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
            </div>
          )}

          {!loading && items.length > 0 ? (
            <div className="mt-4 border-t border-border pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total}
                </div>

                <Pagination className="justify-start sm:justify-center">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    {totalPages > 5 && page < totalPages - 2 ? (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : null}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HistoricoConsultasCpf;
