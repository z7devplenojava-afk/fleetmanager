import React, { useState } from 'react';
import { OrdemServicoSSTTable } from '@/components/ordemServicoSST/OrdemServicoSSTTable';
import { OrdemServicoSSTFormModal } from '@/components/ordemServicoSST/OrdemServicoSSTFormModal';
import { OrderOfServiceSST } from '@/types/orderOfServiceSST';

export default function OrdensServicoSST() {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderOfServiceSST | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    setSelectedOrder(undefined);
    setFormModalOpen(true);
  };

  const handleEdit = (order: OrderOfServiceSST) => {
    setSelectedOrder(order);
    setFormModalOpen(true);
  };

  const handleView = (order: OrderOfServiceSST) => {
    // Implementar visualização detalhada se necessário
    console.log('Visualizar ordem:', order);
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ordens de Serviço SST</h1>
        <p className="text-muted-foreground">
          Gerencie as ordens de serviço de Saúde e Segurança do Trabalho
        </p>
      </div>

      <OrdemServicoSSTTable
        key={refreshKey}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
      />

      <OrdemServicoSSTFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        order={selectedOrder}
        onSuccess={handleSuccess}
      />
    </div>
  );
} 