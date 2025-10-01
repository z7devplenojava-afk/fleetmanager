import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Plus, 
  BarChart3,
  FileText,
  Download,
  AlertCircle,
  X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EPIControlRecord, EPIControlFormData, EPIControlStats } from '@/types/epiControl';
import epiControlService from '@/services/epiControlService';
import EPIControlForm from '@/components/epi/EPIControlForm';
import EPIControlTable from '@/components/epi/EPIControlTable';
import EPIControlViewModal from '@/components/epi/EPIControlViewModal';
import epiControlReportGenerator from '@/utils/epiControlReportGenerator';
import epiReceiptGenerator from '@/utils/epiReceiptGenerator';

const EPIControl: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedRecord, setSelectedRecord] = useState<EPIControlRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EPIControlFormData | null>(null);

  const queryClient = useQueryClient();

  // Buscar registros
  const { 
    data: records = [], 
    isLoading: recordsLoading,
    error: recordsError
  } = useQuery({
    queryKey: ['epiControlRecords'],
    queryFn: () => epiControlService.getEPIControlRecords()
  });

  // Buscar estatísticas
  const { 
    data: stats, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ['epiControlStats'],
    queryFn: () => epiControlService.getEPIControlStats()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: EPIControlFormData) => epiControlService.createEPIControlRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epiControlRecords'] });
      queryClient.invalidateQueries({ queryKey: ['epiControlStats'] });
      toast.success('Registro de controle de EPI criado com sucesso!');
      setIsFormModalOpen(false);
    },
    onError: (error) => {
      toast.error('Erro ao criar registro de controle de EPI');
      console.error('Erro:', error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EPIControlFormData> }) => 
      epiControlService.updateEPIControlRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epiControlRecords'] });
      queryClient.invalidateQueries({ queryKey: ['epiControlStats'] });
      toast.success('Registro de controle de EPI atualizado com sucesso!');
      setIsFormModalOpen(false);
      setEditingRecord(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar registro de controle de EPI');
      console.error('Erro:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => epiControlService.deleteEPIControlRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epiControlRecords'] });
      queryClient.invalidateQueries({ queryKey: ['epiControlStats'] });
      toast.success('Registro de controle de EPI excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir registro de controle de EPI');
      console.error('Erro:', error);
    }
  });

  // Handlers
  const handleCreateNew = () => {
    setEditingRecord(null);
    setIsFormModalOpen(true);
  };

  const handleView = (record: EPIControlRecord) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleEdit = (record: EPIControlRecord) => {
    setIsViewModalOpen(false); // Fechar modal de visualização
    
    // Converter EPIControlRecord para EPIControlFormData
    const formData = {
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      employeeFunction: record.employeeFunction,
      employeeCpf: record.employeeCpf,
      employeeRg: record.employeeRg,
      admissionDate: record.admissionDate,
      dismissalDate: record.dismissalDate,
      equipmentItems: record.equipmentItems.map(item => ({
        equipmentName: item.equipmentName,
        equipmentNumber: item.equipmentNumber,
        ca: item.ca,
        quantity: item.quantity,
        deliveryDate: item.deliveryDate,
        replacedDate: item.replacedDate,
        replacementReason: item.replacementReason,
        signature: item.signature
      })),
      deliveryDate: record.deliveryDate,
      responsibleDelivery: record.responsibleDelivery,
      signature: record.signature,
      observations: record.observations
    };
    
    setEditingRecord(formData);
    setIsFormModalOpen(true);
  };

  const handleDelete = (record: EPIControlRecord) => {
    if (window.confirm(`Tem certeza que deseja excluir o registro de controle de EPI de ${record.employeeName}?`)) {
      deleteMutation.mutate(record.id);
    }
  };

  const handleGenerateReport = async (record: EPIControlRecord) => {
    try {
      await epiControlReportGenerator.generatePDF(record);
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar relatório PDF');
      console.error('Erro:', error);
    }
  };

  const handleGenerateReceipt = async (record: EPIControlRecord) => {
    try {
      await epiReceiptGenerator.generatePDF(record);
      toast.success('Recibo de EPI gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar recibo de EPI');
      console.error('Erro:', error);
    }
  };

  const handleSave = (data: EPIControlFormData) => {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    setIsFormModalOpen(false);
    setEditingRecord(null);
  };

  const isLoading = recordsLoading || statsLoading;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-seguranca-lightgray">
            Controle de EPI
          </h2>
          <p className="text-gray-400 mt-1">
            Gestão completa dos equipamentos de proteção individual
          </p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2 bg-seguranca-red hover:bg-seguranca-darkred">
          <Plus className="h-4 w-4" />
          Novo Registro
        </Button>
      </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-seguranca-lightgray">Total de Registros</p>
                    <p className="text-2xl font-bold text-seguranca-lightgray">{stats.totalRecords}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-graphite border-gray-600">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-seguranca-lightgray">Funcionários Ativos</p>
                    <p className="text-2xl font-bold text-seguranca-lightgray">{stats.activeEmployees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-graphite border-gray-600">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-seguranca-lightgray">Funcionários Demitidos</p>
                    <p className="text-2xl font-bold text-seguranca-lightgray">{stats.dismissedEmployees}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-graphite border-gray-600">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-seguranca-lightgray">Total de EPIs</p>
                    <p className="text-2xl font-bold text-seguranca-lightgray">{stats.totalEquipmentItems}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Lista de Registros</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <EPIControlTable
              records={records}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onGenerateReport={handleGenerateReport}
              onGenerateReceipt={handleGenerateReceipt}
              onCreateNew={handleCreateNew}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                  <Download className="h-5 w-5" />
                  Relatórios de Controle de EPI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2 border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                    onClick={() => {
                      // Implementar relatório em lote
                      toast.info('Funcionalidade de relatório em lote em desenvolvimento');
                    }}
                  >
                    <FileText className="h-6 w-6" />
                    Relatório em Lote
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center gap-2 border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                    onClick={() => {
                      // Implementar relatório de estatísticas
                      toast.info('Funcionalidade de relatório de estatísticas em desenvolvimento');
                    }}
                  >
                    <BarChart3 className="h-6 w-6" />
                    Relatório de Estatísticas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <EPIControlViewModal
          record={selectedRecord}
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          onEdit={handleEdit}
          onGenerateReport={handleGenerateReport}
        />

        {isFormModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-seguranca-lightgray hover:bg-seguranca-black z-10"
                onClick={handleCancel}
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 text-seguranca-lightgray pr-10">
                  {editingRecord ? 'Editar Registro de Controle de EPI' : 'Novo Registro de Controle de EPI'}
                </h2>
                <EPIControlForm
                  initialData={editingRecord}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  isLoading={isSaving}
                />
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default EPIControl;
