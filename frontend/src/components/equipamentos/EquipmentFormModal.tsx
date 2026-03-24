import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Equipment, 
  CreateEquipmentRequest, 
  EquipmentStatus, 
  ProtectionLevel, 
  EquipmentUsage, 
  EquipmentSize,
  EQUIPMENT_STATUS_LABELS,
  PROTECTION_LEVEL_LABELS,
  EQUIPMENT_USAGE_LABELS,
  EQUIPMENT_SIZE_LABELS
} from '@/types/equipment';
import equipmentService from '@/services/equipmentService';
import { workPostService, WorkPost } from '@/services/workPostService';

interface EquipmentFormModalProps {
  equipment?: Equipment;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  equipment,
  isOpen,
  onClose,
  onSuccess,
  trigger
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [loadingWorkPosts, setLoadingWorkPosts] = useState(false);
  const [formData, setFormData] = useState<CreateEquipmentRequest>({
    status: EquipmentStatus.EM_ESTOQUE,
    manufacturingDate: '',
    serialNumber: '',
    isDangerous: false
  });

  useEffect(() => {
    if (isOpen) {
      loadWorkPosts();
    }
  }, [isOpen]);

  // Também carregar na montagem do componente
  useEffect(() => {
    loadWorkPosts();
  }, []);

  const loadWorkPosts = async () => {
    setLoadingWorkPosts(true);
    try {
      console.log('Carregando postos de trabalho do banco de dados...');
      const posts = await workPostService.getAllWorkPosts();
      setWorkPosts(posts);
      console.log('Postos carregados do banco:', posts.length, posts);
    } catch (error) {
      console.error('Erro ao carregar postos de trabalho:', error);
      toast({
        title: "Erro ao carregar postos",
        description: "Não foi possível carregar os postos de trabalho. Tente novamente.",
        variant: "destructive",
      });
      setWorkPosts([]);
    } finally {
      setLoadingWorkPosts(false);
    }
  };

  useEffect(() => {
    if (equipment) {
      setFormData({
        status: equipment.status,
        ballisticPlate: equipment.ballisticPlate || '',
        manufacturingDate: equipment.manufacturingDate,
        weaponRegistrationValidity: equipment.weaponRegistrationValidity || '',
        usageType: equipment.usageType,
        serialNumber: equipment.serialNumber,
        caNumber: equipment.caNumber || '',
        protectionLevel: equipment.protectionLevel,
        batch: equipment.batch || '',
        model: equipment.model || '',
        size: equipment.size,
        validityDate: equipment.validityDate || '',
        isDangerous: equipment.isDangerous,
        notes: equipment.notes || '',
        currentUserId: equipment.currentUserId || '',
        lastMaintenanceDate: equipment.lastMaintenanceDate || '',
        nextMaintenanceDate: equipment.nextMaintenanceDate || '',
        sourceWorkPostId: equipment.sourceWorkPostId || '',
        destinationWorkPostId: equipment.destinationWorkPostId || ''
      });
    } else {
      // Reset para novo equipamento
      setFormData({
        status: EquipmentStatus.EM_ESTOQUE,
        manufacturingDate: '',
        serialNumber: '',
        isDangerous: false,
        sourceWorkPostId: '',
        destinationWorkPostId: ''
      });
    }
  }, [equipment]);

