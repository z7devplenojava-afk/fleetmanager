import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { Download, FileText, Loader2 } from 'lucide-react';
import api from '../../lib/axios';

const ReportGenerator = () => {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const reportTypes = [
    { id: 'employees', name: 'Funcionários', endpoint: '/api/reports/employees/pdf' },
    { id: 'companies', name: 'Empresas', endpoint: '/api/reports/companies/pdf' },
    { id: 'products', name: 'Produtos', endpoint: '/api/reports/products/pdf' },
    { id: 'inventory', name: 'Estoque', endpoint: '/api/reports/inventory/pdf' },
    { id: 'financial', name: 'Financeiro', endpoint: '/api/reports/financial/pdf' },
    { id: 'consolidated', name: 'Consolidado', endpoint: '/api/reports/consolidated/pdf' }
  ];

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      toast({
        title: "Erro",
        description: "Selecione um tipo de relatório.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const reportType = reportTypes.find(r => r.id === selectedReport);
      if (!reportType) {
        throw new Error('Tipo de relatório não encontrado');
      }

      const response = await api.get(reportType.endpoint, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_${selectedReport}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: "Relatório gerado e baixado com sucesso!",
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-seguranca-graphite border-gray-600">
      <CardHeader>
        <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Gerador de Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-2">
          <label className="text-seguranca-lightgray">Tipo de Relatório</label>
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
              <SelectValue placeholder="Selecione o tipo de relatório" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((report) => (
                <SelectItem key={report.id} value={report.id}>
                  {report.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerateReport}
          disabled={loading || !selectedReport}
          className="w-full bg-seguranca-red hover:bg-seguranca-darkred"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Gerar Relatório PDF
            </>
          )}
        </Button>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="text-seguranca-lightgray font-medium mb-2">Relatórios Disponíveis:</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• <strong>Funcionários:</strong> Lista completa de funcionários</li>
            <li>• <strong>Empresas:</strong> Empresas cadastradas no sistema</li>
            <li>• <strong>Produtos:</strong> Catálogo de produtos</li>
            <li>• <strong>Estoque:</strong> Situação atual do estoque</li>
            <li>• <strong>Financeiro:</strong> Movimentações financeiras</li>
            <li>• <strong>Consolidado:</strong> Visão geral do sistema</li>
          </ul>
        </div>

      </CardContent>
    </Card>
  );
};

export default ReportGenerator; 