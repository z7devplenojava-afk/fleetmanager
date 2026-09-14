import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Truck, Car, Wrench, Shield, CheckCircle2, AlertTriangle, XCircle,
  Building2, FileText, Calendar, Search, ExternalLink, Loader2, Gauge, Clock, Eye
} from 'lucide-react';
import { fleetService } from '@/services/fleetService';
import workPostService, { WorkPost } from '@/services/workPostService';
import { contractService, Contract } from '@/services/contractService';
import { Vehicle } from '@/types/fleet';
import VehicleDetailPanel from '@/components/frota/VehicleDetailPanel';

interface ClientVehiclesTabProps {
  clientId: string;
  clientName: string;
}

const VEHICLE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ACTIVE: { label: 'Ativo', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30', icon: CheckCircle2 },
  INACTIVE: { label: 'Inativo', color: 'text-gray-400 bg-gray-500/15 border-gray-500/30', icon: XCircle },
  MAINTENANCE: { label: 'Em Manutenção', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30', icon: Wrench },
  BLOCKED: { label: 'Bloqueado', color: 'text-red-400 bg-red-500/15 border-red-500/30', icon: AlertTriangle },
  LEASED: { label: 'Alocado', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30', icon: Shield },
  OUT_OF_SERVICE: { label: 'Fora de Serviço', color: 'text-rose-400 bg-rose-500/15 border-rose-500/30', icon: XCircle },
  RESERVED: { label: 'Reservado', color: 'text-purple-400 bg-purple-500/15 border-purple-500/30', icon: Clock },
};

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  CAR: 'Passeio',
  CAR_UTILITY: 'Utilitário',
  PICKUP: 'Picape',
  SUV: 'SUV',
  VAN: 'Van',
  MINIBUS: 'Micro-ônibus',
  BUS_URBAN: 'Ônibus Urbano',
  BUS_ROAD: 'Ônibus Rodoviário',
  BUS_LUXURY_TOURISM: 'Ônibus Executivo',
  TRUCK: 'Caminhão',
  MOTORCYCLE: 'Motocicleta',
  OTHER: 'Outro',
};

export const ClientVehiclesTab: React.FC<ClientVehiclesTabProps> = ({ clientId, clientName }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allVehicles, wpData, ctData] = await Promise.all([
        fleetService.getVehicles(),
        workPostService.getWorkPostsByClient(clientId),
        contractService.getContractsByClient(clientId),
      ]);

      setWorkPosts(wpData || []);
      setContracts(ctData || []);

      const workPostIds = new Set((wpData || []).map(wp => wp.id).filter(Boolean));
      const contractIds = new Set((ctData || []).map(ct => ct.id).filter(Boolean));
      const contractNumbers = new Set((ctData || []).map(ct => ct.contractNumber?.trim().toLowerCase()).filter(Boolean));
      const normClientName = clientName?.trim().toLowerCase();

      // Filtrar veículos estritamente alocados a este cliente ou a uma de suas obras/postos/contratos
      const clientVehicles = (allVehicles || []).filter(v => {
        // 1. ID direto do cliente
        if (v.clientId && v.clientId === clientId) return true;

        // 2. Posto de Trabalho/Obra do veículo pertence aos postos deste cliente
        if (v.workPostId && workPostIds.has(v.workPostId)) return true;

        // 3. Contrato do veículo pertence aos contratos deste cliente
        if (v.contractId && contractIds.has(v.contractId)) return true;
        if (v.allocationContractNumber && contractNumbers.has(v.allocationContractNumber.trim().toLowerCase())) return true;

        // 4. Nome do cliente bate exatamente com o cliente (excluindo marcadores genéricos)
        if (v.clientName && normClientName) {
          const vClientNorm = v.clientName.trim().toLowerCase();
          const genericNames = ['cliente direto', 'a definir', 'não informado', 'sem cliente', 'geral', 'matriz'];
          if (!genericNames.includes(vClientNorm) && vClientNorm === normClientName) {
            return true;
          }
        }

        return false;
      });

      setVehicles(clientVehicles);
    } catch (error) {
      console.error('Erro ao carregar veículos alocados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os veículos alocados ao cliente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, clientName, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDetail = (v: Vehicle) => {
    setSelectedVehicle({
      id: v.id,
      placa: v.plate,
      marca: v.brand || '',
      modelo: v.model || '',
      ano: v.year || new Date().getFullYear(),
      cor: v.color,
      combustivel: v.fuelType,
      quilometragem: v.currentMileage,
      status: v.status,
      capacidade: v.capacity,
      workPostId: v.workPostId,
      insuranceExpiryDate: v.insuranceExpiryDate,
      documentationExpiryDate: v.documentationExpiryDate,
      lastMaintenanceDate: v.lastMaintenanceDate,
      nextMaintenanceDate: v.nextMaintenanceDate,
      assignedDriver: v.assignedDriver,
      location: v.location,
      observacoes: v.notes,
      vehicleType: v.vehicleType,
    });
    setIsDetailOpen(true);
  };

  const filteredVehicles = vehicles.filter(v => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      v.plate?.toLowerCase().includes(term) ||
      v.brand?.toLowerCase().includes(term) ||
      v.model?.toLowerCase().includes(term) ||
      v.fleetNumber?.toLowerCase().includes(term)
    );
  });

  const getWorkPostName = (workPostId?: string) => {
    if (!workPostId) return null;
    const post = workPosts.find(p => p.id === workPostId);
    return post ? post.name : null;
  };

  const getContractNumber = (contractId?: string, allocationContractNumber?: string) => {
    if (allocationContractNumber) return allocationContractNumber;
    if (!contractId) return null;
    const contract = contracts.find(c => c.id === contractId);
    return contract ? contract.contractNumber : contractId;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-seguranca-yellow animate-spin" />
        <span className="ml-2 text-gray-400 text-sm">Carregando veículos alocados...</span>
      </div>
    );
  }

  const activeCount = vehicles.filter(v => v.status === 'ACTIVE' || v.status === 'LEASED').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'MAINTENANCE').length;

  return (
    <div className="space-y-4">
      {/* Header & Métricas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Truck size={18} className="text-seguranca-yellow" />
            Veículos Alocados
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {vehicles.length > 0 
              ? `${vehicles.length} veículo${vehicles.length !== 1 ? 's' : ''} alocado${vehicles.length !== 1 ? 's' : ''} para ${clientName} e suas obras`
              : `Nenhum veículo alocado para ${clientName}`
            }
          </p>
        </div>

        {/* Badges de Resumo */}
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs px-3 py-1">
            <CheckCircle2 size={12} className="mr-1" /> {activeCount} Ativo{activeCount !== 1 ? 's' : ''}
          </Badge>
          {maintenanceCount > 0 && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs px-3 py-1">
              <Wrench size={12} className="mr-1" /> {maintenanceCount} Manutenção
            </Badge>
          )}
        </div>
      </div>

      {/* Barra de Busca */}
      {vehicles.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por placa, modelo, marca ou número da frota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-seguranca-black border-gray-700 text-white text-sm"
          />
        </div>
      )}

      {/* Lista de Veículos */}
      {vehicles.length === 0 ? (
        <Card className="bg-seguranca-graphite border-gray-700 p-8 text-center">
          <Truck className="mx-auto mb-3 text-seguranca-yellow/70" size={40} />
          <h4 className="text-gray-200 font-bold text-base mb-1">Este cliente ainda não possui veículos alocados.</h4>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Para alocar veículos a <strong className="text-seguranca-yellow">{clientName}</strong>, acesse a gestão de frota ou atribua uma obra/posto ao veículo.
          </p>
        </Card>
      ) : filteredVehicles.length === 0 ? (
        <Card className="bg-seguranca-graphite border-gray-700 p-6 text-center">
          <p className="text-gray-400">Nenhum veículo encontrado para o termo pesquisado.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredVehicles.map(vehicle => {
            const stCfg = VEHICLE_STATUS_CONFIG[vehicle.status] || VEHICLE_STATUS_CONFIG.ACTIVE;
            const StatusIcon = stCfg.icon;
            const workPostName = getWorkPostName(vehicle.workPostId);
            const contractNum = getContractNumber(vehicle.contractId, vehicle.allocationContractNumber);
            const startDateFormatted = formatDate(vehicle.allocationStartDate);
            const endDateFormatted = formatDate(vehicle.allocationEndDate);

            return (
              <Card
                key={vehicle.id}
                className="bg-seguranca-graphite border-gray-700 p-4 hover:border-seguranca-yellow transition-all cursor-pointer group"
                onClick={() => handleOpenDetail(vehicle)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Info Principal */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-seguranca-yellow/10 flex items-center justify-center flex-shrink-0 group-hover:bg-seguranca-yellow/20 transition-colors">
                      {vehicle.vehicleType === 'MOTORCYCLE' ? (
                        <Car className="text-seguranca-yellow" size={20} />
                      ) : (
                        <Truck className="text-seguranca-yellow" size={20} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-base uppercase font-mono group-hover:text-seguranca-yellow transition-colors">
                          {vehicle.plate}
                        </span>
                        {vehicle.fleetNumber && (
                          <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-300 font-mono">
                            Prefix: {vehicle.fleetNumber}
                          </Badge>
                        )}
                        <Badge className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${stCfg.color}`}>
                          <StatusIcon size={10} className="mr-1" /> {stCfg.label}
                        </Badge>
                      </div>

                      <p className="text-gray-300 text-sm font-medium mt-0.5">
                        {vehicle.brand} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
                        {vehicle.vehicleType && (
                          <span className="text-xs text-gray-400 font-normal ml-2">
                            • {VEHICLE_TYPE_LABELS[vehicle.vehicleType] || vehicle.vehicleType}
                          </span>
                        )}
                      </p>

                      {/* Obra / Posto Alocado */}
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-2 flex-wrap">
                        {workPostName ? (
                          <span className="flex items-center gap-1 text-seguranca-yellow font-medium">
                            <Building2 size={12} /> Obra/Posto: {workPostName}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400">
                            <Building2 size={12} /> Cliente Direto
                          </span>
                        )}

                        {contractNum && (
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <FileText size={12} /> Contrato: {contractNum}
                          </span>
                        )}

                        {(startDateFormatted || endDateFormatted) && (
                          <span className="flex items-center gap-1 text-gray-400">
                            <Calendar size={12} /> Alocação: {startDateFormatted || '—'} {endDateFormatted ? `até ${endDateFormatted}` : ''}
                          </span>
                        )}

                        {vehicle.currentMileage > 0 && (
                          <span className="flex items-center gap-1 text-gray-400">
                            <Gauge size={12} /> {vehicle.currentMileage.toLocaleString('pt-BR')} KM
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 sm:self-center flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetail(vehicle)}
                      className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                      title="Ver detalhes completos do veículo"
                    >
                      <Eye size={14} />
                      Ver Veículo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/frota')}
                      className="text-gray-400 hover:text-white hover:bg-seguranca-graphite text-xs flex items-center gap-1"
                      title="Abrir página de Gestão da Frota"
                    >
                      <ExternalLink size={12} />
                      Ir para Frota
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes do Veículo */}
      {selectedVehicle && (
        <VehicleDetailPanel
          veiculo={selectedVehicle}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      )}
    </div>
  );
};

export default ClientVehiclesTab;

