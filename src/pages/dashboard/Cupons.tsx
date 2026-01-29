import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Ticket, 
  Gift, 
  RefreshCw, 
  Plus,
  Search,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cupomApiService, Cupom } from '@/services/cupomApiService';
import CupomValidationModal from '@/components/cupons/CupomValidationModal';

const Cupons = () => {
  const { user, isSupport } = useAuth();
  const [cuponsDisponiveis, setCuponsDisponiveis] = useState<Cupom[]>([]);
  const [filteredCupons, setFilteredCupons] = useState<Cupom[]>([]);
  const [historicoUso, setHistoricoUso] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistorico, setIsLoadingHistorico] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'all' | 'fixo' | 'percentual'>('all');
  const [selectedCupomCode, setSelectedCupomCode] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatBrazilianCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadCupons = async () => {
    setIsLoading(true);
    try {
      console.log('🎫 [CUPONS] Iniciando carregamento de cupons...');
      const response = await cupomApiService.getCuponsDisponiveis();
      console.log('🎫 [CUPONS] Resposta recebida:', response);
      
      if (response.success && response.data) {
        // Converter valores string para number se necessário
        const cuponsNormalizados = response.data.map(cupom => ({
          ...cupom,
          valor: typeof cupom.valor === 'string' ? parseFloat(cupom.valor) : cupom.valor,
          uso_atual: typeof cupom.uso_atual === 'string' ? parseInt(cupom.uso_atual) : cupom.uso_atual,
          uso_limite: cupom.uso_limite && typeof cupom.uso_limite === 'string' ? parseInt(cupom.uso_limite) : cupom.uso_limite
        }));
        
        setCuponsDisponiveis(cuponsNormalizados);
        setFilteredCupons(cuponsNormalizados);
        console.log('✅ [CUPONS] Cupons carregados com sucesso:', cuponsNormalizados.length);
      } else {
        console.error('❌ [CUPONS] Erro na resposta:', response.error);
        toast.error(response.error || 'Erro ao carregar cupons');
      }
    } catch (error) {
      console.error('❌ [CUPONS] Erro de conexão:', error);
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistoricoCupons = async () => {
    if (!user?.id) return;
    
    setIsLoadingHistorico(true);
    try {
      console.log('📜 [CUPONS] Carregando histórico de cupons...');
      const response = await cupomApiService.getCupomHistory(Number(user.id));
      
      if (response.success && response.data) {
        setHistoricoUso(response.data);
        console.log('✅ [CUPONS] Histórico carregado:', response.data.length);
      } else {
        console.error('❌ [CUPONS] Erro ao carregar histórico:', response.error);
        setHistoricoUso([]);
      }
    } catch (error) {
      console.error('❌ [CUPONS] Erro no histórico:', error);
      setHistoricoUso([]);
    } finally {
      setIsLoadingHistorico(false);
    }
  };

  useEffect(() => {
    loadCupons();
    loadHistoricoCupons();
  }, [user?.id]);

  // Filtrar cupons baseado na pesquisa e tipo
  useEffect(() => {
    let filtered = cuponsDisponiveis;

    if (searchTerm) {
      filtered = filtered.filter(cupom =>
        cupom.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cupom.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterTipo !== 'all') {
      filtered = filtered.filter(cupom => cupom.tipo === filterTipo);
    }

    setFilteredCupons(filtered);
  }, [cuponsDisponiveis, searchTerm, filterTipo]);

  const handleCupomUsed = (valorAdicionado: number) => {
    // Recarregar lista de cupons e histórico
    loadCupons();
    loadHistoricoCupons();
    setSelectedCupomCode(''); // Limpar seleção após uso
  };

  const handleCupomClick = (cupomCodigo: string) => {
    setSelectedCupomCode(cupomCodigo);
    setIsModalOpen(true);
  };

  const getStatusBadge = (cupom: Cupom) => {
    if (cupom.valido_ate && new Date(cupom.valido_ate) < new Date()) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (cupom.uso_limite && cupom.uso_atual >= cupom.uso_limite) {
      return <Badge variant="destructive">Esgotado</Badge>;
    }
    if (historicoUso.some(h => h.codigo === cupom.codigo)) {
      return <Badge variant="secondary">Já Usado</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
      <CheckCircle2 className="h-3 w-3 mr-1" />
      Disponível
    </Badge>;
  };

  const calculateStats = () => {
    // Cupons disponíveis (não usados pelo usuário atual)
    const disponiveis = cuponsDisponiveis.filter(c => 
      !historicoUso.some(h => h.codigo === c.codigo) &&
      !(c.valido_ate && new Date(c.valido_ate) < new Date()) &&
      !(c.uso_limite && c.uso_atual >= c.uso_limite)
    );
    
    // Valor disponível (soma dos cupons não usados)
    const valorDisponivel = disponiveis.reduce((acc, c) => acc + c.valor, 0);
    
    // Cupons usados pelo usuário atual
    const cuponsUsados = historicoUso.length;
    
    // Valor utilizado pelo usuário atual
    const valorUtilizado = historicoUso.reduce((acc, h) => acc + h.valor_desconto, 0);

    return { 
      disponiveis: disponiveis.length, 
      valorDisponivel, 
      cuponsUsados, 
      valorUtilizado 
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Estatísticas - Cards Combinados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Disponíveis */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    Cupons Disponíveis
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Prontos para usar
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Quantidade
                </span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {stats.disponiveis} cupons
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Valor Total
                </span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {formatBrazilianCurrency(stats.valorDisponivel)}
                  </p>
                  <p className="text-xs text-green-500">
                    economia disponível
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Usados */}
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">
                    Cupons Utilizados
                  </h3>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Já aproveitados
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Quantidade
                </span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  {stats.cuponsUsados} cupons
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Economia Total
                </span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">
                    {formatBrazilianCurrency(stats.valorUtilizado)}
                  </p>
                  <p className="text-xs text-purple-500">
                    já economizado
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Lista de Cupons Disponíveis */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-500" />
              <CardTitle>Cupons Disponíveis</CardTitle>
              <Badge variant="secondary" className="ml-2">
                {filteredCupons.length} de {cuponsDisponiveis.length}
              </Badge>
            </div>
            
            {/* Filtros movidos para dentro */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterTipo === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTipo('all')}
                  className="flex-1 sm:flex-none min-w-0"
                >
                  Todos
                </Button>
                <Button
                  variant={filterTipo === 'fixo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTipo('fixo')}
                  className="flex-1 sm:flex-none min-w-0"
                >
                  Valor Fixo
                </Button>
                <Button
                  variant={filterTipo === 'percentual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTipo('percentual')}
                  className="flex-1 sm:flex-none min-w-0"
                >
                  Percentual
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Carregando cupons...</span>
              </div>
            </div>
          ) : filteredCupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {searchTerm || filterTipo !== 'all' 
                  ? 'Nenhum cupom encontrado com os filtros aplicados' 
                  : 'Nenhum cupom disponível no momento'}
              </p>
              {(searchTerm || filterTipo !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterTipo('all');
                  }}
                  className="mt-4"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCupons.map((cupom) => (
                <Card 
                  key={cupom.id} 
                  className={`border-2 transition-all duration-200 cursor-pointer ${
                    selectedCupomCode === cupom.codigo 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20 shadow-lg' 
                      : 'border-green-200 hover:border-green-400 hover:bg-green-50/50 dark:border-green-800 dark:hover:border-green-600'
                  } ${
                    cupom.valido_ate && new Date(cupom.valido_ate) < new Date() 
                      ? 'opacity-50 cursor-not-allowed' 
                      : cupom.uso_limite && cupom.uso_atual >= cupom.uso_limite 
                        ? 'opacity-50 cursor-not-allowed' 
                        : historicoUso.some(h => h.codigo === cupom.codigo)
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                  }`}
                  onClick={() => {
                    // Não permitir clique em cupons expirados, esgotados ou já usados
                    if (cupom.valido_ate && new Date(cupom.valido_ate) < new Date()) {
                      toast.error('Este cupom está expirado');
                      return;
                    }
                    if (cupom.uso_limite && cupom.uso_atual >= cupom.uso_limite) {
                      toast.error('Este cupom está esgotado');
                      return;
                    }
                    if (historicoUso.some(h => h.codigo === cupom.codigo)) {
                      toast.error('Você já usou este cupom');
                      return;
                    }
                    handleCupomClick(cupom.codigo);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={`font-mono ${
                            selectedCupomCode === cupom.codigo 
                              ? 'border-green-600 text-green-700 bg-green-100' 
                              : 'border-green-300 text-green-700 bg-green-50'
                          }`}
                        >
                          {cupom.codigo}
                        </Badge>
                        {getStatusBadge(cupom)}
                      </div>
                      
                      {cupom.descricao && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {cupom.descricao}
                        </p>
                      )}
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Valor:</span>
                          <Badge variant={cupom.tipo === 'fixo' ? 'default' : 'secondary'} className="text-xs">
                            {cupom.tipo === 'fixo' ? 'R$' : '%'}
                          </Badge>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          {cupom.tipo === 'fixo' 
                            ? formatBrazilianCurrency(cupom.valor)
                            : `${cupom.valor}%`
                          }
                        </span>
                      </div>
                      
                      {cupom.uso_limite && (
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>Usos:</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">
                              {cupom.uso_atual}/{cupom.uso_limite}
                            </span>
                            <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-300"
                                style={{ 
                                  width: `${Math.min((cupom.uso_atual / cupom.uso_limite) * 100, 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {cupom.valido_ate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Válido até: {formatDate(cupom.valido_ate)}</span>
                        </div>
                      )}

                      {selectedCupomCode === cupom.codigo && (
                        <div className="mt-3 p-2 bg-primary/10 border border-primary/20 rounded-lg">
                          <p className="text-xs text-primary font-medium text-center">
                            ✨ Cupom selecionado! Role para baixo para validar.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Cupons Usados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-purple-500" />
            Histórico de Cupons Usados
            <Badge variant="secondary" className="ml-2">
              {historicoUso.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingHistorico ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Carregando histórico...</span>
              </div>
            </div>
          ) : historicoUso.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Você ainda não usou nenhum cupom</p>
              <p className="text-sm mt-2">Use cupons acima para adicionar saldo à sua carteira</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historicoUso.map((item, index) => (
                <Card 
                  key={item.id || index} 
                  className="border-2 border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className="font-mono border-purple-300 text-purple-700 bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:bg-purple-900/30"
                        >
                          {item.codigo}
                        </Badge>
                        <Badge variant="default" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Usado
                        </Badge>
                      </div>
                      
                      {item.descricao && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.descricao}
                        </p>
                      )}
                      
                      <Separator />
                      
                       <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Valor:</span>
                        </div>
                        <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          + {formatBrazilianCurrency(item.valor_desconto)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Usado em: {formatDate(item.used_at)}</span>
                      </div>

                      <div className="mt-3 p-2 bg-purple-100 border border-purple-200 rounded-lg dark:bg-purple-900/30 dark:border-purple-800">
                        <p className="text-xs text-purple-700 dark:text-purple-300 font-medium text-center">
                          ✅ Cupom aplicado com sucesso
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de Validação de Cupom */}
      <CupomValidationModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        prefilledCupomCode={selectedCupomCode}
        onCupomUsed={handleCupomUsed}
      />
    </div>
  );
};

export default Cupons;