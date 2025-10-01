import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useToast } from '../../hooks/use-toast';
import { FileText, Download, Printer, Eye } from 'lucide-react';

const TermoLGPDForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    employeeName: '',
    cpf: '',
    position: '',
    department: '',
    consentTypes: [] as string[],
    dataUsage: '',
    dataRetention: '',
    additionalInfo: '',
    consentDate: new Date().toISOString().split('T')[0],
  });

  const consentOptions = [
    { id: 'data_processing', label: 'Processamento de Dados Pessoais' },
    { id: 'data_sharing', label: 'Compartilhamento de Dados' },
    { id: 'marketing', label: 'Marketing e Comunicações' },
    { id: 'third_party', label: 'Transferência para Terceiros' },
    { id: 'automated_processing', label: 'Processamento Automatizado' },
  ];

  const handleConsentChange = (consentId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      consentTypes: checked 
        ? [...prev.consentTypes, consentId]
        : prev.consentTypes.filter(id => id !== consentId)
    }));
  };

  const handleGenerateDocument = () => {
    if (!formData.employeeName || !formData.cpf || formData.consentTypes.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Simular geração do documento
    toast({
      title: "Sucesso",
      description: "Termo de Consentimento LGPD gerado com sucesso!",
    });
  };

  const handlePreview = () => {
    if (!formData.employeeName || !formData.cpf || formData.consentTypes.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios para visualizar.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Visualização",
      description: "Abrindo visualização do termo...",
    });
  };

  const handlePrint = () => {
    if (!formData.employeeName || !formData.cpf || formData.consentTypes.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios para imprimir.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Impressão",
      description: "Enviando para impressora...",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Termo de Consentimento LGPD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações do Funcionário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-seguranca-lightgray">Nome Completo *</Label>
              <Input
                value={formData.employeeName}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeName: e.target.value }))}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="Nome completo do funcionário"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-seguranca-lightgray">CPF *</Label>
              <Input
                value={formData.cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-seguranca-lightgray">Cargo</Label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="Cargo do funcionário"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-seguranca-lightgray">Departamento</Label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="Departamento"
              />
            </div>
          </div>

          {/* Tipos de Consentimento */}
          <div className="space-y-4">
            <Label className="text-seguranca-lightgray font-medium">Tipos de Consentimento *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {consentOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={formData.consentTypes.includes(option.id)}
                    onCheckedChange={(checked) => handleConsentChange(option.id, checked as boolean)}
                    className="border-gray-600"
                  />
                  <Label htmlFor={option.id} className="text-sm text-seguranca-lightgray cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Finalidade do Uso dos Dados */}
          <div className="space-y-2">
            <Label className="text-seguranca-lightgray">Finalidade do Uso dos Dados</Label>
            <Textarea
              value={formData.dataUsage}
              onChange={(e) => setFormData(prev => ({ ...prev, dataUsage: e.target.value }))}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              placeholder="Descreva a finalidade do uso dos dados pessoais..."
              rows={3}
            />
          </div>

          {/* Prazo de Retenção */}
          <div className="space-y-2">
            <Label className="text-seguranca-lightgray">Prazo de Retenção dos Dados</Label>
            <Select
              value={formData.dataRetention}
              onValueChange={(value) => setFormData(prev => ({ ...prev, dataRetention: value }))}
            >
              <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Selecione o prazo de retenção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1_ano">1 ano</SelectItem>
                <SelectItem value="2_anos">2 anos</SelectItem>
                <SelectItem value="3_anos">3 anos</SelectItem>
                <SelectItem value="5_anos">5 anos</SelectItem>
                <SelectItem value="10_anos">10 anos</SelectItem>
                <SelectItem value="indefinido">Indefinido (até rescisão)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data do Consentimento */}
          <div className="space-y-2">
            <Label className="text-seguranca-lightgray">Data do Consentimento</Label>
            <Input
              type="date"
              value={formData.consentDate}
              onChange={(e) => setFormData(prev => ({ ...prev, consentDate: e.target.value }))}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>

          {/* Informações Adicionais */}
          <div className="space-y-2">
            <Label className="text-seguranca-lightgray">Informações Adicionais</Label>
            <Textarea
              value={formData.additionalInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              placeholder="Observações adicionais sobre o consentimento..."
              rows={3}
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handlePreview}
              variant="outline"
              className="border-blue-600 text-blue-400 hover:bg-blue-900 flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-green-600 text-green-400 hover:bg-green-900 flex-1"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button
              onClick={handleGenerateDocument}
              className="bg-seguranca-red hover:bg-seguranca-darkred flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Gerar Documento
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermoLGPDForm; 