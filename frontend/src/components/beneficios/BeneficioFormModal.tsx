import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { benefitService } from '@/services/benefitService';
import { Benefit } from '@/services/benefitService';

interface BeneficioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  benefit?: Benefit | null;
  onSuccess: () => void;
}

const BeneficioFormModal: React.FC<BeneficioFormModalProps> = ({
  isOpen,
  onClose,
  benefit,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'TRANSPORT' as Benefit['type'],
    value: 0,
    isActive: true
  });
  const { toast } = useToast();

  const isEditing = !!benefit;

  useEffect(() => {
    if (benefit) {
      setFormData({
        name: benefit.name,
        description: benefit.description || '',
        type: benefit.type,
        value: benefit.value || 0,
        isActive: benefit.isActive
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'TRANSPORT',
        value: 0,
        isActive: true
      });
    }
  }, [benefit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do benefício é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (formData.value < 0) {
      toast({
        title: "Erro",
        description: "Valor deve ser maior ou igual a zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      if (isEditing && benefit) {
        await benefitService.updateBenefit(benefit.id.toString(), formData);
        toast({
          title: "Sucesso",
          description: "Benefício atualizado com sucesso.",
        });
      } else {
        await benefitService.createBenefit(formData);
        toast({
          title: "Sucesso",
          description: "Benefício criado com sucesso.",
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar benefício:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o benefício.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Benefício' : 'Novo Benefício'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Benefício *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Vale Transporte"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descrição detalhada do benefício"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Benefício *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRANSPORT">Transporte</SelectItem>
                      <SelectItem value="MEAL">Refeição</SelectItem>
                      <SelectItem value="HEALTH">Saúde</SelectItem>
                      <SelectItem value="DENTAL">Odontológico</SelectItem>
                      <SelectItem value="LIFE_INSURANCE">Seguro de Vida</SelectItem>
                      <SelectItem value="OTHER">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Valor e Configurações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Valor e Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valor *</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.value}
                    onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Benefício Ativo</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>



          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditing ? 'Atualizar' : 'Criar'} Benefício
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BeneficioFormModal; 