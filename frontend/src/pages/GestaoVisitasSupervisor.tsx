import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  List, 
  Plus, 
  FileText, 
  Settings,
  Calendar,
  CheckSquare,
  TrendingUp
} from 'lucide-react';
import VisitDashboard from '@/components/visits/VisitDashboard';
import VisitList from '@/components/visits/VisitList';
import VisitModal from '@/components/visits/VisitModal';
import VisitChecklist from '@/components/visits/VisitChecklist';
import VisitReports from '@/components/visits/VisitReports';
import { Visit } from '@/types/visit';
import { useToast } from '@/hooks/use-toast';

const GestaoVisitasSupervisor: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [checklistVisit, setChecklistVisit] = useState<Visit | null>(null);

  const handleCreateVisit = () => {
    setSelectedVisit(null);
    setModalOpen(true);
  };

  const handleEditVisit = (visit: Visit) => {
    setSelectedVisit(visit);
    setModalOpen(true);
  };

  const handleViewVisit = (visit: Visit) => {
    setChecklistVisit(visit);
    setActiveTab('checklist');
  };

  const handleDeleteVisit = (visit: Visit) => {
    toast({
      title: "Visita Excluída",
      description: `Visita para ${visit.unitName} foi excluída com sucesso`,
    });
  };

  const handleCompleteVisit = (visit: Visit) => {
    toast({
      title: "Visita Finalizada",
      description: `Visita para ${visit.unitName} foi marcada como realizada`,
    });
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    setSelectedVisit(null);
    toast({
      title: "Sucesso!",
      description: "Operação realizada com sucesso",
    });
  };

  const handleViewReports = () => {
    setActiveTab('reports');
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    toast({
      title: "Exportação Iniciada",
      description: `Relatório será exportado em formato ${format.toUpperCase()}`,
    });
  };

  return (
    <StandardLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Gestão de Visitas de Supervisor
            </h1>
          </div>
          <p className="text-gray-600">
            Gerencie visitas, acompanhe performance e monitore atividades dos supervisores
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="visits" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <List className="w-4 h-4 mr-2" />
              Visitas
            </TabsTrigger>
            <TabsTrigger value="checklist" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <CheckSquare className="w-4 h-4 mr-2" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard">
            <VisitDashboard
              onViewVisits={() => setActiveTab('visits')}
              onCreateVisit={handleCreateVisit}
              onViewReports={handleViewReports}
            />
          </TabsContent>

          {/* Lista de Visitas */}
          <TabsContent value="visits">
            <VisitList
              onCreateVisit={handleCreateVisit}
              onEditVisit={handleEditVisit}
              onViewVisit={handleViewVisit}
              onDeleteVisit={handleDeleteVisit}
              onCompleteVisit={handleCompleteVisit}
            />
          </TabsContent>

          {/* Checklist */}
          <TabsContent value="checklist">
            {checklistVisit ? (
              <VisitChecklist
                visit={checklistVisit}
                onComplete={(visit) => {
                  handleCompleteVisit(visit);
                  setChecklistVisit(null);
                }}
                onSave={(visit) => {
                  toast({
                    title: "Checklist Salvo",
                    description: "Progresso do checklist foi salvo com sucesso",
                  });
                }}
              />
            ) : (
              <div className="text-center py-12">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma visita selecionada
                </h3>
                <p className="text-gray-600 mb-4">
                  Selecione uma visita na aba "Visitas" para acessar o checklist
                </p>
                <button
                  onClick={() => setActiveTab('visits')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Ver Visitas
                </button>
              </div>
            )}
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="reports">
            <VisitReports onExport={handleExport} />
          </TabsContent>

          {/* Configurações */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Configurações de Notificação</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Configure como e quando receber notificações sobre visitas
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                    Configurar
                  </button>
                </div>

                <div className="p-6 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Templates de Checklist</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Personalize os itens do checklist de acordo com suas necessidades
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                    Personalizar
                  </button>
                </div>

                <div className="p-6 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Integrações</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Configure integrações com sistemas externos
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                    Configurar
                  </button>
                </div>

                <div className="p-6 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Backup de Dados</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Configure backup automático dos dados de visitas
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                    Configurar
                  </button>
                </div>

                <div className="p-6 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Relatórios Automáticos</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Configure envio automático de relatórios
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                    Configurar
                  </button>
                </div>

                <div className="p-6 border rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Permissões</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Gerencie permissões de acesso ao sistema
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                    Gerenciar
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de Criação/Edição */}
        <VisitModal
          visit={selectedVisit}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedVisit(null);
          }}
          onSuccess={handleModalSuccess}
        />
      </div>
    </StandardLayout>
  );
};

export default GestaoVisitasSupervisor;
