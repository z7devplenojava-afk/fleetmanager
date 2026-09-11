import React, { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SSTTraining, CreateSSTTrainingDTO } from '@/services/sstService';
import { Loader2, GraduationCap, Clock, FileText, Building2, Shield, Plus, ExternalLink } from 'lucide-react';
import { contasAPagarService, Supplier } from '@/services/contasAPagarService';
import { useToast } from '@/hooks/use-toast';
import SupplierFormModal from '@/components/estoque/SupplierFormModal';

interface TrainingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  training?: SSTTraining | null;
  onSubmit: (data: CreateSSTTrainingDTO) => Promise<void>;
}

export default function TrainingFormModal({
  open,
  onOpenChange,
  training,
  onSubmit,
}: TrainingFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Estados do formulário
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trainingType, setTrainingType] = useState('NR_35');
  const [durationHours, setDurationHours] = useState<number>(8);
  const [validityMonths, setValidityMonths] = useState<number | undefined>(12);
  const [isMandatory, setIsMandatory] = useState(true);
  const [provider, setProvider] = useState('');
  const [providerId, setProviderId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  
  // Estados para fornecedores
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // Carregar fornecedores do banco de dados
  useEffect(() => {
    if (open) {
      loadSuppliers();
    }
  }, [open]);

  const loadSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const fornecedores = await contasAPagarService.getFornecedores();
      setSuppliers(fornecedores.filter(s => s.isActive !== false));
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast({
        title: "Aviso",
        description: "Não foi possível carregar a lista de fornecedores",
        variant: "default",
      });
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // Carregar dados do treinamento quando for edição
  useEffect(() => {
    if (training) {
      setName(training.name);
      setDescription(training.description || '');
      setTrainingType(training.trainingType);
      setDurationHours(training.durationHours);
      setValidityMonths(training.validityMonths);
      setIsMandatory(training.isMandatory);
      setProvider(training.provider || '');
      // Se o provider for um nome, tentar encontrar o ID correspondente
      if (training.provider) {
        const foundSupplier = suppliers.find(s => s.name === training.provider);
        if (foundSupplier) {
          setProviderId(foundSupplier.id);
        }
      }
      setIsActive(training.isActive);
    } else {
      // Reset form
      setName('');
      setDescription('');
      setTrainingType('NR_35');
      setDurationHours(8);
      setValidityMonths(12);
      setIsMandatory(true);
      setProvider('');
      setProviderId('');
      setIsActive(true);
    }
  }, [training, open, suppliers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !trainingType || !durationHours) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Se providerId estiver selecionado, usar o nome do fornecedor correspondente
      let providerName = provider;
      if (providerId && !provider) {
        const selectedSupplier = suppliers.find(s => s.id === providerId);
        if (selectedSupplier) {
          providerName = selectedSupplier.name;
        }
      }
      
      await onSubmit({
        name,
        description: description || undefined,
        trainingType,
        durationHours,
        validityMonths: validityMonths || undefined,
        isMandatory,
        provider: providerName || undefined,
        isActive,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar treinamento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupplierSave = async (supplierData: any) => {
    try {
      const newSupplier = await contasAPagarService.createFornecedor(supplierData);
      toast({
        title: "Sucesso",
        description: "Fornecedor criado com sucesso!",
      });
      await loadSuppliers();
      // Selecionar automaticamente o fornecedor recém-criado
      setProviderId(newSupplier.id);
      setProvider(newSupplier.name);
      setShowSupplierModal(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Não foi possível salvar o fornecedor.';
      toast({
        title: "Erro",
        description: msg,
        variant: "destructive",
      });
      throw error;
    }
  };

  const trainingTypeOptions = [
    { value: 'NR_35', label: 'NR-35 - Trabalho em Altura' },
    { value: 'CIPA', label: 'CIPA - Comissão Interna de Prevenção de Acidentes' },
    { value: 'NR_10', label: 'NR-10 - Segurança em Instalações e Serviços em Eletricidade' },
    { value: 'BRIGADA_INCENDIO', label: 'Brigada de Incêndio' },
    { value: 'NR_33', label: 'NR-33 - Espaços Confinados' },
    { value: 'NR_12', label: 'NR-12 - Segurança no Trabalho em Máquinas e Equipamentos' },
    { value: 'PRIMEIROS_SOCORROS', label: 'Primeiros Socorros' },
    { value: 'RECICLAGEM_VIGILANTE', label: 'Reciclagem de Vigilante' },
    { value: 'OUTROS', label: 'Outros' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-4 sm:p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            {training ? 'Editar Treinamento SST' : 'Novo Treinamento SST'}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm sm:text-base">
            {training ? 'Atualize as informações do treinamento' : 'Cadastre um novo treinamento de Saúde e Segurança do Trabalho'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Seção: Informações Básicas */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                </div>
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                  Nome do Treinamento <span className="text-seguranca-red">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: NR-35 - Trabalho em Altura"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-seguranca-lightgray font-medium text-sm sm:text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descrição detalhada do treinamento (opcional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[100px] text-sm sm:text-base resize-y"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trainingType" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                    Tipo de Treinamento <span className="text-seguranca-red">*</span>
                  </Label>
                  <Select value={trainingType} onValueChange={setTrainingType}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[300px]">
                      {trainingTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider" className="text-seguranca-lightgray font-medium text-sm sm:text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Fornecedor
                  </Label>
                  <div className="flex gap-2">
                    <Select 
                      value={providerId || provider} 
                      onValueChange={(value) => {
                        const selectedSupplier = suppliers.find(s => s.id === value);
                        if (selectedSupplier) {
                          setProviderId(selectedSupplier.id);
                          setProvider(selectedSupplier.name);
                        } else {
                          setProviderId(value);
                          setProvider(value);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base flex-1">
                        <SelectValue placeholder={loadingSuppliers ? "Carregando..." : suppliers.length === 0 ? "Nenhum fornecedor cadastrado" : "Selecione um fornecedor"} />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[300px]">
                        {suppliers.length === 0 && !loadingSuppliers ? (
                          <SelectItem value="__no_supplier__" disabled className="text-gray-500">
                            Nenhum fornecedor cadastrado
                          </SelectItem>
                        ) : (
                          suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                              {supplier.name}
                            </SelectItem>
                          ))
                        )}
                        {!providerId && provider && (
                          <SelectItem value={provider} className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                            {provider}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSupplierModal(true)}
                      className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-red/20 flex items-center gap-2 px-3 sm:px-4"
                      title="Cadastrar novo fornecedor"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Novo</span>
                    </Button>
                  </div>
                  {suppliers.length === 0 && !loadingSuppliers && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Nenhum fornecedor encontrado. Clique em "Novo" para cadastrar.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Duração e Validade */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                </div>
                Duração e Validade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationHours" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                    Duração (horas) <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="durationHours"
                    type="number"
                    min="1"
                    placeholder="Ex: 8"
                    value={durationHours}
                    onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validityMonths" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                    Validade (meses)
                  </Label>
                  <Input
                    id="validityMonths"
                    type="number"
                    min="0"
                    placeholder="Ex: 12 (deixe vazio se não tiver validade)"
                    value={validityMonths || ''}
                    onChange={(e) => setValidityMonths(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-400">Deixe vazio se o treinamento não tiver validade</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isMandatory" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                    Treinamento Obrigatório
                  </Label>
                  <Select value={isMandatory ? 'true' : 'false'} onValueChange={(value) => setIsMandatory(value === 'true')}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="true" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Sim
                      </SelectItem>
                      <SelectItem value="false" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Não
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                    Status
                  </Label>
                  <Select value={isActive ? 'true' : 'false'} onValueChange={(value) => setIsActive(value === 'true')}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="true" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Ativo
                      </SelectItem>
                      <SelectItem value="false" className="text-seguranca-lightgray hover:bg-seguranca-red/20">
                        Inativo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-seguranca-red to-red-600 hover:from-seguranca-red/90 hover:to-red-600/90 text-white font-semibold shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                training ? 'Atualizar Treinamento' : 'Criar Treinamento'
              )}
            </Button>
          </DialogFooter>
        </form>
        
        {/* Modal de Cadastro de Fornecedor */}
        {showSupplierModal && (
          <SupplierFormModal
            isOpen={showSupplierModal}
            onClose={() => setShowSupplierModal(false)}
            supplier={null}
            onSave={handleSupplierSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}




