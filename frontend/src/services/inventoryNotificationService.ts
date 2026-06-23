import { InventoryItem, InventoryRequest, ServiceOrder } from '@/types/inventory';

export interface Notification {
  id: string;
  type: 'LOW_STOCK' | 'REQUEST_APPROVED' | 'REQUEST_REJECTED' | 'REQUEST_PENDING' | 'ORDER_CREATED' | 'ORDER_COMPLETED' | 'CRITICAL_STOCK';
  title: string;
  message: string;
  itemId?: string;
  requestId?: string;
  orderId?: string;
  status: 'unread' | 'read';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  actionUrl?: string;
}

export interface NotificationSettings {
  enableLowStock: boolean;
  enableCriticalStock: boolean;
  enableRequestPending: boolean;
  enableRequestApproved: boolean;
  enableRequestRejected: boolean;
  enableOrderCreated: boolean;
  enableOrderCompleted: boolean;
  enableEmail: boolean;
  enableWhatsApp: boolean;
  enableSMS: boolean;
  lowStockThreshold: number;
  criticalStockThreshold: number;
}

class InventoryNotificationService {
  private static instance: InventoryNotificationService;
  private notifications: Notification[] = [];
  private settings: NotificationSettings = {
    enableLowStock: true,
    enableCriticalStock: true,
    enableRequestPending: true,
    enableRequestApproved: true,
    enableRequestRejected: true,
    enableOrderCreated: true,
    enableOrderCompleted: true,
    enableEmail: true,
    enableWhatsApp: false,
    enableSMS: false,
    lowStockThreshold: 10,
    criticalStockThreshold: 3
  };

  private listeners: ((notifications: Notification[]) => void)[] = [];

  private constructor() {
    this.loadSettings();
    this.loadNotifications();
  }

  static getInstance(): InventoryNotificationService {
    if (!InventoryNotificationService.instance) {
      InventoryNotificationService.instance = new InventoryNotificationService();
    }
    return InventoryNotificationService.instance;
  }

  // Métodos de inscrição para listeners
  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    listener(this.notifications);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Métodos de persistência
  private saveNotifications() {
    localStorage.setItem('inventory_notifications', JSON.stringify(this.notifications));
  }

  private loadNotifications() {
    const saved = localStorage.getItem('inventory_notifications');
    if (saved) {
      try {
        this.notifications = JSON.parse(saved);
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
        this.notifications = [];
      }
    }
  }

  private saveSettings() {
    localStorage.setItem('inventory_notification_settings', JSON.stringify(this.settings));
  }

