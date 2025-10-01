import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { orderOfServiceService } from '@/services/orderOfServiceService';
import { CreateOrderOfServiceDTO } from '@/types/orderOfService';

interface EmitirOrdemServicoModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const initialState: CreateOrderOfServiceDTO = {
  employeeId: 0,
  employeeName: '',
  employeeCpf: '',
  role: '',
  company: '',
  client: '',
  workplace: '',
  salary: 0,
  startDate: '',
  endDate: '',
};

const EmitirOrdemServicoModal: React.FC<EmitirOrdemServicoModalProps> = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState<CreateOrderOfServiceDTO>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ 
      ...prev, 
      [name]: name === 'salary' || name === 'employeeId' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await orderOfServiceService.create(form);
      onCreated();
      onClose();
      setForm(initialState);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao emitir ordem de serviço.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray text-xl">Emitir Ordem de Serviço (SST)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-seguranca-lightgray">ID do Funcionário</label>
              <Input 
                name="employeeId" 
                type="number" 
                placeholder="ID do Funcionário" 
                value={form.employeeId || ''} 
                onChange={handleChange} 
                required 
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-seguranca-lightgray">CPF do Funcionário</label>
              <Input 
                name="employeeCpf" 
                placeholder="000.000.000-00" 
                value={form.employeeCpf} 
                onChange={handleChange} 
                required 
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-seguranca-lightgray">Nome do Funcionário</label>
            <Input 
              name="employeeName" 
              placeholder="Nome completo do funcionário" 
              value={form.employeeName} 
              onChange={handleChange} 
              required 
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-seguranca-lightgray">Função</label>
            <Input 
              name="role" 
              placeholder="Função" 
              value={form.role} 
              onChange={handleChange} 
              required 
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-seguranca-lightgray">Empresa Contratante</label>
              <Input 
                name="company" 
                placeholder="Empresa Contratante" 
                value={form.company} 
                onChange={handleChange} 
                required 
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-seguranca-lightgray">Cliente Final</label>
              <Input 
                name="client" 
                placeholder="Cliente Final" 
                value={form.client} 
                onChange={handleChange} 
                required 
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-seguranca-lightgray">Posto de Trabalho</label>
            <Input 
              name="workplace" 
              placeholder="Posto de Trabalho" 
              value={form.workplace} 
              onChange={handleChange} 
              required 
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-seguranca-lightgray">Salário</label>
            <Input 
              name="salary" 
              type="number" 
              step="0.01"
              placeholder="0,00" 
              value={form.salary || ''} 
              onChange={handleChange} 
              required 
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-seguranca-lightgray">Data de Início</label>
              <Input 
                name="startDate" 
                type="date" 
                value={form.startDate} 
                onChange={handleChange} 
                required 
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-seguranca-lightgray">Data de Término</label>
              <Input 
                name="endDate" 
                type="date" 
                value={form.endDate} 
                onChange={handleChange} 
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>
          
          {error && <div className="text-red-500 text-sm bg-red-900/20 p-2 rounded">{error}</div>}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              {loading ? 'Emitindo...' : 'Emitir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmitirOrdemServicoModal; 