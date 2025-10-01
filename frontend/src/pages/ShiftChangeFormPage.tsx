import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link } from 'react-router-dom';
import ShiftChangeFormComponent from '@/components/operacional/ShiftChangeFormComponent';
import shiftChangeService, { ShiftChangeFormDTO } from '@/services/shiftChangeService';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const ShiftChangeFormPage: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shiftChanges, setShiftChanges] = useState<ShiftChangeFormDTO[]>([]);

  useEffect(() => {
    fetchShiftChanges();
  }, []);

  const fetchShiftChanges = async () => {
    try {
      const data = await shiftChangeService.getAllShiftChanges();
      setShiftChanges(data);
    } catch (error) {
      console.error("Erro ao buscar solicitações de troca de plantão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as solicitações de troca de plantão.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      const formattedData: ShiftChangeFormDTO = {
        dateOfRequest: format(formData.dateOfRequest, 'yyyy-MM-dd'),
        requesterFullName: formData.requesterFullName,
        requesterSector: formData.requesterSector,
        requesterDayOffDate: formData.requesterDayOffDate ? format(formData.requesterDayOffDate, 'yyyy-MM-dd') : null,
        requesterShiftDate: format(formData.requesterShiftDate, 'yyyy-MM-dd'),
        replacingFullName: formData.replacingFullName,
        replacingSector: formData.replacingSector,
        replacingShiftDate: format(formData.replacingShiftDate, 'yyyy-MM-dd'),
        replacingDayOffDate: formData.replacingDayOffDate ? format(formData.replacingDayOffDate, 'yyyy-MM-dd') : null,
        shiftTime: formData.shiftTime,
        status: 'PENDING', // Define o status inicial como PENDING
      };

      await shiftChangeService.createShiftChange(formattedData);
      await fetchShiftChanges(); // Atualiza a lista após a criação
    } catch (error) {
      // O toast de erro já é tratado no service, então apenas logamos aqui.
      console.error("Erro ao submeter formulário de troca de plantão:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Troca de Plantão | Secure Guard</title>
      </Helmet>

      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard-home">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/operacional">Operacional</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>
                  Troca de Plantão
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Card className="bg-seguranca-darkgray text-seguranca-lightgray p-4">
            <CardHeader>
              <CardTitle className="text-seguranca-yellow text-xl">Formulário de Troca de Plantão</CardTitle>
            </CardHeader>
            <CardContent>
              <ShiftChangeFormComponent onSubmit={handleSubmit} isLoading={isLoading} />
            </CardContent>
          </Card>

          <Card className="bg-seguranca-darkgray text-seguranca-lightgray p-4 mt-4">
            <CardHeader>
              <CardTitle className="text-seguranca-yellow text-xl">Solicitações de Troca de Plantão</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Tabela com as solicitações de troca de plantão será implementada aqui. */}
              {shiftChanges.length === 0 ? (
                <p>Nenhuma solicitação de troca de plantão encontrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr className="bg-seguranca-black">
                        <th className="px-6 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">Data Solicitação</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">Solicitante</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">Plantão Solicitante</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">Colega</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">Plantão Colega</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">Horário</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-seguranca-darkgray divide-y divide-gray-700">
                      {shiftChanges.map((change) => (
                        <tr key={change.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-seguranca-lightgray">{change.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-seguranca-lightgray">{change.dateOfRequest}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-seguranca-lightgray">{change.requesterFullName} ({change.requesterSector})</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-seguranca-lightgray">{change.requesterShiftDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-seguranca-lightgray">{change.replacingFullName} ({change.replacingSector})</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-seguranca-lightgray">{change.replacingShiftDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-seguranca-lightgray">{change.shiftTime.replace('SHIFT_', '').replace('H', 'h ').replace('_', '').replace('AS', 'às ')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-seguranca-lightgray">{change.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default ShiftChangeFormPage;
