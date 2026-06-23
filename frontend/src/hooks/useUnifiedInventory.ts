import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import unifiedInventoryService, {
  InventoryItem,
  InventoryMovement,
  InventoryRequest,
  ServiceOrder,
  Supplier,
  CreatePurchaseRequestRequest,
  CreateSupplierRequest
} from '@/services/mockUnifiedInventoryService';
import { useInventoryNotifications } from '@/hooks/useInventoryNotifications';

export function useUnifiedInventory() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { checkLowStock, onRequestCreated } = useInventoryNotifications();
  
  // Estados do inventário
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemsNeedingPurchase, setItemsNeedingPurchase] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  
  // Estados de compras
  const [purchaseRequests, setPurchaseRequests] = useState<InventoryRequest[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  
  // Estados de fornecedores
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  
  // Estados de movimentações
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  
  // Dashboard unificado
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Verificar automaticamente compras necessárias
  useEffect(() => {
    if (items.length > 0) {
      checkAndGeneratePurchaseRequests();
    }
  }, [items]);

  const loadInitialData = async () => {
    try {
      setLoadingItems(true);
      setLoadingPurchases(true);
      setLoadingSuppliers(true);
      setLoadingDashboard(true);

      // Carregar dados em paralelo
      const [itemsData, purchasesData, suppliersData, dashboardDataResponse] = await Promise.all([
        unifiedInventoryService.getItemsForPurchase(),
        unifiedInventoryService.getPurchaseRequestsWithInventory(),
        unifiedInventoryService.getUnifiedSuppliers(),
        unifiedInventoryService.getUnifiedDashboard()
      ]);

      setItems(itemsData);
      setPurchaseRequests(purchasesData);
      setSuppliers(suppliersData);
      setDashboardData(dashboardDataResponse);
      
      // Verificar itens que precisam de compra
      const needsPurchase = itemsData.filter((item: any) => item.needsPurchase);
      setItemsNeedingPurchase(needsPurchase);
      
      // Verificar estoque baixo para notificações
      checkLowStock(itemsData);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do inventário",
        variant: "destructive",
      });
    } finally {
      setLoadingItems(false);
      setLoadingPurchases(false);
      setLoadingSuppliers(false);
      setLoadingDashboard(false);
    }
  };

  const checkAndGeneratePurchaseRequests = async () => {
    try {
      const generatedRequests = await unifiedInventoryService.checkAndGeneratePurchaseRequests();
      
      if (generatedRequests.length > 0) {
        generatedRequests.forEach(request => {
          onRequestCreated(request);
        });
        
        toast({
          title: "Compras Geradas Automaticamente",
          description: `${generatedRequests.length} solicitação(ões) de compra gerada(s) devido a estoque baixo`,
          variant: "default",
        });
        
        // Recarregar solicitações
        const updatedPurchases = await unifiedInventoryService.getPurchaseRequestsWithInventory();
        setPurchaseRequests(updatedPurchases);
      }
    } catch (error) {
      console.error('Erro ao gerar compras automáticas:', error);
    }
  };

  // Métodos para itens
  const createItem = async (itemData: any): Promise<InventoryItem> => {
    try {
      const newItem = await unifiedInventoryService.createInventoryItem(itemData);
      setItems(prev => [...prev, newItem]);
      toast({
        title: "Sucesso",
        description: "Item criado com sucesso",
      });
      return newItem;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o item",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateItem = async (id: string, itemData: any): Promise<InventoryItem> => {
    try {
      const updatedItem = await unifiedInventoryService.updateInventoryItem(id, itemData);
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso",
      });
      return updatedItem;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o item",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteItem = async (id: string): Promise<void> => {
    try {
      await unifiedInventoryService.deleteInventoryItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Sucesso",
        description: "Item excluído com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item",
        variant: "destructive",
      });
    }
  };

  // Métodos para solicitações de compra
  const createPurchaseRequest = async (requestData: CreatePurchaseRequestRequest): Promise<InventoryRequest> => {
    try {
      // Validar solicitação contra estoque
      const validation = await unifiedInventoryService.validatePurchaseRequest(requestData);
      
      if (!validation.valid) {
        validation.warnings.forEach(warning => {
          toast({
            title: "Aviso",
            description: warning,
            variant: "default",
          });
        });
        
        validation.suggestions.forEach(suggestion => {
          toast({
            title: "Sugestão",
            description: suggestion,
            variant: "default",
          });
        });
      }

      const newRequest = await unifiedInventoryService.createPurchaseRequest(requestData);
      setPurchaseRequests(prev => [...prev, newRequest]);
      onRequestCreated(newRequest);
      
      toast({
        title: "Sucesso",
        description: "Solicitação de compra criada com sucesso",
      });
      return newRequest;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a solicitação de compra",
        variant: "destructive",
      });
      throw error;
    }
  };

  const approvePurchaseRequest = async (requestId: string): Promise<void> => {
    try {
      const approverName = user?.name || 'Sistema';
      const result = await unifiedInventoryService.approvePurchaseRequestWithInventory(
        requestId, 
        approverName, 
        'Aprovado via sistema unificado'
      );
      
      // Atualizar solicitação
      setPurchaseRequests(prev => 
        prev.map(req => req.id === requestId ? result.purchaseRequest : req)
      );
      
      // Atualizar movimentações
      setMovements(prev => [...prev, ...result.inventoryMovements]);
      
      // Atualizar itens (estoque aumentado)
      await loadInitialData();
      
      toast({
        title: "Sucesso",
        description: "Solicitação aprovada e entrada no estoque gerada automaticamente",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a solicitação",
        variant: "destructive",
      });
    }
  };

  const generatePurchaseFromServiceOrder = async (serviceOrderId: string): Promise<InventoryRequest> => {
    try {
      const purchaseRequest = await unifiedInventoryService.generatePurchaseOrderFromService(serviceOrderId);
      setPurchaseRequests(prev => [...prev, purchaseRequest]);
      onRequestCreated(purchaseRequest);
      
      toast({
        title: "Sucesso",
        description: "Solicitação de compra gerada a partir da ordem de serviço",
      });
      return purchaseRequest;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar solicitação da ordem de serviço",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Métodos para fornecedores
  const createSupplier = async (supplierData: CreateSupplierRequest): Promise<Supplier> => {
    try {
      const newSupplier = await unifiedInventoryService.createUnifiedSupplier(supplierData);
      setSuppliers(prev => [...prev, newSupplier]);
      
      toast({
        title: "Sucesso",
        description: "Fornecedor criado com sucesso",
      });
      return newSupplier;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o fornecedor",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateSupplier = async (id: string, supplierData: any): Promise<Supplier> => {
    try {
      const updatedSupplier = await unifiedInventoryService.updateSupplier(id, supplierData);
      setSuppliers(prev => prev.map(supplier => supplier.id === id ? updatedSupplier : supplier));
      
      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso",
      });
      return updatedSupplier;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o fornecedor",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteSupplier = async (id: string): Promise<void> => {
    try {
      await unifiedInventoryService.deleteSupplier(id);
      setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Fornecedor excluído com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o fornecedor",
        variant: "destructive",
      });
    }
  };

  // Métodos para movimentações
  const createMovement = async (movementData: any): Promise<InventoryMovement> => {
    try {
      const newMovement = await unifiedInventoryService.createInventoryMovement(movementData);
      setMovements(prev => [...prev, newMovement]);
      
      toast({
        title: "Sucesso",
        description: "Movimentação criada com sucesso",
      });
      return newMovement;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a movimentação",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Métodos de utilidade
  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, []);

  const getItemsNeedingPurchaseCount = useCallback(() => {
    return itemsNeedingPurchase.length;
  }, [itemsNeedingPurchase]);

  const getCriticalItemsCount = useCallback(() => {
    return items.filter((item: any) => (item as any).stockStatus === 'CRITICAL').length;
  }, [items]);

  const getOutOfStockItemsCount = useCallback(() => {
    return items.filter((item: any) => (item as any).stockStatus === 'OUT_OF_STOCK').length;
  }, [items]);

  const getPendingPurchaseRequestsCount = useCallback(() => {
    return purchaseRequests.filter(req => req.status === 'PENDING').length;
  }, [purchaseRequests]);

  const getUrgentPurchaseRequestsCount = useCallback(() => {
    return purchaseRequests.filter(req => req.urgent).length;
  }, [purchaseRequests]);

  return {
    // Estados
    items,
    itemsNeedingPurchase,
    loadingItems,
    purchaseRequests,
    loadingPurchases,
    suppliers,
    loadingSuppliers,
    movements,
    loadingMovements,
    dashboardData,
    loadingDashboard,
    
    // Métodos de itens
    createItem,
    updateItem,
    deleteItem,
    
    // Métodos de compras
    createPurchaseRequest,
    approvePurchaseRequest,
    generatePurchaseFromServiceOrder,
    
    // Métodos de fornecedores
    createSupplier,
    updateSupplier,
    deleteSupplier,
    
    // Métodos de movimentações
    createMovement,
    
    // Métodos de utilidade
    refreshData,
    getItemsNeedingPurchaseCount,
    getCriticalItemsCount,
    getOutOfStockItemsCount,
    getPendingPurchaseRequestsCount,
    getUrgentPurchaseRequestsCount,
    
    // Serviço direto
    unifiedService: unifiedInventoryService
  };
}
