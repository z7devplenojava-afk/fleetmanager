import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, FileStack } from 'lucide-react';
import { Employee } from '@/types/employee';
import { EmployeeDocuments } from '@/components/funcionarios/EmployeeDocuments';
import ModelosDocumentosForm from '@/components/funcionarios/ModelosDocumentosForm';

interface EmployeeDocumentsTabProps {
  employee: Employee | null;
}

export const EmployeeDocumentsTab: React.FC<EmployeeDocumentsTabProps> = ({ employee }) => {
  const [subTab, setSubTab] = useState('arquivos');

  if (!employee?.id) {
    return (
      <div className="text-center py-10 text-gray-400 border border-dashed border-gray-600 rounded-lg">
        Salve o funcionário para gerenciar documentos.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-seguranca-black/50 border border-gray-600/30">
          <TabsTrigger value="arquivos" className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Arquivos do Funcionário
          </TabsTrigger>
          <TabsTrigger value="modelos" className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white">
            <FileStack className="h-4 w-4 mr-2" />
            Gerar por Modelo
          </TabsTrigger>
        </TabsList>
        <TabsContent value="arquivos">
          <EmployeeDocuments employeeId={employee.id} employeeName={employee.name} />
        </TabsContent>
        <TabsContent value="modelos">
          <ModelosDocumentosForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeDocumentsTab;
