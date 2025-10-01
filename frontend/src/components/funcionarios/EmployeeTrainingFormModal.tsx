import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

import { employeeService } from '@/services/employeeService';
import { trainingService, Training, Unit } from '@/services/trainingService';
import { useToast } from '@/hooks/use-toast';

// Fallback enquanto carrega
const mockEmployees = [] as Array<{ id: string; name: string; cpf?: string; position?: string }>;

const cargos = ['Vigilante', 'Porteiro', 'Auxiliar Administrativo', 'Supervisor', 'Gestor'];

function addYears(dateStr, years) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
}

const EmployeeTrainingFormModal = ({ open, onOpenChange, onSave, editData }) => {
  const [form, setForm] = useState({
    employeeId: '',
    employee: '',
    cpf: '',
    position: '',
    validUntil: '',
    sector: '',
    workSchedule: '',
    asoDate: '',
    psicotecnicoDate: '',
    id: undefined,
  });
  const [employees, setEmployees] = useState(mockEmployees);
  const [units, setUnits] = useState<Unit[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editData) {
      setForm(editData);
    } else {
      setForm({
        employeeId: '', employee: '', cpf: '', position: '', validUntil: '', sector: '', workSchedule: '', asoDate: '', psicotecnicoDate: '', id: undefined
      });
    }
  }, [editData, open]);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const list = await employeeService.getAllEmployees();
        setEmployees(list.map((e: any) => ({ id: e.id, name: e.name, cpf: e.cpf, position: e.positionName })));
      } catch (_) {
        setEmployees([]);
      }
    };
    const loadUnits = async () => {
      try {
        const unitsList = await trainingService.getUnits();
        setUnits(unitsList);
      } catch (_) {
        setUnits([]);
      }
    };
    if (open) { 
      loadEmployees(); 
      loadUnits(); 
    }
  }, [open]);

  // Ao selecionar funcionário, preenche CPF e Cargo
  const handleEmployeeChange = (val) => {
    const emp = employees.find(e => String(e.id) === val);
    if (emp && !emp.cpf) {
      toast({
        title: 'Atenção',
        description: 'Este funcionário não possui CPF cadastrado no sistema. É necessário cadastrar o CPF antes de registrar treinamentos.',
        variant: 'destructive'
      });
      return;
    }
    setForm(f => ({
      ...f,
      employeeId: val,
      employee: emp?.name || '',
      cpf: emp?.cpf || '',
      position: emp?.position || '',
      asoDate: emp?.position === 'Vigilante' ? f.asoDate : '',
      psicotecnicoDate: emp?.position === 'Vigilante' ? f.psicotecnicoDate : '',
    }));
  };

  // Validação automática das datas de validade
  useEffect(() => {
    if (form.position === 'Vigilante') {
      setForm(f => ({
        ...f,
        asoDate: f.asoDate,
        psicotecnicoDate: f.psicotecnicoDate,
      }));
    }
  }, [form.position]);

  const handleSave = async () => {
    if (!form.employeeId || !form.validUntil) return;
    
    // Validação adicional de CPF antes de salvar
    if (!form.cpf) {
      toast({
        title: 'Erro',
        description: 'Funcionário deve ter CPF cadastrado para registrar treinamento.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setSaving(true);
      // Criar um treinamento genérico primeiro
      const training = await trainingService.createTraining({
        name: `Treinamento ${form.position} - ${form.sector || 'Geral'}`,
        description: `Treinamento específico para ${form.position}`,
        provider: 'Empresa',
        duration: 40
      });
      
      // Criar certificação para o funcionário
      await trainingService.createEmployeeCertification({
        employeeId: form.employeeId,
        trainingId: training.id,
        certificationNumber: `CERT-${Date.now()}`,
        issueDate: new Date().toISOString().slice(0,10),
        expirationDate: form.validUntil,
      });
      toast({ title: 'Sucesso', description: 'Treinamento registrado com sucesso!' });
      onSave({ ...form, id: Date.now() });
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao salvar treinamento.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto p-4 sm:p-6 rounded-md max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-center sm:text-left text-seguranca-lightgray">
            {form.id ? 'Editar Treinamento' : 'Novo Treinamento'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-5">
          {/* Funcionário */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-seguranca-lightgray">Funcionário</Label>
            <Select value={form.employeeId} onValueChange={handleEmployeeChange}>
              <SelectTrigger className="w-full h-10 sm:h-11">
                <SelectValue placeholder="Selecione o funcionário" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          {/* CPF e Cargo em linha no desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-seguranca-lightgray">CPF</Label>
              <Input value={form.cpf} disabled className="w-full h-10 sm:h-11 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-seguranca-lightgray">Cargo</Label>
              <Input value={form.position} disabled className="w-full h-10 sm:h-11 text-sm" />
            </div>
          </div>

          {/* Data de Validade */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-seguranca-lightgray">Data de Validade</Label>
            <Input 
              type="date" 
              value={form.validUntil} 
              onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} 
              className="w-full h-10 sm:h-11 text-sm" 
            />
          </div>

          {/* Setor e Horário em linha no desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-seguranca-lightgray">Setor/Posto de Trabalho</Label>
              <Select value={form.sector} onValueChange={(val) => setForm(f => ({ ...f, sector: val }))}>
                <SelectTrigger className="w-full h-10 sm:h-11">
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-seguranca-lightgray">Horário de Trabalho</Label>
              <Input 
                value={form.workSchedule} 
                onChange={e => setForm(f => ({ ...f, workSchedule: e.target.value }))} 
                className="w-full h-10 sm:h-11 text-sm" 
                placeholder="Ex: 06h às 18h"
              />
            </div>
          </div>

          {/* Campos específicos para Vigilante */}
          {form.position === 'Vigilante' && (
            <div className="space-y-4 sm:space-y-5 border-t pt-4 sm:pt-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-seguranca-lightgray">Data do ASO</Label>
                <Input 
                  type="date" 
                  value={form.asoDate} 
                  onChange={e => setForm(f => ({ ...f, asoDate: e.target.value }))} 
                  className="w-full h-10 sm:h-11 text-sm" 
                />
                <div className="text-xs text-seguranca-lightgray/80 bg-seguranca-black p-2 rounded">
                  Validade: {form.asoDate ? addYears(form.asoDate, 1) : '--'}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-seguranca-lightgray">Data do Psicotécnico</Label>
                <Input 
                  type="date" 
                  value={form.psicotecnicoDate} 
                  onChange={e => setForm(f => ({ ...f, psicotecnicoDate: e.target.value }))} 
                  className="w-full h-10 sm:h-11 text-sm" 
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button 
            onClick={handleSave} 
            className="w-full sm:w-auto h-10 sm:h-11 text-sm font-medium bg-seguranca-red hover:bg-seguranca-red/90"
            size="lg"
            disabled={saving}
          >
            {saving ? 'Salvando...' : (form.id ? 'Salvar Alterações' : 'Cadastrar Treinamento')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeTrainingFormModal; 