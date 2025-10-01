import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Download,
  Upload,
  FileText,
  Award,
  Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface CIPAMember {
  id: string;
  employeeId: string;
  employeeName: string;
  position: 'PRESIDENTE' | 'VICE_PRESIDENTE' | 'SECRETARIO' | 'MEMBRO';
  department: string;
  startDate: string;
  endDate: string;
  status: 'ATIVO' | 'INATIVO';
  createdAt: string;
  updatedAt: string;
}

interface CIPAReunion {
  id: string;
  title: string;
  date: string;
  attendees: string[];
  agenda: string[];
  decisions: string[];
  nextReunionDate?: string;
  status: 'AGENDADA' | 'REALIZADA' | 'CANCELADA';
  createdAt: string;
  updatedAt: string;
}

const CIPA: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados
  const [members, setMembers] = useState<CIPAMember[]>([]);
  const [reunions, setReunions] = useState<CIPAReunion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'reunions'>('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  
  // Estados para modal de membro
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<CIPAMember | null>(null);
  const [memberForm, setMemberForm] = useState({
    employeeId: '',
    position: '',
    department: '',
    startDate: '',
    endDate: ''
  });

  // Estados para modal de reunião
  const [showReunionModal, setShowReunionModal] = useState(false);
  const [editingReunion, setEditingReunion] = useState<CIPAReunion | null>(null);
  const [reunionForm, setReunionForm] = useState({
    title: '',
    date: '',
    agenda: '',
    nextReunionDate: ''
  });

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Implementar chamadas para API
      // const [membersData, reunionsData] = await Promise.all([
      //   sstService.getCIPAMembers(),
      //   sstService.getCIPAReunions()
      // ]);
      
      // Mock data para demonstração
      setMembers([
        {
          id: '1',
          employeeId: 'emp1',
          employeeName: 'João Silva',
          position: 'PRESIDENTE',
          department: 'Administrativo',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          status: 'ATIVO',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          employeeId: 'emp2',
          employeeName: 'Maria Santos',
          position: 'VICE_PRESIDENTE',
          department: 'Operacional',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          status: 'ATIVO',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ]);

      setReunions([
        {
          id: '1',
          title: 'Reunião Mensal - Janeiro 2024',
          date: '2024-01-15',
          attendees: ['João Silva', 'Maria Santos'],
          agenda: ['Análise de acidentes', 'Plano de ação'],
          decisions: ['Implementar treinamento de segurança'],
          nextReunionDate: '2024-02-15',
          status: 'REALIZADA',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        }
      ]);

      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados da CIPA:', err);
      setError('Erro ao carregar dados da CIPA');
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da CIPA",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMember = async () => {
    try {
      if (editingMember) {
        // TODO: Implementar atualização
        toast({
          title: "Sucesso",
          description: "Membro da CIPA atualizado com sucesso!",
          variant: "default"
        });
      } else {
        // TODO: Implementar criação
        toast({
          title: "Sucesso",
          description: "Membro da CIPA adicionado com sucesso!",
          variant: "default"
        });
      }
      
      setShowMemberModal(false);
      setEditingMember(null);
      setMemberForm({
        employeeId: '',
        position: '',
        department: '',
        startDate: '',
        endDate: ''
      });
      await loadData();
    } catch (err) {
      console.error('Erro ao salvar membro da CIPA:', err);
      toast({
        title: "Erro",
        description: "Erro ao salvar membro da CIPA",
        variant: "destructive"
      });
    }
  };

  const handleSaveReunion = async () => {
    try {
      if (editingReunion) {
        // TODO: Implementar atualização
        toast({
          title: "Sucesso",
          description: "Reunião da CIPA atualizada com sucesso!",
          variant: "default"
        });
      } else {
        // TODO: Implementar criação
        toast({
          title: "Sucesso",
          description: "Reunião da CIPA agendada com sucesso!",
          variant: "default"
        });
      }
      
      setShowReunionModal(false);
      setEditingReunion(null);
      setReunionForm({
        title: '',
        date: '',
        agenda: '',
        nextReunionDate: ''
      });
      await loadData();
    } catch (err) {
      console.error('Erro ao salvar reunião da CIPA:', err);
      toast({
        title: "Erro",
        description: "Erro ao salvar reunião da CIPA",
        variant: "destructive"
      });
    }
  };

  const handleEditMember = (member: CIPAMember) => {
    setEditingMember(member);
    setMemberForm({
      employeeId: member.employeeId,
      position: member.position,
      department: member.department,
      startDate: member.startDate,
      endDate: member.endDate
    });
    setShowMemberModal(true);
  };

  const handleEditReunion = (reunion: CIPAReunion) => {
    setEditingReunion(reunion);
    setReunionForm({
      title: reunion.title,
      date: reunion.date,
      agenda: reunion.agenda.join('\n'),
      nextReunionDate: reunion.nextReunionDate || ''
    });
    setShowReunionModal(true);
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este membro da CIPA?')) return;
    
    try {
      // TODO: Implementar exclusão
      toast({
        title: "Sucesso",
        description: "Membro da CIPA removido com sucesso!",
        variant: "default"
      });
      await loadData();
    } catch (err) {
      console.error('Erro ao remover membro da CIPA:', err);
      toast({
        title: "Erro",
        description: "Erro ao remover membro da CIPA",
        variant: "destructive"
      });
    }
  };

  const handleDeleteReunion = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta reunião?')) return;
    
    try {
      // TODO: Implementar exclusão
      toast({
        title: "Sucesso",
        description: "Reunião excluída com sucesso!",
        variant: "default"
      });
      await loadData();
    } catch (err) {
      console.error('Erro ao excluir reunião:', err);
      toast({
        title: "Erro",
        description: "Erro ao excluir reunião",
        variant: "destructive"
      });
    }
  };

  // Filtros
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === 'all' || member.position === positionFilter;
    return matchesSearch && matchesPosition;
  });

  const filteredReunions = reunions.filter(reunion =>
    reunion.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPositionLabel = (position: string) => {
    const labels = {
      'PRESIDENTE': 'Presidente',
      'VICE_PRESIDENTE': 'Vice-Presidente',
      'SECRETARIO': 'Secretário',
      'MEMBRO': 'Membro'
    };
    return labels[position as keyof typeof labels] || position;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ATIVO': 'default',
      'INATIVO': 'secondary',
      'AGENDADA': 'default',
      'REALIZADA': 'default',
      'CANCELADA': 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-seguranca-red mx-auto mb-4"></div>
            <p className="text-seguranca-lightgray">Carregando dados da CIPA...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
              <Users className="text-seguranca-red" size={24} />
              CIPA - Comissão Interna de Prevenção de Acidentes
            </h1>
            <p className="text-gray-400 mt-1">
              Gestão da Comissão Interna de Prevenção de Acidentes
            </p>
          </div>
          <Button
            onClick={() => navigate('/rh/sst')}
            variant="outline"
            className="border-gray-600 text-seguranca-lightgray hover:bg-gray-800"
          >
            ← Voltar para SST
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-seguranca-graphite p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'members'
                ? 'bg-seguranca-red text-white'
                : 'text-seguranca-lightgray hover:bg-gray-700'
            }`}
          >
            <Users className="inline mr-2" size={16} />
            Membros ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('reunions')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reunions'
                ? 'bg-seguranca-red text-white'
                : 'text-seguranca-lightgray hover:bg-gray-700'
            }`}
          >
            <Calendar className="inline mr-2" size={16} />
            Reuniões ({reunions.length})
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>
          {activeTab === 'members' && (
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Filtrar por cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os cargos</SelectItem>
                <SelectItem value="PRESIDENTE">Presidente</SelectItem>
                <SelectItem value="VICE_PRESIDENTE">Vice-Presidente</SelectItem>
                <SelectItem value="SECRETARIO">Secretário</SelectItem>
                <SelectItem value="MEMBRO">Membro</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button
            onClick={() => {
              if (activeTab === 'members') {
                setShowMemberModal(true);
                setEditingMember(null);
                setMemberForm({
                  employeeId: '',
                  position: '',
                  department: '',
                  startDate: '',
                  endDate: ''
                });
              } else {
                setShowReunionModal(true);
                setEditingReunion(null);
                setReunionForm({
                  title: '',
                  date: '',
                  agenda: '',
                  nextReunionDate: ''
                });
              }
            }}
            className="bg-seguranca-red hover:bg-red-700 text-white"
          >
            <Plus className="mr-2" size={16} />
            {activeTab === 'members' ? 'Adicionar Membro' : 'Agendar Reunião'}
          </Button>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'members' && (
          <div className="grid gap-4">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="bg-seguranca-graphite border-gray-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-seguranca-red rounded-full flex items-center justify-center">
                        <User className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-seguranca-lightgray">
                          {member.employeeName}
                        </h3>
                        <p className="text-gray-400">
                          {getPositionLabel(member.position)} • {member.department}
                        </p>
                        <p className="text-sm text-gray-500">
                          Mandato: {new Date(member.startDate).toLocaleDateString('pt-BR')} - {new Date(member.endDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(member.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditMember(member)}
                        className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteMember(member.id)}
                        className="border-red-600 text-red-400 hover:bg-red-900"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredMembers.length === 0 && (
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardContent className="p-8 text-center">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-seguranca-lightgray mb-2">
                    Nenhum membro encontrado
                  </h3>
                  <p className="text-gray-400">
                    {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Adicione membros à CIPA para começar.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'reunions' && (
          <div className="grid gap-4">
            {filteredReunions.map((reunion) => (
              <Card key={reunion.id} className="bg-seguranca-graphite border-gray-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-seguranca-red rounded-full flex items-center justify-center">
                        <Calendar className="text-white" size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-seguranca-lightgray">
                          {reunion.title}
                        </h3>
                        <p className="text-gray-400">
                          Data: {new Date(reunion.date).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm text-gray-500">
                          Participantes: {reunion.attendees.length} membros
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(reunion.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditReunion(reunion)}
                        className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteReunion(reunion.id)}
                        className="border-red-600 text-red-400 hover:bg-red-900"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredReunions.length === 0 && (
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardContent className="p-8 text-center">
                  <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-seguranca-lightgray mb-2">
                    Nenhuma reunião encontrada
                  </h3>
                  <p className="text-gray-400">
                    {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Agende reuniões da CIPA para começar.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Modais */}
        {showMemberModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold text-seguranca-lightgray mb-4">
                {editingMember ? 'Editar Membro da CIPA' : 'Adicionar Membro da CIPA'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-seguranca-lightgray">Funcionário</Label>
                  <Input
                    value={memberForm.employeeId}
                    onChange={(e) => setMemberForm({...memberForm, employeeId: e.target.value})}
                    placeholder="ID do funcionário"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
                
                <div>
                  <Label className="text-seguranca-lightgray">Cargo na CIPA</Label>
                  <Select value={memberForm.position} onValueChange={(value) => setMemberForm({...memberForm, position: value})}>
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRESIDENTE">Presidente</SelectItem>
                      <SelectItem value="VICE_PRESIDENTE">Vice-Presidente</SelectItem>
                      <SelectItem value="SECRETARIO">Secretário</SelectItem>
                      <SelectItem value="MEMBRO">Membro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-seguranca-lightgray">Departamento</Label>
                  <Input
                    value={memberForm.department}
                    onChange={(e) => setMemberForm({...memberForm, department: e.target.value})}
                    placeholder="Departamento"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-seguranca-lightgray">Data de Início</Label>
                    <Input
                      type="date"
                      value={memberForm.startDate}
                      onChange={(e) => setMemberForm({...memberForm, startDate: e.target.value})}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    />
                  </div>
                  <div>
                    <Label className="text-seguranca-lightgray">Data de Fim</Label>
                    <Input
                      type="date"
                      value={memberForm.endDate}
                      onChange={(e) => setMemberForm({...memberForm, endDate: e.target.value})}
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowMemberModal(false)}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveMember}
                  className="bg-seguranca-red hover:bg-red-700 text-white"
                >
                  {editingMember ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {showReunionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold text-seguranca-lightgray mb-4">
                {editingReunion ? 'Editar Reunião da CIPA' : 'Agendar Reunião da CIPA'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-seguranca-lightgray">Título da Reunião</Label>
                  <Input
                    value={reunionForm.title}
                    onChange={(e) => setReunionForm({...reunionForm, title: e.target.value})}
                    placeholder="Ex: Reunião Mensal - Janeiro 2024"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
                
                <div>
                  <Label className="text-seguranca-lightgray">Data da Reunião</Label>
                  <Input
                    type="datetime-local"
                    value={reunionForm.date}
                    onChange={(e) => setReunionForm({...reunionForm, date: e.target.value})}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
                
                <div>
                  <Label className="text-seguranca-lightgray">Pauta</Label>
                  <Textarea
                    value={reunionForm.agenda}
                    onChange={(e) => setReunionForm({...reunionForm, agenda: e.target.value})}
                    placeholder="Liste os itens da pauta (um por linha)"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label className="text-seguranca-lightgray">Próxima Reunião (opcional)</Label>
                  <Input
                    type="datetime-local"
                    value={reunionForm.nextReunionDate}
                    onChange={(e) => setReunionForm({...reunionForm, nextReunionDate: e.target.value})}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowReunionModal(false)}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveReunion}
                  className="bg-seguranca-red hover:bg-red-700 text-white"
                >
                  {editingReunion ? 'Atualizar' : 'Agendar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StandardLayout>
  );
};

export default CIPA;
