import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, CheckCircle, Clock, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { documentService, Document } from '@/services/documentService';

interface DocumentReportsProps {
  employeeId?: string;
}

export const DocumentReports: React.FC<DocumentReportsProps> = ({ employeeId }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
  }, [employeeId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      let docs: Document[] = [];
      
      if (employeeId) {
        docs = await documentService.getDocumentsByEmployee(employeeId);
      } else {
        docs = await documentService.getAllDocuments();
      }
      
      setDocuments(docs);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os documentos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const today = new Date();
    const valid = documents.filter(doc => {
      if (!doc.expirationDate) return true;
      return new Date(doc.expirationDate) > today;
    });
    
    const expiring = documents.filter(doc => {
      if (!doc.expirationDate) return false;
      const expDate = new Date(doc.expirationDate);
      const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
      return expDate <= thirtyDaysFromNow && expDate > today;
    });
    
    const expired = documents.filter(doc => {
      if (!doc.expirationDate) return false;
      return new Date(doc.expirationDate) <= today;
    });

    return { total: documents.length, valid: valid.length, expiring: expiring.length, expired: expired.length };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-seguranca-red" />
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-seguranca-lightgray">
          Relatório de Documentos
        </h2>
        <Button 
          onClick={() => {
            const data = { documents, stats, date: new Date().toISOString() };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio_documentos_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({ title: "Sucesso", description: "Relatório exportado!" });
          }}
          className="bg-seguranca-yellow hover:bg-yellow-600 text-black"
        >
          <Download size={20} className="mr-2" />
          Exportar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-seguranca-lightgray">Total</p>
                <p className="text-2xl font-bold text-seguranca-lightgray">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-seguranca-lightgray">Válidos</p>
                <p className="text-2xl font-bold text-green-500">{stats.valid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-seguranca-lightgray">Expirando</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.expiring}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-seguranca-lightgray">Expirados</p>
                <p className="text-2xl font-bold text-red-500">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.total === 0 && (
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
              Nenhum documento encontrado
            </h3>
            <p className="text-seguranca-lightgray">
              Não há documentos para gerar relatório.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 