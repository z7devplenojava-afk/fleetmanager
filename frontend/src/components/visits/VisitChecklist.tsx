import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  User, 
  Building2,
  Camera,
  FileText,
  Save,
  Send,
  Loader2
} from 'lucide-react';
import { Visit, VisitStatus } from '@/types/visit';
import { visitService } from '@/services/visitService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VisitChecklistProps {
  visit: Visit;
  onComplete?: (visit: Visit) => void;
  onSave?: (visit: Visit) => void;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'security' | 'equipment' | 'staff' | 'procedures';
  required: boolean;
  checked: boolean;
  notes?: string;
  photos?: string[];
}

const VisitChecklist: React.FC<VisitChecklistProps> = ({
  visit,
  onComplete,
  onSave
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [observations, setObservations] = useState(visit.observations || '');
  const [arrivalTime, setArrivalTime] = useState(
    visit.arrivalTime ? new Date(visit.arrivalTime).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : ''
  );
  const [departureTime, setDepartureTime] = useState(
    visit.departureTime ? new Date(visit.departureTime).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : ''
  );

  useEffect(() => {
    initializeChecklist();
  }, [visit]);

  const initializeChecklist = () => {
    const items: ChecklistItem[] = [
      // Verificações de Segurança
      {
        id: 'security-1',
        title: 'Verificação de Câmeras',
        description: 'Todas as câmeras estão funcionando corretamente',
        category: 'security',
        required: true,
        checked: visit.securityCheck || false
      },
      {
        id: 'security-2',
        title: 'Sistema de Alarme',
        description: 'Sistema de alarme está ativo e funcionando',
        category: 'security',
        required: true,
        checked: false
      },
      {
        id: 'security-3',
        title: 'Controle de Acesso',
        description: 'Sistemas de controle de acesso estão operacionais',
        category: 'security',
        required: true,
        checked: false
      },
      {
        id: 'security-4',
        title: 'Iluminação Externa',
        description: 'Iluminação externa está adequada',
        category: 'security',
        required: false,
        checked: false
      },

      // Verificações de Equipamentos
      {
        id: 'equipment-1',
        title: 'Equipamentos de Proteção',
        description: 'EPIs estão disponíveis e em bom estado',
        category: 'equipment',
        required: true,
        checked: visit.equipmentCheck || false
      },
      {
        id: 'equipment-2',
        title: 'Equipamentos de Comunicação',
        description: 'Rádios e sistemas de comunicação funcionando',
        category: 'equipment',
        required: true,
        checked: false
      },
      {
        id: 'equipment-3',
        title: 'Veículos de Emergência',
        description: 'Veículos estão em condições de uso',
        category: 'equipment',
        required: false,
        checked: false
      },
      {
        id: 'equipment-4',
        title: 'Equipamentos de Primeiros Socorros',
        description: 'Kit de primeiros socorros completo e atualizado',
        category: 'equipment',
        required: true,
        checked: false
      },

      // Verificações de Pessoal
      {
        id: 'staff-1',
        title: 'Presença de Vigilantes',
        description: 'Número adequado de vigilantes presentes',
        category: 'staff',
        required: true,
        checked: visit.staffCheck || false
      },
      {
        id: 'staff-2',
        title: 'Uniformização',
        description: 'Vigilantes estão devidamente uniformizados',
        category: 'staff',
        required: true,
        checked: false
      },
      {
        id: 'staff-3',
        title: 'Documentação Pessoal',
        description: 'Documentação dos vigilantes está em dia',
        category: 'staff',
        required: true,
        checked: false
      },
      {
        id: 'staff-4',
        title: 'Treinamento',
        description: 'Vigilantes estão treinados e capacitados',
        category: 'staff',
        required: false,
        checked: false
      },

      // Verificações de Procedimentos
      {
        id: 'procedures-1',
        title: 'Procedimentos de Segurança',
        description: 'Procedimentos estão sendo seguidos corretamente',
        category: 'procedures',
        required: true,
        checked: visit.procedureCheck || false
      },
      {
        id: 'procedures-2',
        title: 'Relatórios de Ocorrência',
        description: 'Relatórios estão sendo preenchidos adequadamente',
        category: 'procedures',
        required: true,
        checked: false
      },
      {
        id: 'procedures-3',
        title: 'Comunicação com Cliente',
        description: 'Comunicação com o cliente está adequada',
        category: 'procedures',
        required: false,
        checked: false
      },
      {
        id: 'procedures-4',
        title: 'Plano de Emergência',
        description: 'Plano de emergência está atualizado e conhecido',
        category: 'procedures',
        required: true,
        checked: false
      }
    ];

    setChecklistItems(items);
  };

  const handleItemCheck = (itemId: string, checked: boolean) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, checked } : item
      )
    );
  };

  const handleItemNotes = (itemId: string, notes: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, notes } : item
      )
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'equipment':
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case 'staff':
        return <User className="h-4 w-4 text-green-600" />;
      case 'procedures':
        return <FileText className="h-4 w-4 text-purple-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'security':
        return 'Segurança';
      case 'equipment':
        return 'Equipamentos';
      case 'staff':
        return 'Pessoal';
      case 'procedures':
        return 'Procedimentos';
      default:
        return 'Outros';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security':
        return 'bg-red-50 border-red-200';
      case 'equipment':
        return 'bg-blue-50 border-blue-200';
      case 'staff':
        return 'bg-green-50 border-green-200';
      case 'procedures':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getCompletionStats = () => {
    const total = checklistItems.length;
    const completed = checklistItems.filter(item => item.checked).length;
    const required = checklistItems.filter(item => item.required).length;
    const requiredCompleted = checklistItems.filter(item => item.required && item.checked).length;
    
    return {
      total,
      completed,
      required,
      requiredCompleted,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      requiredCompletionRate: required > 0 ? (requiredCompleted / required) * 100 : 0
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updateData = {
        observations,
        arrivalTime: arrivalTime ? `${visit.visitDate}T${arrivalTime}:00` : undefined,
        departureTime: departureTime ? `${visit.visitDate}T${departureTime}:00` : undefined,
        securityCheck: checklistItems.filter(item => item.category === 'security' && item.checked).length > 0,
        equipmentCheck: checklistItems.filter(item => item.category === 'equipment' && item.checked).length > 0,
        staffCheck: checklistItems.filter(item => item.category === 'staff' && item.checked).length > 0,
        procedureCheck: checklistItems.filter(item => item.category === 'procedures' && item.checked).length > 0
      };

      await visitService.updateVisit(visit.id!, updateData);
      
      toast({
        title: "Sucesso!",
        description: "Checklist salvo com sucesso",
      });
      
      onSave?.(visit);
    } catch (error) {
      console.error('Erro ao salvar checklist:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar checklist",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    const stats = getCompletionStats();
    
    if (stats.requiredCompletionRate < 100) {
      toast({
        title: "Atenção",
        description: "Complete todos os itens obrigatórios antes de finalizar a visita",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      await visitService.markVisitAsCompleted(visit.id!);
      
      toast({
        title: "Sucesso!",
        description: "Visita marcada como realizada",
      });
      
      onComplete?.(visit);
    } catch (error) {
      console.error('Erro ao finalizar visita:', error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar visita",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = getCompletionStats();
  const canComplete = stats.requiredCompletionRate === 100;

  return (
    <div className="space-y-6">
      {/* Header com informações da visita */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Checklist de Visita - {visit.unitName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>Data: {new Date(visit.visitDate).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{visit.unitAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span>Supervisor: {visit.supervisorName}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas de progresso */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Itens Concluídos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.requiredCompleted}</div>
              <div className="text-sm text-gray-600">Obrigatórios</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.completionRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Progresso Geral</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.requiredCompletionRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Obrigatórios</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horários */}
      <Card>
        <CardHeader>
          <CardTitle>Horários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="arrivalTime">Horário de Chegada</Label>
              <Input
                id="arrivalTime"
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departureTime">Horário de Saída</Label>
              <Input
                id="departureTime"
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist por categoria */}
      {['security', 'equipment', 'staff', 'procedures'].map(category => {
        const categoryItems = checklistItems.filter(item => item.category === category);
        const categoryStats = {
          total: categoryItems.length,
          completed: categoryItems.filter(item => item.checked).length,
          required: categoryItems.filter(item => item.required).length,
          requiredCompleted: categoryItems.filter(item => item.required && item.checked).length
        };

        return (
          <Card key={category} className={cn('border-l-4', getCategoryColor(category))}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getCategoryIcon(category)}
                {getCategoryTitle(category)}
                <Badge variant="outline" className="ml-auto">
                  {categoryStats.completed}/{categoryStats.total}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Checkbox
                    id={item.id}
                    checked={item.checked}
                    onCheckedChange={(checked) => handleItemCheck(item.id, checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={item.id} className="font-medium">
                        {item.title}
                      </Label>
                      {item.required && (
                        <Badge variant="destructive" className="text-xs">
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <Textarea
                      placeholder="Adicione observações sobre este item..."
                      value={item.notes || ''}
                      onChange={(e) => handleItemNotes(item.id, e.target.value)}
                      className="text-sm"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Observações gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Observações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Adicione observações gerais sobre a visita..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Botões de ação */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Progresso
            </>
          )}
        </Button>

        <Button
          onClick={handleComplete}
          disabled={!canComplete || loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Finalizando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar Visita
            </>
          )}
        </Button>
      </div>

      {!canComplete && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Complete todos os itens obrigatórios para finalizar a visita
          </span>
        </div>
      )}
    </div>
  );
};

export default VisitChecklist;
