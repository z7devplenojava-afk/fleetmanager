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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-seguranca-graphite border border-gray-600 text-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-semibold text-seguranca-yellow">
            {isEditing ? 'Editar Benefício' : 'Novo Benefício'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-white hover:bg-seguranca-black"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações Básicas */}
            <Card className="bg-seguranca-black/40 border border-gray-600 text-white">
              <CardHeader>
                <CardTitle className="text-lg text-seguranca-lightgray">Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-seguranca-lightgray">Nome do Benefício *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Vale Transporte"
                    className="border-gray-600 bg-seguranca-black text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-seguranca-lightgray">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descrição detalhada do benefício"
                    className="border-gray-600 bg-seguranca-black text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-seguranca-lightgray">Tipo de Benefício *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger className="border-gray-600 bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      <SelectItem value="TRANSPORT" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Transporte</SelectItem>
                      <SelectItem value="MEAL" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Refeição</SelectItem>
                      <SelectItem value="HEALTH" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Saúde</SelectItem>
                      <SelectItem value="DENTAL" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Odontológico</SelectItem>
                      <SelectItem value="LIFE_INSURANCE" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Seguro de Vida</SelectItem>
                      <SelectItem value="OTHER" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Valor e Configurações */}
            <Card className="bg-seguranca-black/40 border border-gray-600 text-white">
              <CardHeader>
                <CardTitle className="text-lg text-seguranca-lightgray">Valor e Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="value" className="text-red-400">Valor *</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.value}
                    onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="border-red-500 bg-seguranca-black text-red-300 placeholder:text-red-400/60 focus:border-red-400 focus:ring-red-400 font-medium"
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive" className="text-seguranca-lightgray">Benefício Ativo</Label>
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
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-gray-600 text-white hover:bg-seguranca-black"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-seguranca-red hover:bg-seguranca-darkred"
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