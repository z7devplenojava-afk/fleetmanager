import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { FileText, Download, Eye, User, Building, Calendar, MapPin, Phone, Mail, Shield, Settings, Monitor, Smartphone, Radio, Car, Motorcycle } from 'lucide-react';

const mockFuncionarios = [
  { 
    id: '1', 
    name: 'João da Silva', 
    cpf: '123.456.789-00',
    cargo: 'Vigilante',
    setor: 'Segurança',
    telefone: '(31) 99999-9999',
    email: 'joao.silva@email.com',
    endereco: 'Rua das Flores, 123, Centro, Contagem/MG'
  },
  { 
    id: '2', 
    name: 'Maria Oliveira', 
    cpf: '987.654.321-00',
    cargo: 'Porteiro',
    setor: 'Portaria',
    telefone: '(31) 88888-8888',
    email: 'maria.oliveira@email.com',
    endereco: 'Av. Brasil, 456, Centro, Contagem/MG'
  },
  { 
    id: '3', 
    name: 'Carlos Santos', 
    cpf: '111.222.333-44',
    cargo: 'Supervisor',
    setor: 'Administrativo',
    telefone: '(31) 77777-7777',
    email: 'carlos.santos@email.com',
    endereco: 'Rua das Palmeiras, 789, Bairro Novo, Contagem/MG'
  },
];

const mockEmpresas = [
  { id: '1', name: 'PROMOVER TERCEIRIZACAO & SERVIÇOS LTDA', cnpj: '12.345.678/0001-99', endereco: 'Av. das Empresas, 456, Centro, Contagem/MG' },
  { id: '2', name: 'EMPRESA BETA', cnpj: '98.765.432/0001-11', endereco: 'Rua Alfa, 789, Centro, Contagem/MG' },
];

const equipamentosOptions = [
  'Notebook',
  'Desktop',
  'Tablet',
  'Smartphone',
  'Rádio Comunicador',
  'Rádio Motorola',
  'Viatura',
  'Motocicleta',
  'Uniforme',
  'Equipamento de Segurança',
  'Ferramentas',
  'Equipamento de Comunicação',
  'GPS',
  'Câmera',
  'Detector de Metais',
  'Outros',
];

