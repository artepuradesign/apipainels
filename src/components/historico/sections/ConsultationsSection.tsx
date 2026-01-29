import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

interface HistoryItem {
  id: string;
  type?: string;
  module_type?: string;
  document?: string;
  cost?: number;
  amount?: number;
  status?: string;
  created_at: string;
  result_data?: any;
  [key: string]: any;
}

interface ConsultationsSectionProps {
  allHistory: Array<HistoryItem>;
  formatBrazilianCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
  loading?: boolean;
}

const ConsultationsSection: React.FC<ConsultationsSectionProps> = ({
  allHistory,
  formatBrazilianCurrency,
  formatDate,
  loading = false
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const consultationItems = allHistory.filter(item => 
    'type' in item && (item.type === 'consultation' || item.type === 'Consulta CPF' || item.module_type === 'cpf'));

  const handleConsultationClick = (consultation: any) => {
    if (!consultation.result_data) {
      toast.error('Dados da consulta não disponíveis');
      return;
    }

    // Redirecionar para página de consulta com os dados no state
    navigate('/dashboard/consultar-cpf-puxa-tudo', {
      state: {
        fromHistory: true,
        consultationData: consultation.result_data,
        cpf: consultation.document,
        noCharge: true
      }
    });

    toast.success('Consulta carregada do histórico (sem cobrança)', { duration: 2000 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Carregando consultas...</span>
      </div>
    );
  }

  if (consultationItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Nenhuma consulta encontrada
        </h3>
        <p className="text-sm">
          Suas consultas realizadas aparecerão aqui
        </p>
      </div>
    );
  }

  const formatCPF = (cpf: string) => {
    if (!cpf || cpf === 'CPF consultado') return 'N/A';
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead className="w-32">CPF</TableHead>
              <TableHead className="w-48">Data e Hora</TableHead>
              <TableHead className="w-24 text-right">Valor</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consultationItems.map((consultation) => {
              const consultationValue = consultation.cost || consultation.amount || 0;
              const valueString = String(consultationValue);
              const numericValue = typeof consultationValue === 'string' 
                ? parseFloat(valueString.replace(',', '.')) 
                : Math.abs(Number(consultationValue)) || 0;

              return (
                <TableRow 
                  key={consultation.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => handleConsultationClick(consultation)}
                >
                  <TableCell className="font-mono text-xs">
                    {consultation.id.toString().slice(0, 8)}...
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatCPF(consultation.document || '')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatFullDate(consultation.created_at)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-red-600 dark:text-red-400">
                    R$ {numericValue.toFixed(2).replace('.', ',')}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={consultation.status === 'success' || consultation.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {consultation.status === 'success' || consultation.status === 'completed' ? 'Concluída' : 'Pendente'}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {consultationItems.map((consultation) => {
          const consultationValue = consultation.cost || consultation.amount || 0;
          const valueString = String(consultationValue);
          const numericValue = typeof consultationValue === 'string' 
            ? parseFloat(valueString.replace(',', '.')) 
            : Math.abs(Number(consultationValue)) || 0;

          return (
            <Card 
              key={consultation.id} 
              className="border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleConsultationClick(consultation)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ID:</span>
                      <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {consultation.id.toString().slice(0, 8)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">CPF:</span>
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                        {formatCPF(consultation.document || '')}
                      </span>
                    </div>
                  </div>
                  <Badge 
                    variant={consultation.status === 'success' || consultation.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {consultation.status === 'success' || consultation.status === 'completed' ? 'Concluída' : 'Pendente'}
                  </Badge>
                </div>
                
                <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Data/Hora:</span>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                        {formatFullDate(consultation.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Valor:</span>
                      <p className="text-sm font-bold text-red-600 dark:text-red-400 mt-1">
                        R$ {numericValue.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ConsultationsSection;