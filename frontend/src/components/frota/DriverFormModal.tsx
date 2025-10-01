import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import driverService from '@/services/driverService';
import { useToast } from '@/hooks/use-toast';
import { Driver } from '@/types/driver';

interface DriverFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  driver?: Driver | null; // Para edição
}

const DriverFormModal: React.FC<DriverFormModalProps> = ({ isOpen, onOpenChange, onSuccess, driver }) => {
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [status, setStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const isEditing = !!driver;

  useEffect(() => {
    if (driver) {
      setName(driver.name);
      setLicenseNumber(driver.licenseNumber || '');
      setStatus(driver.status);
    } else {
      setName('');
      setLicenseNumber('');
      setStatus('ATIVO');
    }
  }, [driver, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const driverData = { name, licenseNumber, status };
      if (isEditing && driver) {
        await driverService.updateDriver(driver.id, driverData);
      } else {
        await driverService.createDriver(driverData);
      }
      
      toast({
        title: 'Sucesso',
        description: `Motorista ${isEditing ? 'atualizado' : 'criado'} com sucesso.`,
        variant: 'default',
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: `Não foi possível ${isEditing ? 'atualizar' : 'criar'} o motorista.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-seguranca-graphite text-seguranca-lightgray">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Motorista' : 'Novo Motorista'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="licenseNumber" className="text-right">
                Nº da CNH
              </Label>
              <Input
                id="licenseNumber"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={status} onValueChange={(value: 'ATIVO' | 'INATIVO') => setStatus(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading} className="bg-seguranca-red hover:bg-seguranca-darkred">
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DriverFormModal; 