const TermoResponsabilidadeEquipamentoForm = () => {
  const [form, setForm] = useState({
    funcionarioId: '',
    empresaId: '',
    equipamento: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    patrimonio: '',
    dataEntrega: '',
    dataDevolucao: '',
    responsavelEntrega: '',
    condicoes: '',
    observacoes: '',
    estadoEquipamento: '',
  });

  const [loading, setLoading] = useState(false);

  const funcionario = mockFuncionarios.find(f => f.id === form.funcionarioId);
  const empresa = mockEmpresas.find(e => e.id === form.empresaId);

  const estadosEquipamento = [
    'Novo',
    'Excelente',
    'Bom',
    'Regular',
    'Precisa Manutenção',
    'Defeituoso',
  ];

  const handlePreview = () => {
    // TODO: Implementar preview do termo
    console.log('Preview do termo:', form);
  };

  const handleGerarPDF = async (e) => {
    e.preventDefault();
    
    if (!funcionario || !empresa || !form.equipamento || !form.numeroSerie || !form.dataEntrega) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        templateName: 'termo-responsabilidade-equipamento.html',
        // Dados do Funcionário
        funcionario: funcionario.name,
        cpf: funcionario.cpf,
        cargo: funcionario.cargo,
        setor: funcionario.setor,
        telefone: funcionario.telefone,
        email: funcionario.email,
        endereco: funcionario.endereco,
        // Dados da Empresa
        empresa: empresa.name,
        cnpj: empresa.cnpj,
        enderecoEmpresa: empresa.endereco,
        // Dados do Equipamento
        equipamento: form.equipamento,
        marca: form.marca,
        modelo: form.modelo,
        numeroSerie: form.numeroSerie,
        patrimonio: form.patrimonio,
        estadoEquipamento: form.estadoEquipamento,
        // Dados da Entrega
        dataEntrega: form.dataEntrega,
        dataDevolucao: form.dataDevolucao,
        responsavelEntrega: form.responsavelEntrega,
        condicoes: form.condicoes,
        observacoes: form.observacoes,
        dataAtual: new Date().toLocaleDateString('pt-BR')
      };

      const response = await fetch('/api/documents/generate-pdf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Erro ao gerar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `termo-responsabilidade-${funcionario.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Termo de Responsabilidade de Equipamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de Funcionário e Empresa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Select value={form.funcionarioId} onValueChange={(value) => setForm(prev => ({ ...prev, funcionarioId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {mockFuncionarios.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={form.empresaId} onValueChange={(value) => setForm(prev => ({ ...prev, empresaId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {mockEmpresas.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Informações do Funcionário Selecionado */}
          {funcionario && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações do Funcionário
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nome</Label>
                  <Input value={funcionario.name} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">CPF</Label>
                  <Input value={funcionario.cpf} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cargo</Label>
                  <Input value={funcionario.cargo} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Setor</Label>
                  <Input value={funcionario.setor} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Telefone</Label>
                  <Input value={funcionario.telefone} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">E-mail</Label>
                  <Input value={funcionario.email} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Endereço</Label>
                  <Input value={funcionario.endereco} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          )}

          {/* Informações da Empresa Selecionada */}
          {empresa && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Informações da Empresa
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Razão Social</Label>
                  <Input value={empresa.name} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">CNPJ</Label>
                  <Input value={empresa.cnpj} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">Endereço</Label>
                  <Input value={empresa.endereco} disabled className="bg-gray-100 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          )}

          {/* Informações do Equipamento */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Informações do Equipamento
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Equipamento</Label>
                <Select value={form.equipamento} onValueChange={(value) => setForm(prev => ({ ...prev, equipamento: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipamentosOptions.map(equip => (
                      <SelectItem key={equip} value={equip}>{equip}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input 
                  value={form.marca} 
                  onChange={(e) => setForm(prev => ({ ...prev, marca: e.target.value }))}
                  placeholder="Ex: Dell, Motorola, Toyota"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Input 
                  value={form.modelo} 
                  onChange={(e) => setForm(prev => ({ ...prev, modelo: e.target.value }))}
                  placeholder="Ex: Latitude 5520, GP300, Corolla"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Número de Série</Label>
                <Input 
                  value={form.numeroSerie} 
                  onChange={(e) => setForm(prev => ({ ...prev, numeroSerie: e.target.value }))}
                  placeholder="Ex: SN123456789"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Patrimônio</Label>
                <Input 
                  value={form.patrimonio} 
                  onChange={(e) => setForm(prev => ({ ...prev, patrimonio: e.target.value }))}
                  placeholder="Ex: PAT001234"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Estado do Equipamento</Label>
                <Select value={form.estadoEquipamento} onValueChange={(value) => setForm(prev => ({ ...prev, estadoEquipamento: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {estadosEquipamento.map(estado => (
                      <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Datas e Responsável */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data de Entrega</Label>
              <Input 
                type="date" 
                value={form.dataEntrega} 
                onChange={(e) => setForm(prev => ({ ...prev, dataEntrega: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data de Devolução</Label>
              <Input 
                type="date" 
                value={form.dataDevolucao} 
                onChange={(e) => setForm(prev => ({ ...prev, dataDevolucao: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Responsável pela Entrega</Label>
              <Input 
                value={form.responsavelEntrega} 
                onChange={(e) => setForm(prev => ({ ...prev, responsavelEntrega: e.target.value }))}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          {/* Condições de Uso */}
          <div className="space-y-2">
            <Label>Condições de Uso</Label>
            <Textarea 
              value={form.condicoes} 
              onChange={(e) => setForm(prev => ({ ...prev, condicoes: e.target.value }))}
              placeholder="Descreva as condições de uso e responsabilidades..."
              rows={4}
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea 
              value={form.observacoes} 
              onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais sobre o equipamento..."
              rows={3}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-4 pt-4">
            <Button onClick={handlePreview} variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar Termo
            </Button>
            <Button onClick={handleGerarPDF} className="flex items-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Gerar Termo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermoResponsabilidadeEquipamentoForm; 