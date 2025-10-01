import React, { useState, useEffect } from 'react';
import { TransportGuide, CreateTransportGuideDTO, TransportGuideFilters } from '@/types/transportGuide';
import { transportGuideService } from '@/services/transportGuideService';
import TransportGuidesTable from './TransportGuidesTable';
import TransportGuideModal from './TransportGuideModal';
import { useToast } from '@/hooks/use-toast';

const TransportGuideTab: React.FC = () => {
  const { toast } = useToast();
  const [guides, setGuides] = useState<TransportGuide[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<TransportGuide | null>(null);

  const loadGuides = async () => {
    setIsLoading(true);
    try {
      const data = await transportGuideService.getTransportGuides();
      setGuides(data);
      console.log('✅ Guias de transporte carregadas:', data.length);
    } catch (error) {
      console.warn('⚠️ Erro ao carregar guias de transporte:', error);
      setGuides([]);
      toast({
        title: 'Aviso',
        description: 'Não foi possível carregar as guias do servidor. Mostrando dados locais.',
        variant: 'default',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGuides();
  }, []);

  const handleCreate = () => {
    setSelectedGuide(null);
    setShowModal(true);
  };

  const handleEdit = (guide: TransportGuide) => {
    setSelectedGuide(guide);
    setShowModal(true);
  };

  const handleView = (guide: TransportGuide) => {
    // Implementar visualização detalhada
    toast({
      title: 'Visualizar Guia',
      description: `Visualizando guia ${guide.numeroArma} da empresa ${guide.empresa}`,
    });
  };

  const handleDelete = async (guide: TransportGuide) => {
    if (window.confirm(`Tem certeza que deseja excluir a guia ${guide.numeroArma}?`)) {
      try {
        await transportGuideService.deleteTransportGuide(guide.id);
        await loadGuides();
        toast({
          title: 'Sucesso',
          description: 'Guia de transporte excluída com sucesso.',
        });
      } catch (error) {
        console.error('Erro ao excluir guia:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao excluir guia de transporte. Tente novamente.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleApprove = async (guide: TransportGuide) => {
    try {
      // Simular ID do supervisor - em produção viria do contexto de autenticação
      const supervisorId = 'supervisor-001';
      await transportGuideService.approveTransportGuide(guide.id, supervisorId);
      await loadGuides();
      toast({
        title: 'Sucesso',
        description: 'Guia de transporte aprovada com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao aprovar guia:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao aprovar guia de transporte. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleReject = async (guide: TransportGuide) => {
    const reason = window.prompt('Motivo da rejeição:');
    if (reason) {
      try {
        // Simular ID do supervisor - em produção viria do contexto de autenticação
        const supervisorId = 'supervisor-001';
        await transportGuideService.rejectTransportGuide(guide.id, supervisorId, reason);
        await loadGuides();
        toast({
          title: 'Sucesso',
          description: 'Guia de transporte rejeitada com sucesso.',
        });
      } catch (error) {
        console.error('Erro ao rejeitar guia:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao rejeitar guia de transporte. Tente novamente.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleSave = async (data: CreateTransportGuideDTO) => {
    try {
      if (selectedGuide) {
        await transportGuideService.updateTransportGuide(selectedGuide.id, data);
      } else {
        await transportGuideService.createTransportGuide(data);
      }
      await loadGuides();
    } catch (error) {
      console.error('Erro ao salvar guia:', error);
      throw error;
    }
  };

  const handleGeneratePDF = async (filters: TransportGuideFilters) => {
    try {
      const blob = await transportGuideService.generatePDFReport(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guias-transporte-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Sucesso',
        description: 'Relatório PDF gerado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório PDF. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <TransportGuidesTable
        guides={guides}
        isLoading={isLoading}
        onRefresh={loadGuides}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        onApprove={handleApprove}
        onReject={handleReject}
        onGeneratePDF={handleGeneratePDF}
      />

      <TransportGuideModal
        open={showModal}
        onOpenChange={setShowModal}
        guide={selectedGuide}
        onSave={handleSave}
      />
    </div>
  );
};

export default TransportGuideTab;