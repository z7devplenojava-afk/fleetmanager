import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Calendar, User, Building, FileText, Download, Eye } from 'lucide-react';

const ContratosTrabalhoForm = () => {
  const [form, setForm] = useState({
    employeeId: '',
    employeeName: '',
    position: '',
    contractType: '',
    startDate: '',
    endDate: '',
    salary: '',
    workSchedule: '',
    department: '',
    supervisor: '',
    benefits: [] as string[],
    observations: '',
  });

  const contractTypes = [
    'CLT - Efetivo',
    'CLT - Temporário',
    'PJ - Prestador de Serviços',
    'Estagiário',
    'Aprendiz',
    'Terceirizado',
  ];

  const benefitOptions = [
    'Vale Transporte',
    'Vale Refeição',
    'Plano de Saúde',
    'Plano Odontológico',
    'Gympass',
    'PLR',
    'Participação nos Lucros',
  ];

  const handleBenefitToggle = (benefit: string) => {
    setForm(prev => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter(b => b !== benefit)
        : [...prev.benefits, benefit]
    }));
  };

  const handleGenerateContract = () => {
    // TODO: Implementar geração do contrato
    console.log('Gerando contrato:', form);
  };

  const handlePreviewContract = () => {
    // TODO: Implementar preview do contrato
    console.log('Preview do contrato:', form);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contrato de Trabalho
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações do Funcionário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Select value={form.employeeId} onValueChange={(value) => setForm(prev => ({ ...prev, employeeId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">João Silva</SelectItem>
                  <SelectItem value="2">Maria Souza</SelectItem>
                  <SelectItem value="3">Carlos Lima</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input 
                value={form.position} 
                onChange={(e) => setForm(prev => ({ ...prev, position: e.target.value }))}
                placeholder="Ex: Vigilante"
              />
            </div>
          </div>

          {/* Tipo de Contrato e Datas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Contrato</Label>
              <Select value={form.contractType} onValueChange={(value) => setForm(prev => ({ ...prev, contractType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input 
                type="date" 
                value={form.startDate} 
                onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data de Término</Label>
              <Input 
                type="date" 
                value={form.endDate} 
                onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Salário e Horário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Salário Base</Label>
              <Input 
                value={form.salary} 
                onChange={(e) => setForm(prev => ({ ...prev, salary: e.target.value }))}
                placeholder="R$ 0,00"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Jornada de Trabalho</Label>
              <Input 
                value={form.workSchedule} 
                onChange={(e) => setForm(prev => ({ ...prev, workSchedule: e.target.value }))}
                placeholder="Ex: 44h semanais"
              />
            </div>
          </div>

          {/* Departamento e Supervisor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Input 
                value={form.department} 
                onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Ex: Segurança"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Supervisor</Label>
              <Input 
                value={form.supervisor} 
                onChange={(e) => setForm(prev => ({ ...prev, supervisor: e.target.value }))}
                placeholder="Nome do supervisor"
              />
            </div>
          </div>

          {/* Benefícios */}
          <div className="space-y-2">
            <Label>Benefícios</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {benefitOptions.map(benefit => (
                <Button
                  key={benefit}
                  type="button"
                  variant={form.benefits.includes(benefit) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleBenefitToggle(benefit)}
                  className="justify-start"
                >
                  {benefit}
                </Button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea 
              value={form.observations} 
              onChange={(e) => setForm(prev => ({ ...prev, observations: e.target.value }))}
              placeholder="Observações adicionais sobre o contrato..."
              rows={3}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-4 pt-4">
            <Button onClick={handlePreviewContract} variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar Contrato
            </Button>
            <Button onClick={handleGenerateContract} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Gerar Contrato
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContratosTrabalhoForm; 