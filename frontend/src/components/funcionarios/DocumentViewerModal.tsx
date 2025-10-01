import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import DependentesList from '../dependentes/DependentesList';
import { UserPlus } from 'lucide-react';

const statusColor = {
  'PENDENTE': 'bg-yellow-500',
  'ASSINADO': 'bg-green-600',
  'VENCIDO': 'bg-red-600'
};

const DocumentViewerModal = ({ open, onOpenChange, document, onSign }) => {
  const [activeTab, setActiveTab] = useState('documento');
  
  if (!document) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl p-4 sm:p-6 rounded-md">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{document.type}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="documento">Documento</TabsTrigger>
            <TabsTrigger value="dependentes">Dependentes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="documento" className="space-y-4">
            <div className="space-y-2 text-sm">
              <div><span className="font-semibold">Funcionário:</span> {document.employee?.name || 'N/A'}</div>
              <div><span className="font-semibold">CPF:</span> {document.employee?.cpf || 'N/A'}</div>
              <div><span className="font-semibold">Status:</span> <Badge className={statusColor[document.status] + ' text-white'}>{document.status}</Badge></div>
              <div><span className="font-semibold">Gerado em:</span> {document.generatedAt}</div>
              <div><span className="font-semibold">Assinado em:</span> {document.signedAt || '--'}</div>
            </div>
            <div className="my-4 border rounded bg-muted p-4 text-center">
              {/* Simulação do PDF: pode ser um iframe ou apenas um box */}
              <div className="text-xs text-muted-foreground">[Pré-visualização do PDF: {document.type}]</div>
            </div>
          </TabsContent>
          
          <TabsContent value="dependentes" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Dependentes de {document.employee?.name || 'Funcionário'}</h3>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <UserPlus size={16} />
                  Adicionar
                </Button>
              </div>
              
              {document.employee?.id ? (
                <DependentesList employeeId={document.employee.id} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Não foi possível carregar os dependentes.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
          {activeTab === 'documento' && document.status === 'PENDENTE' && (
            <Button onClick={() => onSign(document.id)} className="w-full sm:w-auto">Assinar Documento</Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewerModal;