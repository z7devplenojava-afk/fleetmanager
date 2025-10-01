import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Car, 
  Save, 
  X,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { employeeService, Employee } from '@/services/employeeService';
import fleetService from '@/services/fleetService';

interface Veiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
}

interface Multa {
  id?: string;
  veiculo_id: string;
  placa?: string;
  marca?: string;
  modelo?: string;
  motorista_id?: string;
  motorista_nome?: string;
  motorista_cnh?: string;
  data_infracao: string;
  data_vencimento: string;
  valor: number;
  pontos: number;
  tipo_infracao: string;
  local_infracao: string;
  status: 'pendente' | 'paga' | 'vencida';
  observacoes?: string;
}

interface MultaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  multa?: Multa | null;
  veiculos: Veiculo[];
}

const MultaFormModal: React.FC<MultaFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  multa,
  veiculos,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Multa>({
    veiculo_id: '',
    data_infracao: '',
    data_vencimento: '',
    valor: 0,
    pontos: 0,
    tipo_infracao: '',
    local_infracao: '',
    status: 'pendente',
    observacoes: '',
  });
  const [motoristas, setMotoristas] = useState<Employee[]>([]);
  const [selectedMotorista, setSelectedMotorista] = useState<string>('');

  useEffect(() => {
    if (multa) {
      setFormData({
        id: multa.id,
        veiculo_id: multa.veiculo_id,
        placa: multa.placa,
        marca: multa.marca,
        modelo: multa.modelo,
        data_infracao: multa.data_infracao,
        data_vencimento: multa.data_vencimento,
        valor: multa.valor,
        pontos: multa.pontos,
        tipo_infracao: multa.tipo_infracao,
        local_infracao: multa.local_infracao,
        status: multa.status,
        observacoes: multa.observacoes || '',
      });
    } else {
      setFormData({
        veiculo_id: '',
        data_infracao: '',
        data_vencimento: '',
        valor: 0,
        pontos: 0,
        tipo_infracao: '',
        local_infracao: '',
        status: 'pendente',
        observacoes: '',
      });
    }
  }, [multa, isOpen]);

  useEffect(() => {
    if (isOpen) {
      employeeService.getActiveEmployees().then(setMotoristas);
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    // Validações
    if (!formData.veiculo_id) {
      toast({
        title: 'Erro!',
        description: 'Selecione um veículo.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.data_infracao) {
      toast({
        title: 'Erro!',
        description: 'Data da infração é obrigatória.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.data_vencimento) {
      toast({
        title: 'Erro!',
        description: 'Data de vencimento é obrigatória.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.tipo_infracao) {
      toast({
        title: 'Erro!',
        description: 'Tipo de infração é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.local_infracao) {
      toast({
        title: 'Erro!',
        description: 'Local da infração é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.valor <= 0) {
      toast({
        title: 'Erro!',
        description: 'Valor deve ser maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedMotorista) {
      toast({
        title: 'Erro!',
        description: 'Selecione o motorista responsável.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Preparar dados da multa para a API
      const multaPayload = {
        vehicleId: formData.veiculo_id,
        date: formData.data_infracao,
        dueDate: formData.data_vencimento,
        amount: formData.valor,
        description: formData.tipo_infracao,
        location: formData.local_infracao,
        status: formData.status === 'paga' ? 'PAID' : formData.status === 'pendente' ? 'PENDING' : 'CANCELLED',
        paymentDate: formData.status === 'paga' ? formData.data_vencimento : undefined,
      };

      if (multa) {
        // Atualizar multa existente
        await fleetService.updateFine(multa.id, multaPayload);
      } else {
        // Criar nova multa
        await fleetService.createFine(multaPayload);
      }

      toast({
        title: 'Sucesso!',
        description: multa ? 'Multa atualizada com sucesso.' : 'Multa criada com sucesso.',
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar multa:', error);
      toast({
        title: 'Erro!',
        description: error.response?.data?.message || 'Erro ao salvar multa.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      veiculo_id: '',
      data_infracao: '',
      data_vencimento: '',
      valor: 0,
      pontos: 0,
      tipo_infracao: '',
      local_infracao: '',
      status: 'pendente',
      observacoes: '',
    });
    onClose();
  };

  const tiposInfracao = [
    'Excesso de Velocidade',
    'Avanço de Sinal Vermelho',
    'Estacionamento Irregular',
    'Dirigir sem CNH',
    'Veículo sem Documentação',
    'Ultrapassagem Irregular',
    'Não Uso do Cinto de Segurança',
    'Uso de Celular ao Volante',
    'Dirigir Sob Influência',
    'Outros'
  ];

  const isFormValid = formData.veiculo_id && 
                     formData.data_infracao && 
                     formData.data_vencimento && 
                     formData.tipo_infracao && 
                     formData.local_infracao && 
                     formData.valor > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-seguranca-red" />
            {multa ? 'Editar Multa' : 'Nova Multa'}
          </DialogTitle>
          <DialogDescription className="text-seguranca-lightgray">
            {multa ? 'Edite as informações da multa.' : 'Preencha as informações da nova multa.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Veículo */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Car className="h-5 w-5" />
                Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="veiculo" className="text-seguranca-lightgray">
                    Veículo *
                  </Label>
                  <Select
                    value={formData.veiculo_id}
                    onValueChange={(value) => handleInputChange('veiculo_id', value)}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      {veiculos.map((veiculo) => (
                        <SelectItem key={veiculo.id} value={veiculo.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-gray-600">
                              {veiculo.placa}
                            </Badge>
                            <span>{veiculo.marca} {veiculo.modelo}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Motorista */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                Motorista
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="motorista" className="text-seguranca-lightgray">
                  Motorista Responsável *
                </Label>
                <Select
                  value={selectedMotorista}
                  onValueChange={setSelectedMotorista}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione o motorista" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    {motoristas.map((motorista) => (
                      <SelectItem key={motorista.id} value={motorista.id}>
                        {motorista.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Infração */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhes da Infração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_infracao" className="text-seguranca-lightgray">
                    Tipo de Infração *
                  </Label>
                  <Select
                    value={formData.tipo_infracao}
                    onValueChange={(value) => handleInputChange('tipo_infracao', value)}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      {tiposInfracao.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pontos" className="text-seguranca-lightgray">
                    Pontos na CNH
                  </Label>
                  <Input
                    id="pontos"
                    type="number"
                    min="0"
                    max="20"
                    value={formData.pontos}
                    onChange={(e) => handleInputChange('pontos', parseInt(e.target.value) || 0)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="local_infracao" className="text-seguranca-lightgray">
                    Local da Infração *
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      id="local_infracao"
                      value={formData.local_infracao}
                      onChange={(e) => handleInputChange('local_infracao', e.target.value)}
                      className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="Digite o local da infração"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor" className="text-seguranca-lightgray">
                    Valor da Multa *
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      id="valor"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => handleInputChange('valor', parseFloat(e.target.value) || 0)}
                      className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Datas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_infracao" className="text-seguranca-lightgray">
                    Data da Infração *
                  </Label>
                  <Input
                    id="data_infracao"
                    type="date"
                    value={formData.data_infracao}
                    onChange={(e) => handleInputChange('data_infracao', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_vencimento" className="text-seguranca-lightgray">
                    Data de Vencimento *
                  </Label>
                  <Input
                    id="data_vencimento"
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => handleInputChange('data_vencimento', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status e Observações */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Status e Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-seguranca-lightgray">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value as 'pendente' | 'paga' | 'vencida')}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="paga">Paga</SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes" className="text-seguranca-lightgray">
                    Observações
                  </Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Observações adicionais sobre a multa..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload da Multa */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                Upload da Multa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="file-upload" className="text-seguranca-lightgray">
                  Anexar arquivo da multa (PDF, imagem, etc.)
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
                {file && (
                  <div className="text-sm text-seguranca-lightgray mt-1">
                    Arquivo selecionado: <span className="font-semibold">{file.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !isFormValid}
            className="bg-seguranca-red hover:bg-seguranca-darkred"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Salvando...' : (multa ? 'Atualizar' : 'Criar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MultaFormModal;