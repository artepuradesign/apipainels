import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Camera, Search, User } from 'lucide-react';
import { toast } from 'sonner';

import SimpleTitleBar from '@/components/dashboard/SimpleTitleBar';
import FotosSection from '@/components/dashboard/FotosSection';

import { moduleService } from '@/services/moduleService';
import { useAuth } from '@/contexts/AuthContext';
import { cookieUtils } from '@/utils/cookieUtils';
import { baseCpfService } from '@/services/baseCpfService';
import { consultasCpfService } from '@/services/consultasCpfService';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useUserSubscription } from '@/hooks/useUserSubscription';

const MODULE_ID = 23;

const ConsultarCpfFoto = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const resultRef = useRef<HTMLDivElement>(null);

  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('CPF FOTO');
  const [modulePrice, setModulePrice] = useState(0);
  const [moduleLoading, setModuleLoading] = useState(true);

  const [result, setResult] = useState<{ id?: number; cpf: string; nome: string } | null>(null);

  const { loadBalance: reloadApiBalance } = useWalletBalance();
  const {
    hasActiveSubscription,
    subscription,
    discountPercentage,
    calculateDiscountedPrice: calculateSubscriptionDiscount,
  } = useUserSubscription();

  const userPlan = hasActiveSubscription && subscription ? subscription.plan_name : 'Pré-Pago';

  useEffect(() => {
    (async () => {
      try {
        setModuleLoading(true);
        const res = await moduleService.getModuleById(MODULE_ID);
        if (res.success && res.data) {
          setModuleTitle(res.data.title || 'CPF FOTO');
          setModulePrice(Number(res.data.price) || 0);
        } else {
          setModuleTitle('CPF FOTO');
          setModulePrice(0);
        }
      } finally {
        setModuleLoading(false);
      }
    })();
  }, []);

  // Se veio do histórico
  useEffect(() => {
    if (location.state?.fromHistory && location.state?.consultationData) {
      const { consultationData, cpf: historyCpf } = location.state;
      setCpf(historyCpf || '');
      setResult(consultationData);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
    }
  }, [location.state]);

  const handleSearch = async () => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) {
      toast.error('Informe um CPF válido');
      return;
    }
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    const sessionToken = cookieUtils.get('session_token') || cookieUtils.get('api_session_token');
    if (!sessionToken) {
      toast.error('Token de autenticação não encontrado. Faça login novamente.');
      return;
    }

    if (modulePrice <= 0) {
      toast.info('Carregando preço do módulo...', { duration: 1500 });
      return;
    }

    const { discountedPrice: finalPrice, hasDiscount } = hasActiveSubscription
      ? calculateSubscriptionDiscount(modulePrice)
      : { discountedPrice: modulePrice, hasDiscount: false };
    const discount = hasDiscount ? discountPercentage : 0;

    setLoading(true);
    try {
      const baseRes = await baseCpfService.getByCpf(cleaned);
      if (!baseRes.success || !baseRes.data) {
        toast.error(baseRes.error || 'CPF não encontrado');
        return;
      }

      const cpfData = baseRes.data;

      // registra consulta com o module_id correto e module_title do banco
      await consultasCpfService.create({
        user_id: parseInt(user.id),
        module_type: 'cpf',
        document: cleaned,
        cost: finalPrice,
        status: 'completed',
        result_data: cpfData,
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent,
        metadata: {
          source: 'consultar-cpf-foto',
          page_route: window.location.pathname,
          module_title: moduleTitle,
          module_id: MODULE_ID,
          discount,
          original_price: modulePrice,
          final_price: finalPrice,
          subscription_discount: hasActiveSubscription,
          plan_type: userPlan,
          timestamp: new Date().toISOString(),
        },
      } as any);

      setResult({
        id: cpfData.id,
        cpf: cpfData.cpf || cleaned,
        nome: cpfData.nome || 'Nome não informado',
      });

      await reloadApiBalance();
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 250);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SimpleTitleBar title={moduleTitle} onBack={() => navigate(-1)} icon={<Camera className="h-4 w-4" />} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {moduleTitle}
          </CardTitle>
          <CardDescription>Valor e título carregados do cadastro do módulo (ID {MODULE_ID}).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="Digite o CPF" />
            </div>
            <Button onClick={handleSearch} disabled={loading || moduleLoading} className="w-full">
              {loading ? (
                'Consultando...'
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Consultar
                </span>
              )}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Valor do módulo:{' '}
            <span className="font-medium text-foreground">
              R$ {modulePrice.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {modulePrice <= 0 && !moduleLoading ? (
            <div className="rounded-md border border-border bg-muted p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="font-medium">Preço do módulo não encontrado</div>
                  <div className="text-muted-foreground">Verifique o cadastro do módulo ID {MODULE_ID}.</div>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {result ? (
        <div ref={resultRef} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                CPF Encontrado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Nome:</span> {result.nome}
              </div>
              <div className="text-sm">
                <span className="font-medium">CPF:</span> {result.cpf}
              </div>
            </CardContent>
          </Card>

          {typeof result.id === 'number' ? (
            <div id="fotos-section">
              <FotosSection cpfId={result.id} cpfNumber={cpf} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ConsultarCpfFoto;
