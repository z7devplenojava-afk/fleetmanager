import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Send, 
  FileText, 
  Mail, 
  Phone,
  Users,
  Shield,
  TrendingUp,
  Award,
  Settings,
  Bell,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';
import maintenancePlanService from '@/services/maintenancePlanService';
import { MaintenancePlan, MaintenancePlanTemplate } from '@/services/maintenancePlanService';

interface MaintenancePlanRenewalProps {
  planId?: string;
  clientId?: string;
}

interface RenewalOffer {
  id: string;
  planId: string;
  currentPlan: MaintenancePlan;
  proposedPlan: Partial<MaintenancePlan>;
  renewalType: 'AUTO' | 'MANUAL' | 'UPGRADE' | 'DOWNGRADE';
  status: 'PENDING' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  proposedPrice: number;
  currentPrice: number;
  priceDifference: number;
  priceDifferencePercentage: number;
  validUntil: string;
  sentAt?: string;
  acceptedAt?: string;
  notes: string;
  incentives: {
    discountPercentage: number;
    freeMonths: number;
    additionalServices: string[];
    loyaltyBonus: number;
  };
}

export default function MaintenancePlanRenewal({ planId, clientId }: MaintenancePlanRenewalProps) {
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [templates, setTemplates] = useState<MaintenancePlanTemplate[]>([]);
  const [renewalOffers, setRenewalOffers] = useState<RenewalOffer[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MaintenancePlan | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<MaintenancePlanTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  
  const [offerForm, setOfferForm] = useState({
    renewalType: 'AUTO' as 'AUTO' | 'MANUAL' | 'UPGRADE' | 'DOWNGRADE',
    proposedPrice: 0,
    validUntil: '',
    notes: '',
    incentives: {
      discountPercentage: 0,
      freeMonths: 0,
      additionalServices: [] as string[],
      loyaltyBonus: 0
    }
  });

  useEffect(() => {
    loadData();
  }, [planId, clientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, templatesData] = await Promise.all([
        planId 
          ? [await maintenancePlanService.getPlanById(planId)].filter(Boolean) as MaintenancePlan[]
          : clientId 
            ? await maintenancePlanService.getPlansByClient(clientId)
            : await maintenancePlanService.getAllPlans(),
        maintenancePlanService.getAllTemplates()
      ]);

      setPlans(plansData);
      setTemplates(templatesData);

      // Load renewal offers for plans
      const offers = await Promise.all(
        plansData.map(async (plan) => await getRenewalOfferForPlan(plan))
      );
      setRenewalOffers(offers.filter(Boolean) as RenewalOffer[]);

      // Select first plan if no specific plan selected
      if (!planId && plansData.length > 0) {
        setSelectedPlan(plansData[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRenewalOfferForPlan = async (plan: MaintenancePlan): Promise<RenewalOffer | null> => {
    // Mock renewal offer - in production, this would come from the service
    const daysUntilExpiry = Math.floor((new Date(plan.contractEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry > 90) return null;

    const basePrice = plan.monthlyFee;
    const proposedPrice = basePrice * (1 + (Math.random() * 0.1 - 0.05)); // +/- 5%

    return {
      id: `offer-${plan.id}`,
      planId: plan.id,
      currentPlan: plan,
      proposedPlan: {
        ...plan,
        monthlyFee: proposedPrice,
        contractEnd: new Date(new Date(plan.contractEnd).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      renewalType: daysUntilExpiry < 30 ? 'AUTO' : 'MANUAL',
      status: daysUntilExpiry < 30 ? 'PENDING' : 'DRAFT',
      proposedPrice,
      currentPrice: basePrice,
      priceDifference: proposedPrice - basePrice,
      priceDifferencePercentage: ((proposedPrice - basePrice) / basePrice) * 100,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Oferta de renovação personalizada baseada no histórico de utilização',
      incentives: {
        discountPercentage: daysUntilExpiry < 30 ? 10 : 5,
        freeMonths: daysUntilExpiry < 30 ? 1 : 0,
        additionalServices: daysUntilExpiry < 30 ? ['Serviço de emergência 24h'] : [],
        loyaltyBonus: plan.vehicles.length > 5 ? 100 : 0
      }
    };
  };

  const handleCreateRenewalOffer = async () => {
    if (!selectedPlan) return;

    try {
      const newOffer: RenewalOffer = {
        id: `offer-${Date.now()}`,
        planId: selectedPlan.id,
        currentPlan: selectedPlan,
        proposedPlan: {
          ...selectedPlan,
          monthlyFee: offerForm.proposedPrice,
          contractEnd: new Date(new Date(selectedPlan.contractEnd).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        renewalType: offerForm.renewalType,
        status: 'PENDING',
        proposedPrice: offerForm.proposedPrice,
        currentPrice: selectedPlan.monthlyFee,
        priceDifference: offerForm.proposedPrice - selectedPlan.monthlyFee,
        priceDifferencePercentage: ((offerForm.proposedPrice - selectedPlan.monthlyFee) / selectedPlan.monthlyFee) * 100,
        validUntil: offerForm.validUntil,
        notes: offerForm.notes,
        incentives: offerForm.incentives
      };

      setRenewalOffers(prev => [...prev, newOffer]);
      setShowCreateOffer(false);
      
      // Reset form
      setOfferForm({
        renewalType: 'AUTO',
        proposedPrice: 0,
        validUntil: '',
        notes: '',
        incentives: {
          discountPercentage: 0,
          freeMonths: 0,
          additionalServices: [],
          loyaltyBonus: 0
        }
      });
    } catch (error) {
      console.error('Erro ao criar oferta de renovação:', error);
    }
  };

  const handleSendOffer = async (offerId: string) => {
    try {
      setRenewalOffers(prev => prev.map(offer =>
        offer.id === offerId
          ? { ...offer, status: 'SENT', sentAt: new Date().toISOString() }
          : offer
      ));
      alert('Oferta de renovação enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar oferta:', error);
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      setRenewalOffers(prev => prev.map(offer =>
        offer.id === offerId
          ? { ...offer, status: 'ACCEPTED', acceptedAt: new Date().toISOString() }
          : offer
      ));
      alert('Oferta de renovação aceita com sucesso!');
    } catch (error) {
      console.error('Erro ao aceitar oferta:', error);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    try {
      setRenewalOffers(prev => prev.map(offer =>
        offer.id === offerId
          ? { ...offer, status: 'REJECTED' }
          : offer
      ));
      alert('Oferta de renovação rejeitada.');
    } catch (error) {
      console.error('Erro ao rejeitar oferta:', error);
    }
  };

  const getDaysUntilExpiry = (contractEnd: string) => {
    return Math.floor((new Date(contractEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const getRenewalStatus = (plan: MaintenancePlan) => {
    const daysUntilExpiry = getDaysUntilExpiry(plan.contractEnd);
    
    if (daysUntilExpiry < 0) return { status: 'EXPIRED', color: 'bg-red-100 text-red-800', label: 'Expirado' };
    if (daysUntilExpiry <= 30) return { status: 'URGENT', color: 'bg-red-100 text-red-800', label: 'Urgente' };
    if (daysUntilExpiry <= 60) return { status: 'PENDING', color: 'bg-orange-100 text-orange-800', label: 'Pendente' };
    if (daysUntilExpiry <= 90) return { status: 'SOON', color: 'bg-yellow-100 text-yellow-800', label: 'Em breve' };
    return { status: 'ACTIVE', color: 'bg-green-100 text-green-800', label: 'Ativo' };
  };

  const getOfferStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'EXPIRED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOfferStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'SENT': return 'Enviada';
      case 'ACCEPTED': return 'Aceita';
      case 'REJECTED': return 'Rejeitada';
      case 'EXPIRED': return 'Expirada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Gestão de Renovação de Planos
          </h3>
          <p className="text-sm text-muted-foreground">
            Gerencie o processo de renovação dos planos de manutenção
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowCreateOffer(true)} disabled={!selectedPlan}>
            <Send className="h-4 w-4 mr-2" />
            Nova Oferta
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Planos Próximos ao Vencimento</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {plans.filter(p => getDaysUntilExpiry(p.contractEnd) <= 90 && getDaysUntilExpiry(p.contractEnd) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Próximos 90 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ofertas Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {renewalOffers.filter(o => o.status === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando envio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ofertas Enviadas</CardTitle>
            <Mail className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {renewalOffers.filter(o => o.status === 'SENT').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando resposta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Aceitação</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {renewalOffers.length > 0 
                ? ((renewalOffers.filter(o => o.status === 'ACCEPTED').length / renewalOffers.length) * 100).toFixed(1)
                : '0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="offers">Ofertas</TabsTrigger>
          <TabsTrigger value="analytics">Análise</TabsTrigger>
          <TabsTrigger value="automation">Automação</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Plans Renewal Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Status de Renovação dos Planos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plans.map((plan) => {
                  const renewalStatus = getRenewalStatus(plan);
                  const daysUntilExpiry = getDaysUntilExpiry(plan.contractEnd);
                  const existingOffer = renewalOffers.find(o => o.planId === plan.id);

                  return (
                    <div key={plan.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">{plan.planName}</div>
                            <div className="text-sm text-muted-foreground">{plan.clientName}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={renewalStatus.color}>
                            {renewalStatus.label}
                          </Badge>
                          {existingOffer && (
                            <Badge className={getOfferStatusColor(existingOffer.status)}>
                              {getOfferStatusLabel(existingOffer.status)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Vencimento:</span>
                          <div>{new Date(plan.contractEnd).toLocaleDateString('pt-BR')}</div>
                          <div className="text-muted-foreground">
                            {daysUntilExpiry > 0 ? `${daysUntilExpiry} dias` : 'Expirado'}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Valor Atual:</span>
                          <div>R$ {plan.monthlyFee.toFixed(2)}/mês</div>
                        </div>
                        <div>
                          <span className="font-medium">Renovação Automática:</span>
                          <div>{plan.renewal.autoRenew ? 'Sim' : 'Não'}</div>
                        </div>
                      </div>

                      {existingOffer && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <span className="font-medium">Oferta Proposta:</span>
                              <div>R$ {existingOffer.proposedPrice.toFixed(2)}/mês</div>
                              <div className={existingOffer.priceDifference > 0 ? 'text-red-600' : 'text-green-600'}>
                                {existingOffer.priceDifference > 0 ? '+' : ''}{existingOffer.priceDifferencePercentage.toFixed(1)}%
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {existingOffer.status === 'PENDING' && (
                                <Button size="sm" onClick={() => handleSendOffer(existingOffer.id)}>
                                  <Send className="h-3 w-3 mr-1" />
                                  Enviar
                                </Button>
                              )}
                              {existingOffer.status === 'SENT' && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleAcceptOffer(existingOffer.id)}>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Aceitar
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleRejectOffer(existingOffer.id)}>
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Rejeitar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ofertas de Renovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {renewalOffers.map((offer) => (
                  <div key={offer.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Oferta para {offer.currentPlan.planName}</div>
                          <div className="text-sm text-muted-foreground">{offer.currentPlan.clientName}</div>
                        </div>
                      </div>
                      <Badge className={getOfferStatusColor(offer.status)}>
                        {getOfferStatusLabel(offer.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="font-medium">Valor Atual:</span>
                        <div>R$ {offer.currentPrice.toFixed(2)}/mês</div>
                      </div>
                      <div>
                        <span className="font-medium">Valor Proposto:</span>
                        <div>R$ {offer.proposedPrice.toFixed(2)}/mês</div>
                        <div className={offer.priceDifference > 0 ? 'text-red-600' : 'text-green-600'}>
                          {offer.priceDifference > 0 ? '+' : ''}{offer.priceDifferencePercentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground mb-3">
                      <p>{offer.notes}</p>
                      <p>Válida até: {new Date(offer.validUntil).toLocaleDateString('pt-BR')}</p>
                    </div>

                    {offer.incentives && (
                      <div className="mb-3">
                        <span className="font-medium text-sm">Incentivos:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {offer.incentives.discountPercentage > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {offer.incentives.discountPercentage}% de desconto
                            </Badge>
                          )}
                          {offer.incentives.freeMonths > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {offer.incentives.freeMonths} mês(es) grátis
                            </Badge>
                          )}
                          {offer.incentives.additionalServices.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              +{offer.incentives.additionalServices.length} serviços
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {offer.sentAt && `Enviada em: ${new Date(offer.sentAt).toLocaleDateString('pt-BR')}`}
                        {offer.acceptedAt && `Aceita em: ${new Date(offer.acceptedAt).toLocaleDateString('pt-BR')}`}
                      </div>
                      <div className="flex space-x-2">
                        {offer.status === 'PENDING' && (
                          <Button size="sm" onClick={() => handleSendOffer(offer.id)}>
                            <Send className="h-3 w-3 mr-1" />
                            Enviar
                          </Button>
                        )}
                        {offer.status === 'SENT' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleAcceptOffer(offer.id)}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aceitar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRejectOffer(offer.id)}>
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Taxa de Renovação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p>Gráfico de taxa de renovação será implementado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendências de Preços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>Gráfico de tendências de preços será implementado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Automação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Notificações Automáticas</div>
                    <div className="text-sm text-muted-foreground">
                      Enviar alertas de renovação automaticamente
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Geração de Ofertas</div>
                    <div className="text-sm text-muted-foreground">
                      Criar ofertas de renovação baseadas no histórico
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Renovação Automática</div>
                    <div className="text-sm text-muted-foreground">
                      Renovar planos configurados para auto-renovação
                    </div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Relatórios de Renovação</div>
                    <div className="text-sm text-muted-foreground">
                      Gerar relatórios mensais de renovação
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Offer Modal */}
      {showCreateOffer && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Nova Oferta de Renovação</h3>
                <Button variant="ghost" onClick={() => setShowCreateOffer(false)}>
                  <AlertTriangle className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <Label>Plano: {selectedPlan.planName}</Label>
                <div className="text-sm text-muted-foreground">
                  Cliente: {selectedPlan.clientName} • Valor atual: R$ {selectedPlan.monthlyFee.toFixed(2)}/mês
                </div>
              </div>

              <div>
                <Label>Tipo de Renovação</Label>
                <Select value={offerForm.renewalType} onValueChange={(value: any) => setOfferForm(prev => ({ ...prev, renewalType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">Automática</SelectItem>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="UPGRADE">Upgrade</SelectItem>
                    <SelectItem value="DOWNGRADE">Downgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Valor Proposto (R$/mês)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={offerForm.proposedPrice}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, proposedPrice: parseFloat(e.target.value) || 0 }))}
                  placeholder={selectedPlan.monthlyFee.toString()}
                />
              </div>

              <div>
                <Label>Válido até</Label>
                <Input
                  type="date"
                  value={offerForm.validUntil}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, validUntil: e.target.value }))}
                />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={offerForm.notes}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Detalhes da oferta..."
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <Label>Incentivos</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Desconto (%)</Label>
                    <Input
                      type="number"
                      value={offerForm.incentives.discountPercentage}
                      onChange={(e) => setOfferForm(prev => ({
                        ...prev,
                        incentives: { ...prev.incentives, discountPercentage: parseFloat(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Meses Grátis</Label>
                    <Input
                      type="number"
                      value={offerForm.incentives.freeMonths}
                      onChange={(e) => setOfferForm(prev => ({
                        ...prev,
                        incentives: { ...prev.incentives, freeMonths: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateOffer(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRenewalOffer}>
                <Send className="h-4 w-4 mr-2" />
                Criar Oferta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
