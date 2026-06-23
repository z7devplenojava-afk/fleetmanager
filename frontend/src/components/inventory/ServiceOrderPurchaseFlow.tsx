import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Package,
  FileText,
  Send,
  Eye,
  Download,
  Truck,
  Calendar,
  User,
  Building,
  RefreshCw
} from 'lucide-react';
import { ServiceOrder, ServiceOrderItem } from '@/types/inventory';
import { InventoryRequest, PurchaseOrderData, PurchaseQuotation } from '@/types/purchase';
import serviceOrderPurchaseIntegration from '@/services/serviceOrderPurchaseIntegration';

interface ServiceOrderPurchaseFlowProps {
  serviceOrder: ServiceOrder;
  onPurchaseComplete?: (purchaseRequest: InventoryRequest) => void;
}

export default function ServiceOrderPurchaseFlow({ serviceOrder, onPurchaseComplete }: ServiceOrderPurchaseFlowProps) {
  const [loading, setLoading] = useState(false);
  const [stockCheck, setStockCheck] = useState<{
    missingItems: ServiceOrderItem[];
    availableItems: ServiceOrderItem[];
    purchaseRequest?: InventoryRequest;
  } | null>(null);
  const [purchaseRequest, setPurchaseRequest] = useState<InventoryRequest | null>(null);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderData | null>(null);
  const [quotations, setQuotations] = useState<PurchaseQuotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<PurchaseQuotation | null>(null);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    checkStockAndCreatePurchaseRequest();
  }, [serviceOrder.id]);

  const checkStockAndCreatePurchaseRequest = async () => {
    try {
      setLoading(true);
      const result = await serviceOrderPurchaseIntegration.checkStockAndCreatePurchaseRequest(serviceOrder);
      setStockCheck(result.integration);
      
      if (result.purchaseRequest) {
        setPurchaseRequest(result.purchaseRequest);
        if (onPurchaseComplete) {
          onPurchaseComplete(result.purchaseRequest);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar estoque:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePurchaseRequest = async () => {
    if (!purchaseRequest) return;
    
    try {
      setLoading(true);
      // Simular aprovação
      const approvedRequest = { ...purchaseRequest, status: 'APPROVED' as any };
      setPurchaseRequest(approvedRequest);
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuotations = () => {
    // Simular geração de cotações
    const mockQuotations: PurchaseQuotation[] = [
      {
        id: '1',
        supplierId: 'supplier-001',
        supplierName: 'Auto Peças Central',
        items: stockCheck?.missingItems.map(item => ({
          itemId: item.id,
          itemName: item.description,
          quantity: item.quantity,
          unitPrice: (item.unitPrice || 0) * 0.95, // 5% de desconto
          totalPrice: (item.totalPrice || 0) * 0.95,
          available: true
        })) || [],
        totalValue: (stockCheck?.missingItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0) * 0.95,
        deliveryTime: 3,
        paymentTerms: '30 dias',
        validity: '2024-05-15',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        supplierId: 'supplier-002',
        supplierName: 'Pneus Express',
        items: stockCheck?.missingItems.map(item => ({
          itemId: item.id,
          itemName: item.description,
          quantity: item.quantity,
          unitPrice: (item.unitPrice || 0) * 1.10, // 10% mais caro
          totalPrice: (item.totalPrice || 0) * 1.10,
          available: true
        })) || [],
        totalValue: (stockCheck?.missingItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0) * 1.10,
        deliveryTime: 7,
        paymentTerms: '15 dias',
        validity: '2024-05-20',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        supplierId: 'supplier-003',
        supplierName: 'Peças Rápidas',
        items: stockCheck?.missingItems.map(item => ({
          itemId: item.id,
          itemName: item.description,
          quantity: item.quantity,
          unitPrice: (item.unitPrice || 0) * 1.02, // 2% mais caro
          totalPrice: (item.totalPrice || 0) * 1.02,
          available: true
        })) || [],
        totalValue: (stockCheck?.missingItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0) * 1.02,
        deliveryTime: 5,
        paymentTerms: '45 dias',
        validity: '2024-05-18',
        createdAt: new Date().toISOString()
      }
    ];
    
    setQuotations(mockQuotations);
  };

  const handleSelectQuotation = (quotation: PurchaseQuotation) => {
    setSelectedQuotation(quotation);
  };

  const handleConvertToPurchaseOrder = async () => {
    if (!purchaseRequest || !selectedQuotation) return;
    
    try {
      setLoading(true);
      const emergencyPurchase = purchaseRequest.priority === 'URGENT';
      const orderData = await serviceOrderPurchaseIntegration.convertPurchaseRequestToPurchaseOrder(
        purchaseRequest.id,
        selectedQuotation,
        emergencyPurchase
      );
      setPurchaseOrder(orderData);
    } catch (error) {
      console.error('Erro ao converter em Ordem de Compra:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!purchaseOrder) return;
    
    try {
      setLoading(true);
      await serviceOrderPurchaseIntegration.generatePurchaseOrderPDF(purchaseOrder);
      setPdfGenerated(true);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToSupplier = async () => {
    if (!purchaseOrder) return;
    
    try {
      setLoading(true);
      const result = await serviceOrderPurchaseIntegration.sendPurchaseOrderToSupplier(purchaseOrder);
      if (result.success) {
        setEmailSent(result.emailSent || false);
      }
    } catch (error) {
      console.error('Erro ao enviar para fornecedor:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-blue-100 text-blue-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'SENT': 'bg-purple-100 text-purple-800',
      'RECEIVED': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Fluxo de Compras
          </h3>
          <p className="text-sm text-muted-foreground">
            Gerenciamento automático de compras baseado na Ordem de Serviço
          </p>
        </div>
        <Button onClick={checkStockAndCreatePurchaseRequest} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Verificar Estoque
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Processando verificação de estoque e criação de solicitação de compra...
          </AlertDescription>
        </Alert>
      )}

      {/* Stock Check Results */}
      {stockCheck && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Itens Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockCheck.availableItems.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhum item disponível no estoque</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stockCheck.availableItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.description}</div>
                        <div className="text-xs text-muted-foreground">
                          Quantidade: {item.quantity}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        ✓ Disponível
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Itens Faltantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockCheck.missingItems.length === 0 ? (
                <div className="text-center py-4 text-green-600">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Todos os itens estão disponíveis!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stockCheck.missingItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded bg-red-50">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.description}</div>
                        <div className="text-xs text-muted-foreground">
                          Necessário: {item.quantity} | 
                          Estoque: {(item as any).currentStock || 0}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-red-600">
                        ✗ Faltante
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 p-2 bg-orange-50 rounded">
                    <div className="text-sm font-medium text-orange-800">
                      Valor total dos itens faltantes: 
                      </div>
                    <div className="text-lg font-bold text-orange-800">
                      {formatCurrency(stockCheck.missingItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Purchase Request */}
      {purchaseRequest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Solicitação de Compra Gerada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Número:</span>
                  <div className="font-bold">{purchaseRequest.requestNumber}</div>
                </div>
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getStatusColor(purchaseRequest.status)}>
                    {purchaseRequest.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Prioridade:</span>
                  <Badge className={getPriorityColor(purchaseRequest.priority)}>
                    {purchaseRequest.priority}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Valor Total:</span>
                  <div className="font-bold text-lg">
                    {formatCurrency(purchaseRequest.estimatedTotal || 0)}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">Descrição:</span>
                <div className="text-sm text-muted-foreground">
                  {purchaseRequest.description}
                </div>
              </div>

              {purchaseRequest.status === 'PENDING' && (
                <div className="flex space-x-2">
                  <Button onClick={handleApprovePurchaseRequest} disabled={loading}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar Solicitação
                  </Button>
                  <Button onClick={handleGenerateQuotations} variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar Cotações
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quotations */}
      {quotations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Cotações Recebidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quotations.map((quotation) => (
                <div 
                  key={quotation.id} 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedQuotation?.id === quotation.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSelectQuotation(quotation)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{quotation.supplierName}</div>
                        <div className="text-sm text-muted-foreground">
                          Prazo: {quotation.deliveryTime} dias | 
                          Pagamento: {quotation.paymentTerms}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatCurrency(quotation.totalValue)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Validade: {new Date(quotation.validity).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Itens: {quotation.items.length} produtos
                  </div>
                </div>
              ))}

              {selectedQuotation && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-green-800">
                        Cotação selecionada: {selectedQuotation.supplierName}
                      </div>
                      <div className="text-sm text-green-600">
                        Economia: {formatCurrency(
                          Math.max(...quotations.map(q => q.totalValue)) - selectedQuotation.totalValue
                        )}
                      </div>
                    </div>
                    <Button onClick={handleConvertToPurchaseOrder} disabled={loading}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Converter em Ordem de Compra
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Order */}
      {purchaseOrder && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Ordem de Compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Número:</span>
                  <div className="font-bold">{purchaseOrder.orderNumber}</div>
                </div>
                <div>
                  <span className="text-sm font-medium">Fornecedor:</span>
                  <div className="font-medium">{purchaseOrder.supplierName}</div>
                </div>
                <div>
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getStatusColor(purchaseOrder.status)}>
                    {purchaseOrder.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Tipo:</span>
                  <Badge className={purchaseOrder.emergencyPurchase ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                    {purchaseOrder.emergencyPurchase ? 'EMERGÊNCIA' : 'NORMAL'}
                  </Badge>
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(purchaseOrder.totalValue)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Valor Total da Compra
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleGeneratePDF} variant="outline" disabled={loading || pdfGenerated}>
                  <Download className="h-4 w-4 mr-2" />
                  {pdfGenerated ? 'PDF Gerado' : 'Gerar PDF'}
                </Button>
                <Button 
                  onClick={handleSendToSupplier} 
                  disabled={loading || emailSent}
                  className={purchaseOrder.emergencyPurchase ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {emailSent ? 'Enviado' : 'Enviar para Fornecedor'}
                </Button>
              </div>

              {emailSent && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    PDF enviado com sucesso para o fornecedor {purchaseOrder.supplierName}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
