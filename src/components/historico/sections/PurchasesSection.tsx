import React from 'react';
import PlanTransactionCard from '../PlanTransactionCard';
import EmptyState from '../EmptyState';

interface HistoryItem {
  id: string;
  type?: string;
  description?: string;
  [key: string]: any;
}

interface PurchasesSectionProps {
  allHistory: Array<HistoryItem>;
  formatBrazilianCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
  loading?: boolean;
}

const PurchasesSection: React.FC<PurchasesSectionProps> = ({
  allHistory,
  formatBrazilianCurrency,
  formatDate,
  loading = false
}) => {
  const purchaseItems = allHistory.filter(item => 
    'type' in item && 
    (item.type === 'plan_purchase' || 
     item.type === 'plan_activation' ||
     (item.description && (
       item.description.includes('Compra do plano') || 
       item.description.includes('Ativação do plano')
     )))
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
      <div className="space-y-3 md:space-y-4">
        {purchaseItems.length > 0 ? (
          purchaseItems.map((item) => {
            const planTransaction = item as HistoryItem;
            
            // Determinar o tipo correto baseado na descrição se necessário
            let planType: 'plan_purchase' | 'plan_activation' = 'plan_purchase';
            if (planTransaction.type === 'plan_activation' || planTransaction.description?.includes('Ativação')) {
              planType = 'plan_activation';
            }
            
            return (
              <PlanTransactionCard
                key={planTransaction.id}
                transaction={{
                  ...planTransaction,
                  type: planType,
                  amount: planTransaction.amount || 0,
                  created_at: planTransaction.created_at || new Date().toISOString(),
                  description: planTransaction.description || 'Transação de plano',
                  payment_method: planTransaction.payment_method,
                  coupon_applied: planTransaction.description?.includes('Cupom') 
                    ? planTransaction.description.match(/Cupom:\s*([A-Z0-9]+)/)?.[1] 
                    : undefined,
                  original_amount: planTransaction.description?.includes('Cupom') 
                    ? planTransaction.amount * 1.2 
                    : undefined
                }}
                formatBrazilianCurrency={formatBrazilianCurrency}
                formatDate={formatDate}
              />
            );
          })
        ) : (
          <EmptyState 
            title="Nenhuma compra encontrada"
            subtitle="Suas compras e ativações de planos aparecerão aqui"
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default PurchasesSection;