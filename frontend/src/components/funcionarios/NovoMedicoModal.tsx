import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { doctorService } from '@/services/doctorService';
import { Doctor } from '@/types/doctor';
import { useToast } from '@/hooks/use-toast';
import { 
  UserPlus, Loader2, CheckCircle, AlertCircle, 
  User, FileText, Sparkles, Stethoscope, Star
} from 'lucide-react';

interface NovoMedicoModalProps {
  open: boolean;
  onClose: () => void;
  onMedicoCreated: (medico: Doctor) => void;
}

const NovoMedicoModal: React.FC<NovoMedicoModalProps> = ({ open, onClose, onMedicoCreated }) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    crmNumber: '',
    crmState: '',
    active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      setError('Nome do médico é obrigatório.');
      return;
    }

    if (!form.crmNumber.trim()) {
      setError('CRM é obrigatório.');
      return;
    }

    if (!form.crmState.trim() || form.crmState.trim().length !== 2) {
      setError('Estado do CRM é obrigatório e deve ter 2 caracteres (ex: MG, SP).');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const newMedico = await doctorService.create({
        name: form.name.trim(),
        crmNumber: form.crmNumber.trim(),
        crmState: form.crmState.trim().toUpperCase(),
        active: true
      });
      
      toast({
        title: "Sucesso",
        description: "Médico cadastrado com sucesso!",
      });
      
      onMedicoCreated(newMedico);
      onClose();
      setForm({ name: '', crmNumber: '', crmState: '', active: true });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao cadastrar médico. Tente novamente.';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ name: '', crmNumber: '', crmState: '', active: true });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-full max-h-[95vh] overflow-y-auto p-0 mx-4 sm:mx-0">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-seguranca-yellow p-4 sm:p-6 text-white sticky top-0 z-10">
          <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-bold">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
              <Stethoscope className="h-4 w-4 sm:h-6 sm:w-6" />
            </div>
            <span className="truncate">Novo Médico</span>
          </DialogTitle>
          <DialogDescription className="text-white/90 text-sm sm:text-base mt-1">
            Preencha os dados do médico para cadastro no sistema
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Informações do Médico */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <div className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 bg-seguranca-yellow/20 rounded-lg">
                  <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-yellow" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Informações do Médico</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm font-medium text-gray-300">Status</Label>
                  <Badge className="bg-seguranca-yellow/20 text-seguranca-yellow border-seguranca-yellow/30 text-xs sm:text-sm">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Novo Médico
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm font-medium text-gray-300">Tipo</Label>
                  <Badge className="bg-seguranca-red/20 text-seguranca-red border-seguranca-red/30 text-xs sm:text-sm">
                    <Star className="h-3 w-3 mr-1" />
                    Médico Ativo
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Dados do Médico */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 sm:p-2 bg-seguranca-red/20 rounded-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">Dados do Médico</h3>
              </div>

              {/* Nome do Médico */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5 sm:gap-2">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">Nome Completo</span>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs ml-auto">
                    Obrigatório
                  </Badge>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex: Dr. João Silva"
                  required
                  disabled={loading}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow text-sm sm:text-base h-10 sm:h-11"
                />
                {form.name && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span>Nome válido: {form.name.length} caracteres</span>
                  </div>
                )}
              </div>

              {/* CRM */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="crmNumber" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5 sm:gap-2">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">CRM Nº</span>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs ml-auto">
                      Obrigatório
                    </Badge>
                  </Label>
                  <Input
                    id="crmNumber"
                    name="crmNumber"
                    value={form.crmNumber}
                    onChange={handleChange}
                    placeholder="Ex: 86789"
                    required
                    disabled={loading}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow text-sm sm:text-base h-10 sm:h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crmState" className="text-xs sm:text-sm font-medium text-gray-200 flex items-center gap-1.5 sm:gap-2">
                    <span className="truncate">Estado</span>
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs ml-auto">
                      Obrigatório
                    </Badge>
                  </Label>
                  <Input
                    id="crmState"
                    name="crmState"
                    value={form.crmState}
                    onChange={handleChange}
                    placeholder="Ex: MG"
                    maxLength={2}
                    required
                    disabled={loading}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow text-sm sm:text-base h-10 sm:h-11 uppercase"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <Card className="bg-red-500/10 border-red-500/30">
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-red-300 font-medium break-words">{error}</span>
                  </div>
                </div>
              </Card>
            )}

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-600">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white h-10 sm:h-11 text-sm sm:text-base order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !form.name.trim() || !form.crmNumber.trim() || !form.crmState.trim()}
                className="w-full sm:w-auto bg-gradient-to-r from-seguranca-red to-seguranca-yellow hover:from-seguranca-red/90 hover:to-seguranca-yellow/90 text-white font-medium h-10 sm:h-11 text-sm sm:text-base order-1 sm:order-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                    <span className="truncate">Cadastrando...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    <span className="truncate">Cadastrar Médico</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NovoMedicoModal;