  private loadSettings() {
    const saved = localStorage.getItem('inventory_notification_settings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }

  // Métodos de configuração
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  // Métodos principais de notificação
  checkLowStock(items: InventoryItem[]) {
    if (!this.settings.enableLowStock && !this.settings.enableCriticalStock) {
      return;
    }

    items.forEach(item => {
      if (item.quantity <= item.minimumQuantity) {
        const isCritical = item.quantity <= this.settings.criticalStockThreshold;
        const type = isCritical ? 'CRITICAL_STOCK' : 'LOW_STOCK';
        
        if ((isCritical && this.settings.enableCriticalStock) || (!isCritical && this.settings.enableLowStock)) {
          this.createNotification({
            type,
            title: isCritical ? '⚠️ Estoque Crítico!' : '📦 Estoque Baixo',
            message: `${item.name} está com estoque ${isCritical ? 'crítico' : 'baixo'}. Restam apenas ${item.quantity} unidades (mínimo: ${item.minimumQuantity}).`,
            itemId: item.id,
            priority: isCritical ? 'critical' : 'medium',
            actionUrl: '/inventory'
          });
        }
      }
    });
  }

  onRequestCreated(request: InventoryRequest) {
    if (!this.settings.enableRequestPending) return;

    this.createNotification({
      type: 'REQUEST_PENDING',
      title: '📋 Nova Requisição Pendente',
      message: `${request.employeeName} solicitou ${request.items.length} item(s) para aprovação.`,
      requestId: request.id,
      priority: 'high',
      actionUrl: '/inventory'
    });
  }

  onRequestApproved(request: InventoryRequest) {
    if (!this.settings.enableRequestApproved) return;

    this.createNotification({
      type: 'REQUEST_APPROVED',
      title: '✅ Requisição Aprovada',
      message: `Requisição de ${request.employeeName} foi aprovada com sucesso.`,
      requestId: request.id,
      priority: 'low',
      actionUrl: '/inventory'
    });
  }

  onRequestRejected(request: InventoryRequest, reason?: string) {
    if (!this.settings.enableRequestRejected) return;

    this.createNotification({
      type: 'REQUEST_REJECTED',
      title: '❌ Requisição Rejeitada',
      message: `Requisição de ${request.employeeName} foi rejeitada${reason ? `: ${reason}` : '.'}`,
      requestId: request.id,
      priority: 'medium',
      actionUrl: '/inventory'
    });
  }

  onOrderCreated(order: ServiceOrder) {
    if (!this.settings.enableOrderCreated) return;

    this.createNotification({
      type: 'ORDER_CREATED',
      title: '🔧 Nova Ordem de Serviço',
      message: `${order.orderNumber} criada para ${order.clientName} - Veículo ${order.vehiclePlate}.`,
      orderId: order.id,
      priority: 'medium',
      actionUrl: '/inventory'
    });
  }

  onOrderCompleted(order: ServiceOrder) {
    if (!this.settings.enableOrderCompleted) return;

    this.createNotification({
      type: 'ORDER_COMPLETED',
      title: '✅ Ordem de Serviço Concluída',
      message: `${order.orderNumber} foi concluída com sucesso. Total: R$ ${order.totalCost.toFixed(2)}.`,
      orderId: order.id,
      priority: 'low',
      actionUrl: '/inventory'
    });
  }

  private createNotification(notificationData: Omit<Notification, 'id' | 'status' | 'createdAt'>) {
    const notification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      status: 'unread',
      createdAt: new Date().toISOString()
    };

    this.notifications.unshift(notification);
    this.saveNotifications();
    this.notifyListeners();

    // Enviar notificações externas se configurado
    this.sendExternalNotifications(notification);
  }

  private async sendExternalNotifications(notification: Notification) {
    // Simulação de envio de notificações externas
    if (this.settings.enableEmail) {
      await this.sendEmailNotification(notification);
    }
    
    if (this.settings.enableWhatsApp) {
      await this.sendWhatsAppNotification(notification);
    }
    
    if (this.settings.enableSMS) {
      await this.sendSMSNotification(notification);
    }
  }

  private async sendEmailNotification(notification: Notification) {
    // Simulação de envio de email
    console.log('📧 Enviando notificação por email:', notification);
    // Aqui seria integrado com um serviço de email real
  }

  private async sendWhatsAppNotification(notification: Notification) {
    // Simulação de envio de WhatsApp
    console.log('📱 Enviando notificação por WhatsApp:', notification);
    // Aqui seria integrado com API do WhatsApp
  }

  private async sendSMSNotification(notification: Notification) {
    // Simulação de envio de SMS
    console.log('📲 Enviando notificação por SMS:', notification);
    // Aqui seria integrado com serviço de SMS
  }

  // Métodos de gestão de notificações
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => n.status === 'unread').length;
  }

  getCriticalCount(): number {
    return this.notifications.filter(n => n.priority === 'critical').length;
  }

  getHighCount(): number {
    return this.notifications.filter(n => n.priority === 'high').length;
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && notification.status === 'unread') {
      notification.status = 'read';
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  markAllAsRead() {
    let hasChanges = false;
    this.notifications.forEach(notification => {
      if (notification.status === 'unread') {
        notification.status = 'read';
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  deleteNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
    this.notifyListeners();
  }

  clearAll() {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  // Métodos de utilidade
  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  }

  // Método para verificar estoque automaticamente
  scheduleStockCheck(items: InventoryItem[]) {
    // Verificar estoque a cada 5 minutos
    setInterval(() => {
      this.checkLowStock(items);
    }, 5 * 60 * 1000);
  }
}

export default InventoryNotificationService;
