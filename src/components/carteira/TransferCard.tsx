
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send } from 'lucide-react';
import { toast } from "sonner";

interface TransferCardProps {
  userBalance: number;
  onTransferRequest: (recipientId: string, amount: number) => void;
  isProcessing: boolean;
}

const TransferCard: React.FC<TransferCardProps> = ({
  userBalance,
  onTransferRequest,
  isProcessing
}) => {
  const [recipientId, setRecipientId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const handleTransferClick = () => {
    if (!recipientId || !transferAmount) {
      toast.error("Por favor, preencha o ID do destinatário e o valor");
      return;
    }
    
    const amount = parseFloat(transferAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Por favor, insira um valor válido");
      return;
    }
    
    if (amount > userBalance) {
      toast.error("Saldo insuficiente para realizar a transferência");
      return;
    }
    
    onTransferRequest(recipientId, amount);
  };

  return (
    <Card className="bg-white/90 dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 shadow-sm backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
          <Send className="w-5 h-5" />
          Transferir Saldo
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Envie saldo para outro usuário da plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient-id" className="text-gray-700 dark:text-gray-300">ID do Destinatário</Label>
          <Input
            id="recipient-id"
            placeholder="Digite o ID do destinatário"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="transfer-amount" className="text-gray-700 dark:text-gray-300">Valor</Label>
          <Input
            id="transfer-amount"
            placeholder="R$ 0,00"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-brand-purple hover:bg-brand-darkPurple" 
          onClick={handleTransferClick}
          disabled={isProcessing}
        >
          <Send className="w-4 h-4 mr-2" />
          {isProcessing ? 'Processando...' : 'Transferir'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TransferCard;
