import React from 'react';
import RechargeCard from '../RechargeCard';
import EmptyState from '../EmptyState';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'credit' | 'debit' | 'bonus' | 'referral_bonus' | 'plan_purchase' | 'plan_activation' | 'recharge' | 'plan_credit' | 'recarga' | 'consultation';
  description: string;
  created_at: string;
  balance_type?: 'wallet' | 'plan';
  status?: string;
  payment_method?: string;
}

interface RechargesSectionProps {
  rechargeTransactions: Transaction[];
  formatBrazilianCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
  loading?: boolean;
}

const RechargesSection: React.FC<RechargesSectionProps> = ({
  rechargeTransactions,
  formatBrazilianCurrency,
  formatDate,
  loading = false
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
      <div className="space-y-3 md:space-y-4">
        {rechargeTransactions.length > 0 ? (
          rechargeTransactions.map((transaction) => (
            <RechargeCard
              key={transaction.id}
              transaction={transaction}
              formatBrazilianCurrency={formatBrazilianCurrency}
              formatDate={formatDate}
            />
          ))
        ) : (
          <EmptyState 
            title="Nenhuma recarga encontrada"
            subtitle="Suas recargas aparecerão aqui"
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default RechargesSection;