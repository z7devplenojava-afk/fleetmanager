import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  FileText, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCcw,
  X,
  Eye
} from 'lucide-react';
import { format, differenceInDays, parseISO, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkContract {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDocument?: string;
  position: string;
  contractType: string;
  startDate: string;
  endDate?: string;
  experienceDuration?: string; // '45', '60', '90'
  status: 'ATIVO' | 'VENCIDO' | 'FINALIZADO' | 'RENOVADO';
  department?: string;
  salary?: number;
}

const ContratosTrabalhoList = () => {
  const [contracts, setContracts] = useState<WorkContract[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data - substituir por chamada real à API
  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = () => {
    // TODO: Implementar chamada real à API
    const mockContracts: WorkContract[] = [
      {
        id: '1',
        employeeId: '00000000-0000-0000-0000-000000000002',
        employeeName: 'Maria Santos',
        employeeDocument: '987.654.321-00',
        position: 'Supervisor',
        contractType: 'Contrato de Experiência',
        startDate: '2025-10-29',
        endDate: '2026-01-12', // 45 dias
        experienceDuration: '45',
        status: 'ATIVO',
        department: 'Operacional',
        salary: 3578.12
      },
      {
        id: '2',
        employeeId: '00000000-0000-0000-0000-000000000003',
        employeeName: 'João Silva',
        employeeDocument: '123.456.789-00',
        position: 'Vigilante',
        contractType: 'CLT - Efetivo',
        startDate: '2023-01-15',
        status: 'ATIVO',
        department: 'Operacional',
        salary: 2500.00
      },
    ];
    setContracts(mockContracts);
  };

  const calculateDaysUntilExpiration = (endDate: string): number => {
    const today = new Date();
    const expiration = parseISO(endDate);
    return differenceInDays(expiration, today);
  };

  const getExpirationStatus = (endDate?: string) => {
    if (!endDate) return null;

    const daysRemaining = calculateDaysUntilExpiration(endDate);
    
    if (daysRemaining < 0) {
      return {
        type: 'expired',
        label: 'Vencido',
        message: `Venceu há ${Math.abs(daysRemaining)} dias`,
        variant: 'destructive' as const,
        icon: <X className="h-4 w-4" />
      };
    } else if (daysRemaining === 0) {
      return {
        type: 'today',
        label: 'Vence Hoje',
        message: 'O contrato vence hoje!',
        variant: 'destructive' as const,
        icon: <AlertTriangle className="h-4 w-4" />
      };
    } else if (daysRemaining <= 7) {
      return {
        type: 'urgent',
        label: 'Vencimento Urgente',
        message: `Vence em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`,
        variant: 'destructive' as const,
        icon: <AlertTriangle className="h-4 w-4" />
      };
    } else if (daysRemaining <= 30) {
      return {
        type: 'warning',
        label: 'Vencimento Próximo',
        message: `Vence em ${daysRemaining} dias`,
        variant: 'default' as const,
        icon: <Clock className="h-4 w-4" />
      };
    }
    
    return {
      type: 'normal',
      label: 'Ativo',
      message: `Vence em ${daysRemaining} dias`,
      variant: 'outline' as const,
      icon: <CheckCircle2 className="h-4 w-4" />
    };
  };

  const handleRenewContract = (contractId: string) => {
    // TODO: Implementar lógica de renovação
    console.log('Renovar contrato:', contractId);
  };

  const handleFinalizeContract = (contractId: string) => {
    // TODO: Implementar lógica de finalização
    console.log('Finalizar contrato:', contractId);
  };

  const handleViewContract = (contractId: string) => {
    // TODO: Implementar visualização do contrato
    console.log('Visualizar contrato:', contractId);
  };

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-primary shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <FileText className="h-6 w-6 text-primary" />
                Contratos de Trabalho
              </CardTitle>
              <CardDescription>
                Acompanhamento e gestão de contratos de trabalho dos colaboradores
              </CardDescription>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              {contracts.length} {contracts.length === 1 ? 'contrato' : 'contratos'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {contracts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum contrato registrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => {
                const expirationStatus = getExpirationStatus(contract.endDate);
                const isExperienceContract = contract.contractType === 'Contrato de Experiência';

                return (
                  <Card 
                    key={contract.id} 
                    className={`${
                      expirationStatus?.type === 'expired' || expirationStatus?.type === 'today' 
                        ? 'border-red-500 bg-red-50/50' 
                        : expirationStatus?.type === 'urgent'
                          ? 'border-orange-500 bg-orange-50/50'
                          : expirationStatus?.type === 'warning'
                            ? 'border-yellow-500 bg-yellow-50/50'
                            : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      {/* Header do Contrato */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{contract.employeeName}</h3>
                            <Badge variant={isExperienceContract ? 'default' : 'outline'}>
                              {contract.contractType}
                            </Badge>
                            {expirationStatus && (
                              <Badge variant={expirationStatus.variant} className="gap-1">
                                {expirationStatus.icon}
                                {expirationStatus.label}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {contract.position} • {contract.department}
                            {contract.employeeDocument && ` • CPF: ${contract.employeeDocument}`}
                          </p>
                        </div>
                      </div>

                      {/* Alerta de Vencimento */}
                      {expirationStatus && (expirationStatus.type === 'expired' || expirationStatus.type === 'today' || expirationStatus.type === 'urgent' || expirationStatus.type === 'warning') && (
                        <Alert className={`mb-4 ${
                          expirationStatus.type === 'expired' || expirationStatus.type === 'today'
                            ? 'border-red-500 bg-red-50'
                            : expirationStatus.type === 'urgent'
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-yellow-500 bg-yellow-50'
                        }`}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <span className="font-semibold">{expirationStatus.message}</span>
                            {isExperienceContract && (
                              <span className="block mt-1 text-sm">
                                Período de experiência: {contract.experienceDuration} dias
                              </span>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Informações do Contrato */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Data Início</p>
                          <p className="font-medium">
                            {format(parseISO(contract.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                        {contract.endDate && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Data Término</p>
                            <p className="font-medium">
                              {format(parseISO(contract.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        )}
                        {contract.salary && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Salário Base</p>
                            <p className="font-medium">
                              {new Intl.NumberFormat('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                              }).format(contract.salary)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                          <p className="font-medium">{contract.status}</p>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewContract(contract.id)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Visualizar
                        </Button>
                        
                        {isExperienceContract && expirationStatus && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleRenewContract(contract.id)}
                              className="gap-1 bg-green-600 hover:bg-green-700"
                            >
                              <RefreshCcw className="h-4 w-4" />
                              Renovar/Efetivar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleFinalizeContract(contract.id)}
                              className="gap-1"
                            >
                              <X className="h-4 w-4" />
                              Finalizar
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContratosTrabalhoList;
