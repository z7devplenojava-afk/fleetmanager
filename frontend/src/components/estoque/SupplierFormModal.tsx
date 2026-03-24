import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Supplier, CreateSupplierRequest } from '@/services/contasAPagarService';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Sparkles,
  User,
  Hash,
  Calendar,
  Tag,
  X
} from 'lucide-react';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
  onSave: (payload: CreateSupplierRequest) => Promise<void> | void;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({ isOpen, onClose, supplier, onSave }) => {
  const [form, setForm] = useState<CreateSupplierRequest>({ name: '', cnpj: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const formatCnpj = (value: string): string => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 14);
    let out = digits;
    out = out.replace(/^(\d{2})(\d)/, '$1.$2');
    out = out.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    out = out.replace(/\.(\d{3})(\d)/, '.$1/$2');
    out = out.replace(/(\d{4})(\d)/, '$1-$2');
    return out;
  };

  const formatPhone = (value: string): string => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 11);
    let out = digits;
    if (digits.length <= 10) {
      out = out.replace(/^(\d{2})(\d)/, '($1) $2');
      out = out.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      out = out.replace(/^(\d{2})(\d)/, '($1) $2');
      out = out.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return out;
  };

  const formatZipCode = (value: string): string => {
    const digits = (value || '').replace(/\D/g, '').slice(0, 8);
    let out = digits;
    out = out.replace(/^(\d{5})(\d)/, '$1-$2');
    return out;
  };

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setForm({
          name: supplier.name,
          cnpj: supplier.cnpj || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: supplier.address || '',
          city: supplier.city || '',
          state: supplier.state || '',
          zipCode: supplier.zipCode || '',
          category: supplier.category || '',
          notes: supplier.notes || '',
        });
      } else {
        setForm({ name: '', cnpj: '', email: '', phone: '', address: '', city: '', state: '', zipCode: '', category: '', notes: '' });
      }
    }
  }, [isOpen, supplier]);

  const update = (k: keyof CreateSupplierRequest, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalized: CreateSupplierRequest = {
        ...form,
        name: (form.name || '').trim(),
        cnpj: formatCnpj(form.cnpj || ''),
        email: (form.email || '').trim(),
        phone: formatPhone(form.phone || ''),
        zipCode: formatZipCode(form.zipCode || ''),
      };
      
      // Validações obrigatórias
      if (!normalized.name) {
        throw new Error('Nome é obrigatório');
      }
      if ((normalized.cnpj || '').replace(/\D/g, '').length !== 14) {
        throw new Error('CNPJ inválido. Use o formato 00.000.000/0000-00');
      }
      if (!normalized.email) {
        throw new Error('E-mail é obrigatório');
      }
      if (!normalized.email.match(/^[A-Za-z0-9+_.-]+@(.+)$/)) {
        throw new Error('E-mail inválido');
      }
      if (!normalized.phone) {
        throw new Error('Telefone é obrigatório');
      }
      if ((normalized.phone || '').replace(/\D/g, '').length < 10) {
        throw new Error('Telefone inválido');
      }
      
      await onSave(normalized);
      toast({ 
        title: '✅ Fornecedor salvo', 
        description: 'Fornecedor criado/atualizado com sucesso.',
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="z-[10100]" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-[10110] grid w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 border bg-gradient-to-br from-seguranca-graphite/95 to-seguranca-black/95 border-gray-600/50 shadow-2xl backdrop-blur-sm p-6 rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
        >
        <DialogHeader className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-seguranca-red/20 to-seguranca-red/10 border border-seguranca-red/30 shadow-lg shadow-seguranca-red/10">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-seguranca-red" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
                {supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm sm:text-base mt-1">
                Preencha os dados do fornecedor
              </DialogDescription>
            </div>
          </div>
          
          <Card className="bg-gradient-to-r from-seguranca-red/10 to-seguranca-darkred/10 border-seguranca-red/20 p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-seguranca-red">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="font-medium">Campos obrigatórios:</span>
              <div className="flex flex-wrap gap-1">
                <Badge variant="destructive" className="text-xs px-2 py-1">Nome</Badge>
                <Badge variant="destructive" className="text-xs px-2 py-1">CNPJ</Badge>
                <Badge variant="destructive" className="text-xs px-2 py-1">E-mail</Badge>
                <Badge variant="destructive" className="text-xs px-2 py-1">Telefone</Badge>
              </div>
            </div>
          </Card>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red flex-shrink-0" />
              <span className="truncate">Informações Básicas</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                  Nome *
                </Label>
                <Input 
                  value={form.name} 
                  onChange={e => update('name', e.target.value)} 
                  required 
                  className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                  placeholder="Nome do fornecedor"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                  <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                  CNPJ *
                </Label>
                <Input 
                  value={form.cnpj} 
                  onChange={e => update('cnpj', formatCnpj(e.target.value))} 
                  required 
                  placeholder="00.000.000/0000-00" 
                  className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red flex-shrink-0" />
              <span className="truncate">Contato</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                  E-mail *
                </Label>
                <Input 
                  value={form.email || ''} 
                  onChange={e => update('email', e.target.value)} 
                  required
                  type="email"
                  className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                  placeholder="contato@fornecedor.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                  Telefone *
                </Label>
                <Input 
                  value={form.phone || ''} 
                  onChange={e => update('phone', formatPhone(e.target.value))} 
                  required
                  className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red flex-shrink-0" />
              <span className="truncate">Endereço</span>
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                  Endereço
                </Label>
                <Input 
                  value={form.address || ''} 
                  onChange={e => update('address', e.target.value)} 
                  className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm sm:text-base">Cidade</Label>
                  <Input 
                    value={form.city || ''} 
                    onChange={e => update('city', e.target.value)} 
                    className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm sm:text-base">Estado</Label>
                  <Input 
                    value={form.state || ''} 
                    onChange={e => update('state', e.target.value.toUpperCase())} 
                    className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm sm:text-base">CEP</Label>
                  <Input 
                    value={form.zipCode || ''} 
                    onChange={e => update('zipCode', formatZipCode(e.target.value))} 
                    className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red flex-shrink-0" />
              <span className="truncate">Informações Adicionais</span>
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm sm:text-base">Categoria</Label>
                <Input 
                  value={form.category || ''} 
                  onChange={e => update('category', e.target.value)} 
                  className="bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 h-10 sm:h-11 text-sm sm:text-base"
                  placeholder="Categoria do fornecedor"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 flex items-center gap-2 text-sm sm:text-base">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-seguranca-red flex-shrink-0" />
                  Observações
                </Label>
                <Textarea 
                  value={form.notes || ''} 
                  onChange={e => update('notes', e.target.value)} 
                  className="min-h-[80px] bg-seguranca-black/50 border-gray-600/30 text-white placeholder-gray-400 focus:border-seguranca-red/50 focus:ring-seguranca-red/20 resize-y text-sm sm:text-base"
                  placeholder="Observações adicionais"
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t border-gray-600/30">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:border-seguranca-red/50 px-4 sm:px-6 h-10 sm:h-11 text-sm sm:text-base order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-seguranca-red to-seguranca-darkred hover:from-seguranca-darkred hover:to-seguranca-red shadow-lg shadow-seguranca-red/20 px-4 sm:px-6 h-10 sm:h-11 text-sm sm:text-base order-1 sm:order-2"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4 text-white" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default SupplierFormModal;


