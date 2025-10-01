import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { FileText, Download, Eye, User, Building, Calendar, Shield, Plus, X, HardHat } from 'lucide-react';

const mockFuncionarios = [
  { id: '1', name: 'João da Silva', cpf: '123.456.789-00', cargo: 'Vigilante', setor: 'Segurança' },
  { id: '2', name: 'Maria Oliveira', cpf: '987.654.321-00', cargo: 'Porteiro', setor: 'Portaria' },
  { id: '3', name: 'Carlos Santos', cpf: '111.222.333-44', cargo: 'Supervisor', setor: 'Administrativo' },
];

const mockEmpresas = [
  { id: '1', name: 'PROMOVER TERCEIRIZACAO & SERVIÇOS LTDA', cnpj: '12.345.678/0001-99' },
  { id: '2', name: 'EMPRESA BETA', cnpj: '98.765.432/0001-11' },
];

const epiOptions = [
  'Capacete de Segurança',
  'Óculos de Proteção',
  'Protetor Auditivo',
  'Máscara Respiratória',
  'Luvas de Segurança',
  'Calçado de Segurança',
  'Cinto de Segurança',
  'Avental de Proteção',
  'Protetor Facial',
  'Uniforme de Trabalho',
  'Colete Refletivo',
  'Luminária de Cabeça',
  'Detector de Gás',
  'Protetor Solar',
  'Outros',
];

const FichaEntregaEPIForm = () => {
  const [form, setForm] = useState({
    funcionarioId: '',
    empresaId: '',
    dataEntrega: '',
    responsavelEntrega: '',
    observacoes: '',
  });

  const [epis, setEpis] = useState([
    { 
      nome: '', 
      quantidade: '1', 
      ca: '', // Certificado de Aprovação
      validade: '',
      observacoes: ''
    }
  ]);

  const [loading, setLoading] = useState(false);

  const funcionario = mockFuncionarios.find(f => f.id === form.funcionarioId);
  const empresa = mockEmpresas.find(e => e.id === form.empresaId);

  const handleEpiChange = (idx, field, value) => {
    setEpis(epis.map((epi, i) => 
      i === idx ? { ...epi, [field]: value } : epi
    ));
  };

  const addEpi = () => {
    setEpis([...epis, { 
      nome: '', 
      quantidade: '1', 
      ca: '', 
      validade: '', 
      observacoes: '' 
    }]);
  };

  const removeEpi = (idx) => {
    if (epis.length > 1) {
      setEpis(epis.filter((_, i) => i !== idx));
    }
  };

  const handlePreview = () => {
    // TODO: Implementar preview da ficha
    console.log('Preview da ficha:', { form, epis });
  };

  const handleGerarPDF = async (e) => {
    e.preventDefault();
    
    if (!form.funcionarioId || !form.empresaId || !form.dataEntrega) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    if (epis.some(epi => !epi.nome)) {
      alert('Preencha o nome de todos os EPIs!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        templateName: 'ficha-entrega-epi.html',
        funcionario: funcionario?.name || '',
        cpf: funcionario?.cpf || '',
        cargo: funcionario?.cargo || '',
        setor: funcionario?.setor || '',
        empresa: empresa?.name || '',
        cnpj: empresa?.cnpj || '',
        dataEntrega: form.dataEntrega,
        responsavelEntrega: form.responsavelEntrega,
        epis: epis.map(epi => ({
          nome: epi.nome,
          quantidade: epi.quantidade,
          ca: epi.ca,
          validade: epi.validade,
          observacoes: epi.observacoes
        })),
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
      a.download = `ficha-entrega-epi-${funcionario?.name?.replace(/\s+/g, '-').toLowerCase()}.pdf`;
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
            <HardHat className="h-5 w-5" />
            Ficha de Entrega de EPI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações do Funcionário e Empresa */}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
            </div>
          )}

          {/* Informações da Empresa Selecionada */}
          {empresa && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Razão Social</Label>
                <Input value={empresa.name} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">CNPJ</Label>
                <Input value={empresa.cnpj} disabled className="bg-gray-100 dark:bg-gray-700" />
              </div>
            </div>
          )}

          {/* Data de Entrega e Responsável */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Entrega</Label>
              <Input 
                type="date" 
                value={form.dataEntrega} 
                onChange={(e) => setForm(prev => ({ ...prev, dataEntrega: e.target.value }))}
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

          {/* Lista de EPIs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">EPIs Entregues</Label>
              <Button type="button" size="sm" onClick={addEpi} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar EPI
              </Button>
            </div>
            
            <div className="space-y-4">
              {epis.map((epi, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">EPI #{idx + 1}</h4>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      onClick={() => removeEpi(idx)}
                      disabled={epis.length === 1}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do EPI</Label>
                      <Select value={epi.nome} onValueChange={(value) => handleEpiChange(idx, 'nome', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o EPI" />
                        </SelectTrigger>
                        <SelectContent>
                          {epiOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quantidade</Label>
                      <Input 
                        type="number" 
                        min="1"
                        value={epi.quantidade} 
                        onChange={(e) => handleEpiChange(idx, 'quantidade', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>CA (Certificado de Aprovação)</Label>
                      <Input 
                        value={epi.ca} 
                        onChange={(e) => handleEpiChange(idx, 'ca', e.target.value)}
                        placeholder="Número do CA"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Data de Validade</Label>
                      <Input 
                        type="date" 
                        value={epi.validade} 
                        onChange={(e) => handleEpiChange(idx, 'validade', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label>Observações</Label>
                      <Textarea 
                        value={epi.observacoes} 
                        onChange={(e) => handleEpiChange(idx, 'observacoes', e.target.value)}
                        placeholder="Observações sobre este EPI..."
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Observações Gerais */}
          <div className="space-y-2">
            <Label>Observações Gerais</Label>
            <Textarea 
              value={form.observacoes} 
              onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais sobre a entrega dos EPIs..."
              rows={3}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-4 pt-4">
            <Button onClick={handlePreview} variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar Ficha
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
                  Gerar Ficha
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FichaEntregaEPIForm; 