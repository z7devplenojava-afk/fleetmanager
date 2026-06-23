import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGSAP } from '@/hooks/use-gsap';
import { Search, Plus, RefreshCw, Users, CheckCircle2, XCircle } from 'lucide-react';
import { passengerService } from '@/services/passengerService';
import type { Passenger } from '@/types/passenger';
import { useAuth } from '@/contexts/AuthContext';

const PassengerManagement: React.FC = () => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  useGSAP();

  // Load passengers
  const loadPassengers = async () => {
    if (!user?.companyId) return;
    
    setIsLoading(true);
    try {
      const data = await passengerService.getActivePassengers(user.companyId);
      setPassengers(data);
    } catch (error: any) {
      console.error("Error loading passengers:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao carregar passageiros",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load passengers on mount
  useEffect(() => {
    loadPassengers();
  }, [user?.companyId]);

  // Filter passengers
  const filteredPassengers = passengers.filter(passenger =>
    passenger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passenger.registration.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <StandardLayout title="Gerenciamento de Passageiros">
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Passageiros</h1>
            <p className="text-muted-foreground">Controle de passageiros, embarques e desembarques</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadPassengers} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Passageiro
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nome ou matrícula..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Passengers Table */}
        <Card>
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Centro de Custo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPassengers.map((passenger) => (
                    <TableRow key={passenger.id}>
                      <TableCell className="font-medium">{passenger.registration}</TableCell>
                      <TableCell>{passenger.name}</TableCell>
                      <TableCell>{passenger.shift || '-'}</TableCell>
                      <TableCell>{passenger.costCenter || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={passenger.active ? 'default' : 'secondary'}>
                          {passenger.active ? (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          ) : (
                            <XCircle className="mr-1 h-3 w-3" />
                          )}
                          {passenger.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Editar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPassengers.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        Nenhum passageiro encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Dashboard Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Passageiros</p>
                <p className="text-2xl font-bold">{passengers.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{passengers.filter(p => p.active).length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inativos</p>
                <p className="text-2xl font-bold">{passengers.filter(p => !p.active).length}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </StandardLayout>
  );
};

export default PassengerManagement;
