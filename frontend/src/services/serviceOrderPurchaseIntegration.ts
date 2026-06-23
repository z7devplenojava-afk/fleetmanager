import { ServiceOrder, ServiceOrderItem } from '@/types/inventory';
import { InventoryRequest, InventoryRequestItem, CreatePurchaseRequestRequest } from '@/types/purchase';
import unifiedInventoryService from './unifiedInventoryService';

interface ServiceOrderPurchaseIntegration {
  serviceOrder: ServiceOrder;
  purchaseRequest: InventoryRequest;
  missingItems: ServiceOrderItem[];
  availableItems: ServiceOrderItem[];
  stockCheckDate: string;
}

interface PurchaseOrderData {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalValue: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT' | 'RECEIVED';
  emergencyPurchase: boolean;
  createdAt: string;
  approvedAt?: string;
  sentAt?: string;
  receivedAt?: string;
  quotations?: PurchaseQuotation[];
}

interface PurchaseQuotation {
  id: string;
  supplierId: string;
  supplierName: string;
  items: QuotationItem[];
  totalValue: number;
  deliveryTime: number;
  paymentTerms: string;
  validity: string;
  createdAt: string;
}

interface QuotationItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  available: boolean;
}

interface PurchaseOrderItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specification: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  urgency: 'NORMAL' | 'IMMEDIATE';
}

class ServiceOrderPurchaseIntegration {
  private static instance: ServiceOrderPurchaseIntegration;

  private constructor() {}

  static getInstance(): ServiceOrderPurchaseIntegration {
    if (!ServiceOrderPurchaseIntegration.instance) {
      ServiceOrderPurchaseIntegration.instance = new ServiceOrderPurchaseIntegration();
    }
    return ServiceOrderPurchaseIntegration.instance;
  }

  /**
   * Verifica o estoque para os itens da Ordem de Serviço e cria solicitação de compra se necessário
   */
  async checkStockAndCreatePurchaseRequest(serviceOrder: ServiceOrder): Promise<{
    integration: ServiceOrderPurchaseIntegration;
    purchaseRequest?: InventoryRequest;
  }> {
    try {
      const { itemsNeedingPurchase, availableItems, missingItems } = await this.checkStockAvailability(serviceOrder);

      if (missingItems.length === 0) {
        // Todos os itens estão disponíveis
        return {
          integration: {
            serviceOrder,
            purchaseRequest: {} as InventoryRequest,
            missingItems: [],
            availableItems,
            stockCheckDate: new Date().toISOString()
          }
        };
      }

      // Criar solicitação de compra para itens faltantes
      const purchaseRequest = await this.createPurchaseRequestFromServiceOrder(serviceOrder, missingItems);

      return {
        integration: {
          serviceOrder,
          purchaseRequest,
          missingItems,
          availableItems,
          stockCheckDate: new Date().toISOString()
        },
        purchaseRequest
      };
    } catch (error) {
      console.error('Erro ao verificar estoque e criar solicitação de compra:', error);
      throw error;
    }
  }

  /**
   * Verifica disponibilidade dos itens no estoque
   */
  private async checkStockAvailability(serviceOrder: ServiceOrder): Promise<{
    itemsNeedingPurchase: ServiceOrderItem[];
    availableItems: ServiceOrderItem[];
    missingItems: ServiceOrderItem[];
  }> {
    const partsItems = serviceOrder.items.filter(item => item.type === 'PART');
    const availableItems: ServiceOrderItem[] = [];
    const missingItems: ServiceOrderItem[] = [];

    // Obter itens do estoque
    const inventoryItems = await unifiedInventoryService.getInventoryItems();

    for (const serviceItem of partsItems) {
      const inventoryItem = inventoryItems.find(inv => 
        inv.name.toLowerCase().includes(serviceItem.description.toLowerCase()) ||
        inv.description?.toLowerCase().includes(serviceItem.description.toLowerCase())
      );

      if (inventoryItem && inventoryItem.quantity >= serviceItem.quantity) {
        availableItems.push(serviceItem);
      } else {
        missingItems.push({
          ...serviceItem,
          // Adicionar informações do estoque se disponível
          currentStock: inventoryItem?.quantity || 0,
          minimumStock: inventoryItem?.minimumQuantity || 0
        } as any);
      }
    }

    return {
      itemsNeedingPurchase: missingItems,
      availableItems,
      missingItems
    };
  }

