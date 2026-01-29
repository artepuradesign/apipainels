import React from 'react';
import { Wallet, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  loading?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle, loading = false }) => (
  <div className="text-center py-12">
    {loading ? (
      <div className="flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
        <p className="text-gray-500">Carregando dados via API...</p>
      </div>
    ) : (
      <>
        <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
          {title}
        </p>
        <p className="text-sm text-gray-400">
          {subtitle}
        </p>
      </>
    )}
  </div>
);

export default EmptyState;