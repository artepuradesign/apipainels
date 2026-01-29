import React from 'react';
import EmptyState from '../EmptyState';

interface ReferralEarning {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  amount: number;
  created_at: string;
  status: 'pending' | 'paid';
  referred_name?: string;
}

interface ReferralsSectionProps {
  referralEarnings: ReferralEarning[];
  formatBrazilianCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
  loading?: boolean;
}

const ReferralsSection: React.FC<ReferralsSectionProps> = ({
  referralEarnings,
  formatBrazilianCurrency,
  formatDate,
  loading = false
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
      {referralEarnings.length > 0 ? (
        <div className="space-y-4 md:space-y-6">
          <div className="space-y-3 md:space-y-4">
            <h4 className="text-sm md:text-md font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
              🎁 Histórico Detalhado de Bônus
            </h4>
            
            {referralEarnings.map((earning) => (
              <div key={earning.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm">
                        {earning.referred_name ? earning.referred_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">
                          {earning.referred_name || `Usuário ${earning.referred_user_id}`}
                        </h5>
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${
                            earning.status === 'paid' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}>
                            {earning.status === 'paid' ? '✅ Pago' : '⏳ Pendente'}
                          </span>
                          <span className="text-xs text-gray-500">ID: {earning.referred_user_id}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      💝 Bônus de boas-vindas por indicação confirmada
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      📅 {formatDate(earning.created_at)}
                    </p>
                  </div>
                  <div className="text-right md:text-right">
                    <div className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400 mb-1">
                      + {formatBrazilianCurrency(earning.amount)}
                    </div>
                    <p className="text-xs text-gray-500">Bônus recebido</p>
                    <div className="mt-2">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      <span className="text-xs text-green-600 dark:text-green-400">Creditado</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState 
          title="Nenhum bônus por indicação encontrado"
          subtitle="Seus ganhos por indicação aparecerão aqui quando você começar a indicar pessoas"
          loading={loading}
        />
      )}
    </div>
  );
};

export default ReferralsSection;