  /**
   * Cria solicitação de compra baseada na Ordem de Serviço
   */
  private async createPurchaseRequestFromServiceOrder(
    serviceOrder: ServiceOrder, 
    missingItems: ServiceOrderItem[]
  ): Promise<InventoryRequest> {
    const requestItems: InventoryRequestItem[] = missingItems.map(item => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      itemName: item.description,
      description: `Peça necessária para Ordem de Serviço ${serviceOrder.orderNumber} - Veículo: ${serviceOrder.vehiclePlate}`,
      quantity: item.quantity,
      unitPrice: item.unitPrice || 0,
      totalPrice: item.totalPrice || 0,
      specification: `Veículo: ${serviceOrder.vehiclePlate} | Cliente: ${serviceOrder.clientName}`,
      priority: this.determinePriority(serviceOrder, item),
      urgency: this.determineUrgency(serviceOrder, item),
      currentStock: (item as any).currentStock || 0,
      minimumStock: (item as any).minimumStock || 0
    }));

    const purchaseRequestData: CreatePurchaseRequestRequest = {
      title: `Compra para O.S. ${serviceOrder.orderNumber}`,
      description: `Peças necessárias para execução da Ordem de Serviço ${serviceOrder.orderNumber} - Cliente: ${serviceOrder.clientName} - Veículo: ${serviceOrder.vehiclePlate}`,
      priority: this.determineOverallPriority(serviceOrder, missingItems),
      urgency: this.determineOverallUrgency(serviceOrder, missingItems),
      justification: `Compra gerada automaticamente a partir da Ordem de Serviço ${serviceOrder.orderNumber} devido à falta de itens no estoque`,
      estimatedTotal: missingItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
      items: requestItems,
      requesterName: 'Sistema Automático - Estoque',
      department: 'Almoxarifado',
      requiredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 dias
    };

    return await unifiedInventoryService.createPurchaseRequest(purchaseRequestData);
  }

  /**
   * Converte solicitação de compra aprovada em Ordem de Compra
   */
  async convertPurchaseRequestToPurchaseOrder(
    purchaseRequestId: string,
    selectedQuotation?: PurchaseQuotation,
    emergencyPurchase: boolean = false
  ): Promise<PurchaseOrderData> {
    try {
      const purchaseRequest = await unifiedInventoryService.getPurchaseRequestById(purchaseRequestId);
      
      if (!purchaseRequest) {
        throw new Error('Solicitação de compra não encontrada');
      }

      const purchaseOrder: PurchaseOrderData = {
        id: Date.now().toString(),
        orderNumber: `OC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        supplierId: selectedQuotation?.supplierId || '',
        supplierName: selectedQuotation?.supplierName || 'A definir',
        items: purchaseRequest.items?.map(item => ({
          id: item.id,
          itemName: item.itemName,
          description: item.description,
          quantity: item.quantity,
          unitPrice: selectedQuotation?.items.find(q => q.itemName === item.itemName)?.unitPrice || item.unitPrice || 0,
          totalPrice: selectedQuotation?.items.find(q => q.itemName === item.itemName)?.totalPrice || item.totalPrice || 0,
          specification: item.specification,
          priority: item.priority,
          urgency: emergencyPurchase ? 'IMMEDIATE' : item.urgency
        })) || [],
        totalValue: selectedQuotation?.totalValue || purchaseRequest.estimatedTotal || 0,
        status: 'PENDING',
        emergencyPurchase,
        createdAt: new Date().toISOString(),
        quotations: selectedQuotation ? [selectedQuotation] : undefined
      };

      // Atualizar status da solicitação de compra
      await unifiedInventoryService.updatePurchaseRequestStatus(purchaseRequestId, 'APPROVED');

      return purchaseOrder;
    } catch (error) {
      console.error('Erro ao converter solicitação em Ordem de Compra:', error);
      throw error;
    }
  }

  /**
   * Gera PDF da Ordem de Compra para enviar ao fornecedor
   */
  async generatePurchaseOrderPDF(purchaseOrder: PurchaseOrderData): Promise<Blob> {
    const html = this.createPurchaseOrderHTML(purchaseOrder);
    
    // Usar html2canvas e jsPDF para gerar o PDF
    const { jsPDF } = await import('jspdf');
    const html2canvas = await import('html2canvas');
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '800px';
    document.body.appendChild(tempDiv);

    const canvas = await html2canvas.default(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    document.body.removeChild(tempDiv);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  }

  /**
   * Envia PDF da Ordem de Compra para o fornecedor
   */
  async sendPurchaseOrderToSupplier(purchaseOrder: PurchaseOrderData): Promise<{
    success: boolean;
    emailSent?: boolean;
    pdfGenerated?: boolean;
    error?: string;
  }> {
    try {
      // Gerar PDF
      const pdfBlob = await this.generatePurchaseOrderPDF(purchaseOrder);
      
      // Simular envio por email
      const emailData = {
        to: purchaseOrder.supplierEmail || 'fornecedor@exemplo.com',
        subject: `Ordem de Compra ${purchaseOrder.orderNumber}`,
        body: `
          Prezado(a) ${purchaseOrder.supplierName},
          
          Segue anexo a Ordem de Compra ${purchaseOrder.orderNumber}.
          
          Valor Total: R$ ${purchaseOrder.totalValue.toFixed(2)}
          Prazo de Entrega: ${purchaseOrder.emergencyPurchase ? 'IMEDIATO' : 'Padrão'}
          
          Aguardamos confirmação de recebimento.
          
          Atenciosamente,
          Fleet Manager System
        `,
        attachment: pdfBlob,
        fileName: `ordem-compra-${purchaseOrder.orderNumber}.pdf`
      };

      // Simular envio (em produção, integrar com serviço de email)
      console.log('Enviando email para fornecedor:', emailData);
      
      // Atualizar status da Ordem de Compra
      await this.updatePurchaseOrderStatus(purchaseOrder.id, 'SENT');

      return {
        success: true,
        emailSent: true,
        pdfGenerated: true
      };
    } catch (error) {
      console.error('Erro ao enviar Ordem de Compra:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Obtém histórico de integrações entre Ordens de Serviço e Compras
   */
  async getIntegrationHistory(serviceOrderId?: string): Promise<ServiceOrderPurchaseIntegration[]> {
    // Em um ambiente real, buscar do backend
    return [];
  }

  // Métodos privados auxiliares

  private determinePriority(serviceOrder: ServiceOrder, item: ServiceOrderItem): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    // Se a O.S. for urgente, todos os itens são urgentes
    if (serviceOrder.status === 'IN_PROGRESS' && this.isUrgentServiceOrder(serviceOrder)) {
      return 'URGENT';
    }
    
    // Baseado no valor do item
    if (item.totalPrice && item.totalPrice > 500) return 'HIGH';
    if (item.totalPrice && item.totalPrice > 200) return 'MEDIUM';
    return 'LOW';
  }

  private determineUrgency(serviceOrder: ServiceOrder, item: ServiceOrderItem): 'NORMAL' | 'IMMEDIATE' {
    // Compra de emergência se o veículo estiver parado
    if (serviceOrder.status === 'IN_PROGRESS' && this.isUrgentServiceOrder(serviceOrder)) {
      return 'IMMEDIATE';
    }
    return 'NORMAL';
  }

  private determineOverallPriority(serviceOrder: ServiceOrder, missingItems: ServiceOrderItem[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    if (this.isUrgentServiceOrder(serviceOrder)) return 'URGENT';
    if (missingItems.some(item => (item.totalPrice || 0) > 500)) return 'HIGH';
    if (missingItems.length > 3) return 'HIGH';
    return 'MEDIUM';
  }

  private determineOverallUrgency(serviceOrder: ServiceOrder, missingItems: ServiceOrderItem[]): 'NORMAL' | 'IMMEDIATE' {
    return this.isUrgentServiceOrder(serviceOrder) ? 'IMMEDIATE' : 'NORMAL';
  }

  private isUrgentServiceOrder(serviceOrder: ServiceOrder): boolean {
    // Considerar urgente se o veículo estiver em manutenção há mais de 24h
    if (serviceOrder.status !== 'IN_PROGRESS') return false;
    
    const createdDate = new Date(serviceOrder.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff > 24;
  }

  private createPurchaseOrderHTML(purchaseOrder: PurchaseOrderData): string {
    const items = purchaseOrder.items || [];
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            color: #000000;
            line-height: 1.4;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border: 1px solid #e5e7eb;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #1f2937;
          }
          .emergency {
            background-color: #fef2f2;
            color: #dc2626;
            padding: 10px;
            border-radius: 8px;
            border: 2px solid #dc2626;
            text-align: center;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-section {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
          }
          .info-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #1f2937;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th {
            background-color: #f3f4f6;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #e5e7eb;
          }
          .items-table td {
            padding: 12px;
            border: 1px solid #e5e7eb;
          }
          .total-section {
            text-align: right;
            margin-top: 20px;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 8px;
          }
          .total-value {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">Ordem de Compra</div>
            <div style="font-size: 18px; margin-bottom: 10px;">${purchaseOrder.orderNumber}</div>
            <div style="font-size: 14px; color: #6b7280;">Data: ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>

          ${purchaseOrder.emergencyPurchase ? `
          <div class="emergency">
            ⚠️ COMPRA DE EMERGÊNCIA - ENTREGA IMEDIATA OBRIGATÓRIA ⚠️
          </div>
          ` : ''}

          <div class="info-grid">
            <div class="info-section">
              <div class="info-title">Fornecedor</div>
              <div><strong>Nome:</strong> ${purchaseOrder.supplierName}</div>
              <div><strong>ID:</strong> ${purchaseOrder.supplierId}</div>
            </div>
            <div class="info-section">
              <div class="info-title">Informações da Compra</div>
              <div><strong>Status:</strong> ${purchaseOrder.status}</div>
              <div><strong>Tipo:</strong> ${purchaseOrder.emergencyPurchase ? 'Emergência' : 'Normal'}</div>
              <div><strong>Data:</strong> ${new Date(purchaseOrder.createdAt).toLocaleDateString('pt-BR')}</div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Descrição</th>
                <th>Quantidade</th>
                <th>Valor Unit.</th>
                <th>Valor Total</th>
                <th>Prioridade</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.itemName}</td>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>R$ ${item.unitPrice.toFixed(2)}</td>
                  <td>R$ ${item.totalPrice.toFixed(2)}</td>
                  <td>
                    <span style="
                      background-color: ${item.priority === 'URGENT' ? '#dc2626' : item.priority === 'HIGH' ? '#f59e0b' : '#10b981'};
                      color: white;
                      padding: 4px 8px;
                      border-radius: 4px;
                      font-size: 12px;
                    ">
                      ${item.priority === 'URGENT' ? 'URGENTE' : item.priority === 'HIGH' ? 'ALTA' : 'NORMAL'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div style="font-size: 16px; margin-bottom: 10px;">Valor Total da Compra:</div>
            <div class="total-value">R$ ${purchaseOrder.totalValue.toFixed(2)}</div>
          </div>

          <div class="footer">
            <div>Documento gerado automaticamente pelo Fleet Manager System</div>
            <div>Data de geração: ${new Date().toLocaleString('pt-BR')}</div>
            <div>Esta é uma Ordem de Compra ${purchaseOrder.emergencyPurchase ? 'de emergência' : 'padrão'}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async updatePurchaseOrderStatus(orderId: string, status: string): Promise<void> {
    // Em um ambiente real, atualizar no backend
    console.log(`Atualizando status da Ordem de Compra ${orderId} para ${status}`);
  }
}

export default ServiceOrderPurchaseIntegration.getInstance();