  const handleInputChange = (field: keyof CreateEquipmentRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.serialNumber.trim()) {
      toast({
        title: "Erro de validação",
        description: "Número de série é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.manufacturingDate) {
      toast({
        title: "Erro de validação",
        description: "Data de fabricação é obrigatória",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Preparar payload apenas com campos aceitos pelo backend
      const payload: any = {
        serialNumber: formData.serialNumber,
        status: formData.status,
        model: formData.model || undefined,
        batch: formData.batch || undefined,
        caNumber: formData.caNumber || undefined,
        protectionLevel: formData.protectionLevel || undefined,
        size: formData.size || undefined,
        usageType: formData.usageType || undefined,
        ballisticPlate: formData.ballisticPlate || undefined,
        manufacturingDate: formData.manufacturingDate || undefined,
        validityDate: formData.validityDate || undefined,
        weaponRegistrationValidity: formData.weaponRegistrationValidity || undefined,
        lastMaintenanceDate: formData.lastMaintenanceDate && formData.lastMaintenanceDate.trim() !== '' ? formData.lastMaintenanceDate : undefined,
        nextMaintenanceDate: formData.nextMaintenanceDate && formData.nextMaintenanceDate.trim() !== '' ? formData.nextMaintenanceDate : undefined,
        isDangerous: formData.isDangerous ?? false,
        currentUserId: formData.currentUserId && formData.currentUserId.trim() !== '' ? formData.currentUserId : undefined,
        notes: formData.notes || undefined,
      };

      // Remover campos undefined, null ou string vazia para não enviar no JSON
      Object.keys(payload).forEach(key => {
        const value = payload[key];
        if (value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '')) {
          delete payload[key];
        }
      });

      console.log('📤 Enviando payload para backend:', payload);
      
      if (equipment) {
        await equipmentService.update(equipment.id, payload);
        toast({
          title: "Sucesso",
          description: "Equipamento atualizado com sucesso",
        });
      } else {
        await equipmentService.create(payload);
        toast({
          title: "Sucesso",
          description: "Equipamento criado com sucesso",
        });
      }
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar equipamento:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao salvar equipamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="serialNumber">Número de Série *</Label>
          <Input
            id="serialNumber"
            value={formData.serialNumber}
            onChange={(e) => handleInputChange('serialNumber', e.target.value)}
            placeholder="Ex: EQ-001-2025"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="status">Situação *</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as EquipmentStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EQUIPMENT_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="model">Modelo</Label>
          <Input
            id="model"
            value={formData.model || ''}
            onChange={(e) => handleInputChange('model', e.target.value)}
            placeholder="Ex: Colete Balístico X"
          />
        </div>
        
        <div>
          <Label htmlFor="ballisticPlate">Placa Balística</Label>
          <Input
            id="ballisticPlate"
            value={formData.ballisticPlate || ''}
            onChange={(e) => handleInputChange('ballisticPlate', e.target.value)}
            placeholder="Ex: BP-001"
          />
        </div>
        
        <div>
          <Label htmlFor="protectionLevel">Nível de Proteção</Label>
          <Select value={formData.protectionLevel || ''} onValueChange={(value) => handleInputChange('protectionLevel', value as ProtectionLevel)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o nível" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROTECTION_LEVEL_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="size">Tamanho</Label>
          <Select value={formData.size || ''} onValueChange={(value) => handleInputChange('size', value as EquipmentSize)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tamanho" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EQUIPMENT_SIZE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="usageType">Tipo de Uso</Label>
          <Select value={formData.usageType || ''} onValueChange={(value) => handleInputChange('usageType', value as EquipmentUsage)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de uso" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EQUIPMENT_USAGE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="caNumber">Número do CA</Label>
          <Input
            id="caNumber"
            value={formData.caNumber || ''}
            onChange={(e) => handleInputChange('caNumber', e.target.value)}
            placeholder="Ex: CA-12345"
          />
        </div>
        
        <div>
          <Label htmlFor="batch">Lote</Label>
          <Input
            id="batch"
            value={formData.batch || ''}
            onChange={(e) => handleInputChange('batch', e.target.value)}
            placeholder="Ex: LOTE-2025-01"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isDangerous"
          checked={formData.isDangerous}
          onCheckedChange={(checked) => handleInputChange('isDangerous', checked)}
        />
        <Label htmlFor="isDangerous">Equipamento perigoso (requer controle especial)</Label>
      </div>
    </div>
  );

  const renderDates = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="manufacturingDate">Data de Fabricação *</Label>
          <Input
            id="manufacturingDate"
            type="date"
            value={formData.manufacturingDate}
            onChange={(e) => handleInputChange('manufacturingDate', e.target.value)}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="validityDate">Validade do Equipamento</Label>
          <Input
            id="validityDate"
            type="date"
            value={formData.validityDate || ''}
            onChange={(e) => handleInputChange('validityDate', e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Se não informado, será calculado como 5 anos após a fabricação
          </p>
        </div>
        
        <div>
          <Label htmlFor="weaponRegistrationValidity">Validade do Registro da Arma</Label>
          <Input
            id="weaponRegistrationValidity"
            type="date"
            value={formData.weaponRegistrationValidity || ''}
            onChange={(e) => handleInputChange('weaponRegistrationValidity', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="lastMaintenanceDate">Última Manutenção</Label>
          <Input
            id="lastMaintenanceDate"
            type="date"
            value={formData.lastMaintenanceDate || ''}
            onChange={(e) => handleInputChange('lastMaintenanceDate', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="nextMaintenanceDate">Próxima Manutenção</Label>
          <Input
            id="nextMaintenanceDate"
            type="date"
            value={formData.nextMaintenanceDate || ''}
            onChange={(e) => handleInputChange('nextMaintenanceDate', e.target.value)}
          />
        </div>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          O sistema calculará automaticamente alertas para vencimentos 30 e 60 dias antes das datas de validade.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderNotes = () => (
    <div>
      <Label htmlFor="notes">Observações</Label>
      <Textarea
        id="notes"
        value={formData.notes || ''}
        onChange={(e) => handleInputChange('notes', e.target.value)}
        placeholder="Informações adicionais sobre o equipamento..."
        rows={5}
      />
    </div>
  );

  const renderLocation = () => {
    console.log('Renderizando localização, postos disponíveis:', workPosts.length);
    console.log('LoadingWorkPosts:', loadingWorkPosts);
    console.log('FormData sourceWorkPostId:', formData.sourceWorkPostId);
    console.log('FormData destinationWorkPostId:', formData.destinationWorkPostId);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sourceWorkPostId">Posto de Trabalho de Origem</Label>
            <Select 
              value={formData.sourceWorkPostId || ''} 
              onValueChange={(value) => {
                console.log('Selecionando posto de origem:', value);
                handleInputChange('sourceWorkPostId', value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingWorkPosts ? "Carregando..." : "Selecione o posto de origem"} />
              </SelectTrigger>
              <SelectContent>
                {workPosts.length === 0 ? (
                  <SelectItem value="loading" disabled>
                    {loadingWorkPosts ? "Carregando..." : "Nenhum posto encontrado"}
                  </SelectItem>
                ) : (
                  workPosts.map((post) => (
                    <SelectItem key={post.id} value={post.id}>
                      {post.postCode ? `${post.postCode} - ${post.name}` : post.name}
                      {post.address ? ` (${post.address})` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Posto onde o equipamento está atualmente
            </p>
          </div>
          
          <div>
            <Label htmlFor="destinationWorkPostId">Posto de Trabalho de Destino</Label>
            <Select 
              value={formData.destinationWorkPostId || 'none'} 
              onValueChange={(value) => {
                console.log('Selecionando posto de destino:', value);
                // Converter "none" para string vazia para o backend
                handleInputChange('destinationWorkPostId', value === 'none' ? '' : value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingWorkPosts ? "Carregando..." : "Selecione o posto de destino"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum (opcional)</SelectItem>
                {workPosts.length === 0 ? (
                  <SelectItem value="loading" disabled>
                    {loadingWorkPosts ? "Carregando..." : "Nenhum posto encontrado"}
                  </SelectItem>
                ) : (
                  workPosts.map((post) => (
                    <SelectItem key={post.id} value={post.id}>
                      {post.postCode ? `${post.postCode} - ${post.name}` : post.name}
                      {post.address ? ` (${post.address})` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Posto para onde o equipamento será transferido (opcional)
            </p>
          </div>
        </div>
        
        {formData.sourceWorkPostId && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Posto de origem: {workPosts.find(p => p.id === formData.sourceWorkPostId)?.name || 'Posto selecionado'}
            </AlertDescription>
          </Alert>
        )}
        
        {formData.destinationWorkPostId && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Posto de destino: {workPosts.find(p => p.id === formData.destinationWorkPostId)?.name || 'Posto selecionado'}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const content = (
    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {equipment ? 'Editar Equipamento' : 'Novo Equipamento'}
        </DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="dates">Datas e Validades</TabsTrigger>
            <TabsTrigger value="location">🏢 Localização</TabsTrigger>
            <TabsTrigger value="notes">Observações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="mt-6">
            {renderBasicInfo()}
          </TabsContent>
          
          <TabsContent value="dates" className="mt-6">
            {renderDates()}
          </TabsContent>
          
          <TabsContent value="location" className="mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Postos de Trabalho</h3>
              <p className="text-blue-600 text-sm">Configure a origem e destino do equipamento</p>
            </div>
            {renderLocation()}
          </TabsContent>
          
          <TabsContent value="notes" className="mt-6">
            {renderNotes()}
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {equipment ? 'Atualizar' : 'Criar'} Equipamento
          </Button>
        </div>
      </form>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {content}
    </Dialog>
  );
};

export default EquipmentFormModal; 