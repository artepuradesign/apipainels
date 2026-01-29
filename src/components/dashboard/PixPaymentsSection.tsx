import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePixPayments } from "@/hooks/usePixPayments";
import { AlertCircle, RefreshCw, QrCode as QrCodeIcon, CheckCircle, XCircle, Clock } from "lucide-react";
import QRCode from 'react-qr-code';
import PixQRCodeModal from '@/components/payment/PixQRCodeModal';
import { usePixPaymentFlow } from '@/hooks/usePixPaymentFlow';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/apiConfig';

export const PixPaymentsSection = () => {
  const { pixPayments, loading, error, formatDate, formatMoney, refreshPayments } = usePixPayments();
  const { pixResponse, checkingPayment, checkPaymentStatus } = usePixPaymentFlow();
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const getStatusBadge = (status: string, label?: string) => {
    const displayLabel = label || status;
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            {displayLabel}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3 h-3 mr-1" />
            {displayLabel}
          </Badge>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="w-3 h-3 mr-1" />
            {displayLabel}
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            <AlertCircle className="w-3 h-3 mr-1" />
            {displayLabel}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{displayLabel}</Badge>;
    }
  };

  // Verificar se QR Code ainda é válido (30 minutos desde created_at)
  const isQRCodeValid = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - created.getTime()) / (1000 * 60);
    return diffMinutes < 30;
  };

  // Pegar apenas os 3 últimos pagamentos
  const recentPayments = pixPayments.slice(0, 3);

  // Abrir modal com dados do pagamento
  const handleQRCodeClick = (payment: any) => {
    if (payment.qr_code && isQRCodeValid(payment.created_at)) {
      setSelectedPayment({
        payment_id: payment.payment_id,
        qr_code: payment.qr_code,
        qr_code_base64: payment.qr_code_base64,
        status: payment.status,
        expires_at: payment.expires_at
      });
      setShowModal(true);
    } else {
      toast.error('QR Code expirado ou inválido');
    }
  };

  const handlePaymentConfirm = async () => {
    if (selectedPayment?.payment_id) {
      toast.loading('Verificando pagamento...', { id: 'check-payment' });
      
      try {
        // Forçar verificação de pagamentos pendentes
        const checkResponse = await fetch(`${API_BASE_URL}/mercadopago/check-pending-payments`, {
          method: 'GET'
        });

        if (checkResponse.ok) {
          console.log('✅ Verificação de pagamentos pendentes concluída');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Verificar status atualizado
        await checkPaymentStatus(selectedPayment.payment_id);
        
        toast.success('Verificação concluída!', { id: 'check-payment' });
      } catch (error) {
        toast.error('Erro ao verificar pagamento', { id: 'check-payment' });
      }
      
      setShowModal(false);
      refreshPayments();
    }
  };

  return (
    <>
      {/* Barra de ações */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={refreshPayments}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Lista de Pagamentos */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Carregando pagamentos...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p className="text-destructive font-medium mb-2">Erro ao carregar pagamentos</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={refreshPayments} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="p-12 text-center">
              <QrCodeIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhum pagamento PIX registrado ainda.</p>
            </div>
          ) : (
            <>
              {/* Lista Desktop e Tablet */}
              <div className="hidden md:block space-y-3 p-4">
                {recentPayments.map((p) => {
                  const qrValid = isQRCodeValid(p.created_at);
                  return (
                    <div key={p.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      {/* QR Code - Clicável */}
                      <div className="flex-shrink-0">
                        {p.qr_code && qrValid ? (
                          <div 
                            className="bg-white p-2 rounded border-2 border-green-500 cursor-pointer hover:border-green-600 transition-colors"
                            onClick={() => handleQRCodeClick(p)}
                            title="Clique para abrir o pagamento"
                          >
                            <QRCode value={p.qr_code} size={80} />
                          </div>
                        ) : (
                          <div className="bg-muted p-2 rounded border-2 border-border flex items-center justify-center" style={{ width: 84, height: 84 }}>
                            <QrCodeIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Informações Compactas */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl font-bold text-green-600">
                            {formatMoney(p.amount, p.amount_formatted)}
                          </span>
                          {getStatusBadge(p.status, p.status_label)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {p.description || 'RECARGA PIX'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(p.created_at)}</p>
                      </div>

                      {/* Info Adicional */}
                      <div className="flex-shrink-0 text-right hidden lg:block">
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={p.payer_email || '-'}>
                          {p.payer_email || '-'}
                        </p>
                        <code className="text-xs text-muted-foreground">
                          {p.payment_id.substring(0, 8)}...
                        </code>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Lista Mobile */}
              <div className="md:hidden space-y-3 p-4">
                {recentPayments.map((p) => {
                  const qrValid = isQRCodeValid(p.created_at);
                  return (
                    <div key={p.id} className="space-y-3 p-4 border rounded-lg">
                      {/* QR Code - Clicável */}
                      <div className="flex justify-center">
                        {p.qr_code && qrValid ? (
                          <div 
                            className="bg-white p-3 rounded border-2 border-green-500 cursor-pointer hover:border-green-600 transition-colors"
                            onClick={() => handleQRCodeClick(p)}
                          >
                            <QRCode value={p.qr_code} size={140} />
                            <p className="text-xs text-center text-green-600 font-medium mt-2">Toque para pagar</p>
                          </div>
                        ) : (
                          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center" style={{ width: 160, height: 160 }}>
                            <div className="text-center">
                              <QrCodeIcon className="w-16 h-16 mx-auto text-gray-400 mb-2" />
                              <p className="text-xs text-gray-500">QR Code Expirado</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-bold text-green-600">
                            {formatMoney(p.amount, p.amount_formatted)}
                          </div>
                          {getStatusBadge(p.status, p.status_label)}
                        </div>
                        <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                          ID: {p.payment_id}
                        </code>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block mb-1">Descrição</span>
                          <span className="font-medium">{p.description || 'RECARGA PIX'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Email</span>
                          <span className="font-medium truncate block" title={p.payer_email || '-'}>
                            {p.payer_email || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block mb-1">Criado</span>
                          <span className="font-medium">{formatDate(p.created_at)}</span>
                        </div>
                        {p.approved_at && (
                          <div>
                            <span className="text-muted-foreground block mb-1">Aprovado</span>
                            <span className="font-medium">{formatDate(p.approved_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Pagamento */}
      {selectedPayment && (
        <PixQRCodeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          amount={pixPayments.find(p => p.payment_id === selectedPayment.payment_id)?.amount || 0}
          onPaymentConfirm={handlePaymentConfirm}
          isProcessing={checkingPayment}
          pixData={selectedPayment}
        />
      )}
    </>
  );
};

export default PixPaymentsSection;
