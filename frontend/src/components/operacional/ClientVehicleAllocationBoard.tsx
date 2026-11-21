import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bus,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  MapPin,
  RefreshCw,
  Search,
  Truck,
  UserRound,
  Users,
  HardHat,
  Plus,
  Palette,
  Edit2,
  Building2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import fleetService from '@/services/fleetService';
import clientService, { Client } from '@/services/clientService';
import driverService, { Driver } from '@/services/driverService';
import workPostService, { WorkPost } from '@/services/workPostService';
import SearchableSelect, { SearchableOption } from '@/components/frota/SearchableSelect';
import { Vehicle } from '@/types/fleet';

interface ClientBoardColumn {
  id: string;
  name: string;
  clientId: string | null;
  location?: string;
  vehicles: Vehicle[];
}

type DragPayload =
  | { kind: 'vehicle'; vehicleId: string }
  | { kind: 'driver'; driverId?: string; driverName: string; sourceVehicleId?: string };

const UNALLOCATED_ID = '__unallocated__';
const CLIENT_COLORS_STORAGE_KEY = 'fluxbus_client_colors_v1';
const normalize = (value?: string) => (value || '').trim().toLocaleLowerCase();
const isMissingOperationsEndpoint = (error: any) => error?.response?.status === 404;

// Paleta de 10 cores distintas e harmoniosas para os clientes
export const CLIENT_COLOR_PALETTES = [
  {
    id: 'blue',
    name: 'Azul',
    border: 'border-blue-500',
    headerBg: 'bg-blue-50/90 dark:bg-blue-950/40',
    topBar: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    cardBorder: 'border-l-4 border-l-blue-500',
    dot: '#3b82f6'
  },
  {
    id: 'emerald',
    name: 'Esmeralda / Verde',
    border: 'border-emerald-500',
    headerBg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
    topBar: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    cardBorder: 'border-l-4 border-l-emerald-500',
    dot: '#10b981'
  },
  {
    id: 'amber',
    name: 'Âmbar / Dourado',
    border: 'border-amber-500',
    headerBg: 'bg-amber-50/90 dark:bg-amber-950/40',
    topBar: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    cardBorder: 'border-l-4 border-l-amber-500',
    dot: '#f59e0b'
  },
  {
    id: 'purple',
    name: 'Púrpura / Roxo',
    border: 'border-purple-500',
    headerBg: 'bg-purple-50/90 dark:bg-purple-950/40',
    topBar: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    iconColor: 'text-purple-600 dark:text-purple-400',
    cardBorder: 'border-l-4 border-l-purple-500',
    dot: '#a855f7'
  },
  {
    id: 'rose',
    name: 'Rosa / Carmim',
    border: 'border-rose-500',
    headerBg: 'bg-rose-50/90 dark:bg-rose-950/40',
    topBar: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    iconColor: 'text-rose-600 dark:text-rose-400',
    cardBorder: 'border-l-4 border-l-rose-500',
    dot: '#f43f5e'
  },
  {
    id: 'cyan',
    name: 'Ciano',
    border: 'border-cyan-500',
    headerBg: 'bg-cyan-50/90 dark:bg-cyan-950/40',
    topBar: 'bg-cyan-500',
    badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    cardBorder: 'border-l-4 border-l-cyan-500',
    dot: '#06b6d4'
  },
  {
    id: 'indigo',
    name: 'Índigo',
    border: 'border-indigo-500',
    headerBg: 'bg-indigo-50/90 dark:bg-indigo-950/40',
    topBar: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    cardBorder: 'border-l-4 border-l-indigo-500',
    dot: '#6366f1'
  },
  {
    id: 'teal',
    name: 'Teal / Turquesa',
    border: 'border-teal-500',
    headerBg: 'bg-teal-50/90 dark:bg-teal-950/40',
    topBar: 'bg-teal-500',
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    iconColor: 'text-teal-600 dark:text-teal-400',
    cardBorder: 'border-l-4 border-l-teal-500',
    dot: '#14b8a6'
  },
  {
    id: 'orange',
    name: 'Laranja Solar',
    border: 'border-orange-500',
    headerBg: 'bg-orange-50/90 dark:bg-orange-950/40',
    topBar: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300 border-orange-300 dark:border-orange-800',
    iconColor: 'text-orange-600 dark:text-orange-400',
    cardBorder: 'border-l-4 border-l-orange-500',
    dot: '#f97316'
  },
  {
    id: 'slate',
    name: 'Grafite Neutro',
    border: 'border-slate-500',
    headerBg: 'bg-slate-100/90 dark:bg-slate-900/40',
    topBar: 'bg-slate-500',
    badge: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600',
    iconColor: 'text-slate-600 dark:text-slate-400',
    cardBorder: 'border-l-4 border-l-slate-400',
    dot: '#64748b'
  }
];

export const ClientVehicleAllocationBoard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const responsibleName = (user as any)?.fullName || (user as any)?.name || 'Usuário operacional';
  const [allocationNotice, setAllocationNotice] = useState<{ title: string; description: string } | null>(null);

  const notifyAllocationConflict = (title: string, description: string) => {
    setAllocationNotice({ title, description });
    toast({ title, description, variant: 'destructive' });
  };

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [driversExpanded, setDriversExpanded] = useState(false);
  const [pendingVehicle, setPendingVehicle] = useState<string | null>(null);

  // Mapeamento de cores personalizadas por cliente
  const [clientColorMap, setClientColorMap] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(CLIENT_COLORS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Drag & Drop states
  const [draggedVehicleId, setDraggedVehicleId] = useState<string | null>(null);
  const [draggedDriverId, setDraggedDriverId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [dragOverVehicleId, setDragOverVehicleId] = useState<string | null>(null);

  // Modal de Alocação Manual (Clicar e Adicionar Veículo, Motorista e Obra ao Cliente)
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [selectedColumnForAllocation, setSelectedColumnForAllocation] = useState<ClientBoardColumn | null>(null);
  const [modalVehicleId, setModalVehicleId] = useState<string>('');
  const [modalDriverName, setModalDriverName] = useState<string>('');
  const [modalObraName, setModalObraName] = useState<string>('');
  const [savingAllocation, setSavingAllocation] = useState(false);

  // Salvar cor do cliente no localStorage
  const handleSetClientColor = (clientIdOrName: string, paletteId: string) => {
    const updated = { ...clientColorMap, [clientIdOrName]: paletteId };
    setClientColorMap(updated);
    try {
      localStorage.setItem(CLIENT_COLORS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignorar falha de localStorage
    }
    toast({
      title: 'Cor do cliente atualizada',
      description: 'A identificação visual foi salva com sucesso.'
    });
  };

  // Carregar dados do quadro de forma ultrarrápida e resiliente
  const loadBoard = useCallback(async () => {
    setLoading(true);
    try {
      const [vehicleResult, clientResult, driverResult] = await Promise.allSettled([
        fleetService.getVehicles(false),
        clientService.getAllClients(),
        driverService.getDrivers()
      ]);

      setVehicles(vehicleResult.status === 'fulfilled' && Array.isArray(vehicleResult.value) ? vehicleResult.value : []);
      setClients(clientResult.status === 'fulfilled' && Array.isArray(clientResult.value) ? clientResult.value : []);
      setDrivers(driverResult.status === 'fulfilled' && Array.isArray(driverResult.value) ? driverResult.value : []);

      if (vehicleResult.status === 'rejected') {
        toast({
          title: 'Não foi possível carregar os veículos',
          description: 'A lista de alocação precisa da frota para ser exibida.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Erro ao carregar quadro de alocação:', err);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    if (!allocationModalOpen || !selectedColumnForAllocation?.clientId) {
      setWorkPosts([]);
      return;
    }

    let active = true;
    const clientId = selectedColumnForAllocation.clientId;
    const clientName = selectedColumnForAllocation.name;
    setWorkPosts([]);
    workPostService.getWorkPostsByClient(clientId)
      .then((posts) => {
        if (!active) return;
        const clientPosts = Array.isArray(posts) ? posts.filter((post) => {
          if (post.clientId) return String(post.clientId) === String(clientId);
          return normalize(post.clientName) === normalize(clientName);
        }) : [];
        setWorkPosts(clientPosts);
      })
      .catch(() => {
        if (active) setWorkPosts([]);
      });

    return () => { active = false; };
  }, [allocationModalOpen, selectedColumnForAllocation?.clientId, selectedColumnForAllocation?.name]);

  // Colunas por Cliente
  const clientColumns = useMemo<ClientBoardColumn[]>(() => {
    const columns = new Map<string, ClientBoardColumn>();
    clients.forEach((client) => {
      columns.set(client.id, {
        id: client.id,
        clientId: client.id,
        name: client.name,
        location: client.address,
        vehicles: []
      });
    });

    vehicles.forEach((vehicle) => {
      const clientName = (vehicle as any).clientName || vehicle.projectName || (vehicle as any).workPostName || (vehicle as any).postoDeTrabalho;
      const clientId = vehicle.clientId ? String(vehicle.clientId) : '';
      let column = clientId ? columns.get(clientId) : undefined;

      if (!column && clientName) {
        const matched = [...columns.values()].find((candidate) => normalize(candidate.name) === normalize(clientName));
        column = matched;
        if (!column) {
          const id = clientId || `name:${normalize(clientName)}`;
          column = { id, clientId: clientId || null, name: clientName, vehicles: [] };
          columns.set(id, column);
        }
      }

      if (!column) {
        column = columns.get(UNALLOCATED_ID);
        if (!column) {
          column = { id: UNALLOCATED_ID, clientId: null, name: 'Sem cliente / garagem', vehicles: [] };
          columns.set(UNALLOCATED_ID, column);
        }
      }
      column.vehicles.push(vehicle);
    });

    return [...columns.values()]
      .filter((column) => column.vehicles.length > 0 || column.clientId !== null)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [clients, vehicles]);

  // Obter paleta de cor do cliente
  const getClientPalette = useCallback(
    (column: ClientBoardColumn) => {
      if (column.id === UNALLOCATED_ID) {
        return CLIENT_COLOR_PALETTES[CLIENT_COLOR_PALETTES.length - 1]; // Slate
      }
      const key = column.clientId || column.id || column.name;
      const customId = clientColorMap[key] || clientColorMap[column.name];
      if (customId) {
        const found = CLIENT_COLOR_PALETTES.find((p) => p.id === customId);
        if (found) return found;
      }
      // Cor determinística baseada no nome
      let hash = 0;
      for (let i = 0; i < column.name.length; i++) {
        hash = column.name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % (CLIENT_COLOR_PALETTES.length - 1);
      return CLIENT_COLOR_PALETTES[index];
    },
    [clientColorMap]
  );

  // Colunas filtradas por busca
  const visibleColumns = useMemo(() => {
    const term = normalize(search);
    if (!term) return clientColumns;
    return clientColumns
      .map((column) => ({
        ...column,
        vehicles: column.vehicles.filter((vehicle) =>
          [
            vehicle.plate,
            vehicle.fleetNumber,
            vehicle.model,
            vehicle.brand,
            vehicle.assignedDriver,
            (vehicle as any).driverName,
            vehicle.projectName,
            (vehicle as any).workPostName,
            vehicle.location,
            column.name
          ].some((value) => normalize(String(value || '')).includes(term))
        )
      }))
      .filter((column) => column.vehicles.length > 0 || normalize(column.name).includes(term));
  }, [clientColumns, search]);

  // Motoristas disponíveis
  const assignedDriverNames = useMemo(
    () => new Set(vehicles.map((vehicle) => normalize(vehicle.assignedDriver)).filter(Boolean)),
    [vehicles]
  );
  const unassignedActiveDrivers = useMemo(
    () => drivers.filter((driver) => driver.status !== 'INATIVO' && !assignedDriverNames.has(normalize(driver.name))),
    [drivers, assignedDriverNames]
  );
  const unidentifiedDriversCount = unassignedActiveDrivers.filter((driver) =>
    /^funcion[aá]rio\s+\d{3}[.\s]/i.test(driver.name?.trim() || '')
  ).length;
  const availableDrivers = unassignedActiveDrivers.filter(
    (driver) => !/^funcion[aá]rio\s+\d{3}[.\s]/i.test(driver.name?.trim() || '')
  );
  const visibleAvailableDrivers = useMemo(() => {
    const query = normalize(driverSearch);
    const matching = query
      ? availableDrivers.filter((driver) => normalize(driver.name).includes(query))
      : availableDrivers;
    return driversExpanded || query ? matching : matching.slice(0, 8);
  }, [availableDrivers, driverSearch, driversExpanded]);

  // Persistir alocação completa de veículo (com cliente, motorista e obra/setor)
  const persistAllocation = async (
    vehicle: Vehicle,
    column: ClientBoardColumn,
    driverName?: string,
    obraName?: string
  ) => {
    if (pendingVehicle) return;
    const oldClientName =
      (vehicle as any).clientName || vehicle.projectName || (vehicle as any).workPostName || 'Sem cliente / garagem';
    const oldDriver = vehicle.assignedDriver || latestDriverByVehicle.get(vehicle.id) || '';
    const oldObra = vehicle.projectName || (vehicle as any).workPostName || vehicle.location || '';

    const movingClient = normalize(oldClientName) !== normalize(column.name);
    const movingDriver = Boolean(driverName && normalize(oldDriver) !== normalize(driverName));
    const movingObra = Boolean(obraName !== undefined && normalize(oldObra) !== normalize(obraName));

    if (!movingClient && !movingDriver && !movingObra) {
      notifyAllocationConflict(
        driverName && normalize(driverName) === normalize(oldDriver)
          ? 'Motorista já está alocado ao cliente'
          : 'Veículo já alocado ao cliente',
        driverName && normalize(driverName) === normalize(oldDriver)
          ? `${driverName} já está atribuído a este cliente ou setor.`
          : `${vehicle.plate} já está alocado a ${column.name}.`
      );
      return;
    }

    setPendingVehicle(vehicle.id);
    try {
      const changeParts = [
        movingClient ? `Cliente: ${oldClientName} → ${column.name}` : '',
        movingDriver ? `Motorista: ${oldDriver || 'não informado'} → ${driverName}` : '',
        movingObra ? `Obra/Setor: ${oldObra || 'não informada'} → ${obraName}` : ''
      ].filter(Boolean);

      const destinationLocation = obraName
        ? obraName.trim()
        : column.id === UNALLOCATED_ID
        ? vehicle.garageName || vehicle.location || ''
        : column.location || `Cliente ${column.name}`;

      const finalDriver = movingDriver ? driverName : vehicle.assignedDriver;
      const finalProjectName = obraName !== undefined ? obraName.trim() : (vehicle.projectName || destinationLocation);
      let historyAvailable = true;

      try {
        await api.post(`/api/vehicle-operations/${vehicle.id}/movements`, {
          destinationClientId: column.clientId,
          destinationClientName: column.name,
          destinationLocation,
          destinationProjectName: finalProjectName,
          status: vehicle.status,
          driverName: finalDriver,
          reason: `Atualização pelo quadro de alocação: ${changeParts.join(' · ')}`,
          responsibleName
        });
      } catch (error: any) {
        if (!isMissingOperationsEndpoint(error)) throw error;
        // Compatibilidade enquanto o backend ainda não publicou /vehicle-operations.
        await fleetService.updateVehicle(vehicle.id, {
          ...vehicle,
          clientId: column.clientId || undefined,
          clientName: column.name,
          location: destinationLocation,
          projectName: finalProjectName,
          assignedDriver: finalDriver
        });
        historyAvailable = false;
      }

      toast({
        title: 'Alocação salva com sucesso',
        description: `${vehicle.plate} · ${changeParts.join(' · ')}${historyAvailable ? '' : ' · Atualize o backend para registrar o histórico operacional.'}`
      });

      fleetService.invalidateVehiclesCache();
      await loadBoard();
    } catch (error: any) {
      toast({
        title: 'Não foi possível salvar a movimentação',
        description: error?.response?.data?.message || error?.message || 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setPendingVehicle(null);
      setDraggedVehicleId(null);
      setDraggedDriverId(null);
      setDragOverColumnId(null);
      setDragOverVehicleId(null);
    }
  };

  // Persistir motorista diretamente
  const persistDriverAssignment = async (targetVehicle: Vehicle, driverName: string, sourceVehicleId?: string) => {
    if (!driverName.trim() || pendingVehicle) return;
    if (sourceVehicleId === targetVehicle.id || normalize(targetVehicle.assignedDriver) === normalize(driverName)) {
      notifyAllocationConflict('Motorista já está alocado ao cliente', `${driverName} já está atribuído a ${targetVehicle.plate}.`);
      return;
    }

    setPendingVehicle(targetVehicle.id);
    try {
      let historyAvailable = true;
      try {
        await api.post('/api/vehicle-operations/driver-assignments', {
          sourceVehicleId: sourceVehicleId || null,
          targetVehicleId: targetVehicle.id,
          driverName: driverName.trim(),
          responsibleName
        });
      } catch (error: any) {
        if (!isMissingOperationsEndpoint(error)) throw error;
        const sourceVehicle = sourceVehicleId ? vehicles.find((vehicle) => vehicle.id === sourceVehicleId) : undefined;
        await fleetService.updateVehicle(targetVehicle.id, { ...targetVehicle, assignedDriver: driverName.trim() });
        if (sourceVehicle) await fleetService.updateVehicle(sourceVehicle.id, { ...sourceVehicle, assignedDriver: '' });
        historyAvailable = false;
      }
      toast({
        title: 'Motorista atribuído',
        description: `${driverName} → ${targetVehicle.plate}${historyAvailable ? '' : ' · Atualize o backend para registrar o histórico operacional.'}`
      });
      fleetService.invalidateVehiclesCache();
      await loadBoard();
    } catch (error: any) {
      toast({
        title: 'Não foi possível salvar o motorista',
        description: error?.response?.data?.message || error?.message || 'Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setPendingVehicle(null);
      setDraggedDriverId(null);
      setDragOverVehicleId(null);
    }
  };

  // Drag and drop handlers
  const dragPayload = (event: React.DragEvent): DragPayload | null => {
    try {
      return JSON.parse(event.dataTransfer.getData('application/json')) as DragPayload;
    } catch {
      return null;
    }
  };

  const onDropColumn = (event: React.DragEvent, column: ClientBoardColumn) => {
    event.preventDefault();
    const payload = dragPayload(event);
    setDragOverColumnId(null);
    if (payload?.kind === 'vehicle') {
      const vehicle = vehicles.find((item) => item.id === payload.vehicleId);
      if (vehicle && column.vehicles.some((item) => item.id === vehicle.id)) {
        notifyAllocationConflict('Veículo já alocado ao cliente', `${vehicle.plate} já está alocado a ${column.name}.`);
        return;
      }
      if (vehicle) void persistAllocation(vehicle, column);
      return;
    }
    if (payload?.kind !== 'driver' || !column.clientId) return;

    const allClientVehicles = clientColumns.find((item) => item.id === column.id)?.vehicles || column.vehicles;
    const driverAlreadyAtClient = allClientVehicles.some((vehicle) =>
      normalize(vehicle.assignedDriver || latestDriverByVehicle.get(vehicle.id)) === normalize(payload.driverName)
    );
    if (driverAlreadyAtClient) {
      notifyAllocationConflict('Motorista já está alocado ao cliente', `${payload.driverName} já está atribuído a ${column.name}.`);
      return;
    }

    // Soltar no quadro do cliente atribui a um veículo sem motorista; quando
    // não há um destino inequívoco, abre o modal já com o motorista escolhido.
    const unassignedVehicles = column.vehicles.filter((vehicle) =>
      !normalize(vehicle.assignedDriver || latestDriverByVehicle.get(vehicle.id))
    );
    if (unassignedVehicles.length === 1) {
      void persistAllocation(unassignedVehicles[0], column, payload.driverName);
      return;
    }

    setSelectedColumnForAllocation(column);
    setModalVehicleId('');
    setModalDriverName(payload.driverName);
    setModalObraName(column.name);
    setAllocationModalOpen(true);
  };

  const onDropVehicle = (event: React.DragEvent, vehicle: Vehicle, column: ClientBoardColumn) => {
    event.preventDefault();
    event.stopPropagation();
    const payload = dragPayload(event);
    const allClientVehicles = clientColumns.find((item) => item.id === column.id)?.vehicles || column.vehicles;

    if (payload?.kind === 'vehicle') {
      const sourceVehicle = vehicles.find((item) => item.id === payload.vehicleId);
      if (!sourceVehicle) return;
      if (allClientVehicles.some((item) => item.id === sourceVehicle.id)) {
        notifyAllocationConflict('Veículo já alocado ao cliente', `${sourceVehicle.plate} já está alocado a ${column.name}.`);
        return;
      }
      void persistAllocation(sourceVehicle, column);
      return;
    }

    if (payload?.kind !== 'driver') return;
    const targetDriverName = vehicle.assignedDriver || latestDriverByVehicle.get(vehicle.id) || '';
    if (normalize(targetDriverName) === normalize(payload.driverName)) {
      notifyAllocationConflict('Motorista já está alocado ao cliente', `${payload.driverName} já está atribuído ao veículo ${vehicle.plate} em ${column.name}.`);
      return;
    }

    const driverAlreadyAtClient = allClientVehicles.some((item) =>
      normalize(item.assignedDriver || latestDriverByVehicle.get(item.id)) === normalize(payload.driverName)
    );
    if (driverAlreadyAtClient) {
      notifyAllocationConflict('Motorista já está alocado ao cliente', `${payload.driverName} já está atribuído a ${column.name}.`);
      return;
    }

    if (targetDriverName) {
      notifyAllocationConflict('Veículo já alocado ao cliente', `${vehicle.plate} já está em ${column.name} com ${targetDriverName}. Use “Editar” no card para trocar o motorista.`);
      return;
    }
    void persistDriverAssignment(vehicle, payload.driverName, payload.sourceVehicleId);
  };

  // Abrir modal de alocação por clique
  const handleOpenAddModal = (column: ClientBoardColumn, existingVehicle?: Vehicle) => {
    setSelectedColumnForAllocation(column);
    if (existingVehicle) {
      setModalVehicleId(existingVehicle.id);
      setModalDriverName(existingVehicle.assignedDriver || (existingVehicle as any).driverName || '');
      setModalObraName(
        existingVehicle.projectName ||
        (existingVehicle as any).workPostName ||
        existingVehicle.location ||
        column.location ||
        ''
      );
    } else {
      setModalVehicleId('');
      setModalDriverName('');
      setModalObraName(column.name);
    }

    setAllocationModalOpen(true);
  };

  // Confirmar modal de alocação
  const handleConfirmModalAllocation = async () => {
    if (!selectedColumnForAllocation || !modalVehicleId) {
      toast({
        title: 'Veículo obrigatório',
        description: 'Selecione o veículo que deseja alocar a este cliente.',
        variant: 'destructive'
      });
      return;
    }

    const vehicle = vehicles.find((v) => v.id === modalVehicleId);
    if (!vehicle) return;

    setSavingAllocation(true);
    try {
      await persistAllocation(
        vehicle,
        selectedColumnForAllocation,
        modalDriverName.trim() || undefined,
        modalObraName.trim() || undefined
      );
      setAllocationModalOpen(false);
    } finally {
      setSavingAllocation(false);
    }
  };

  // Lista de postos e obras sugeridas para o cliente selecionado no modal
  const suggestedObras = useMemo(() => {
    if (!selectedColumnForAllocation) return [];
    const clientPosts = workPosts.filter(
      (wp) => {
        if (wp.clientId && selectedColumnForAllocation.clientId) {
          return String(wp.clientId) === String(selectedColumnForAllocation.clientId);
        }
        return normalize(wp.clientName) === normalize(selectedColumnForAllocation.name);
      }
    );
    const names = new Set<string>();
    clientPosts.forEach((p) => {
      if (p.name) names.add(p.name);
    });
    selectedColumnForAllocation.vehicles.forEach((vehicle) => {
      const vehicleClientId = (vehicle as any).clientId;
      if (selectedColumnForAllocation.clientId && vehicleClientId &&
          String(vehicleClientId) !== String(selectedColumnForAllocation.clientId)) return;
      const assignedWorkPost = vehicle.projectName || (vehicle as any).workPostName;
      if (assignedWorkPost) names.add(assignedWorkPost);
    });
    // Sem obra/posto cadastrado, usa o cliente selecionado como setor padrão.
    if (names.size === 0) names.add(selectedColumnForAllocation.name);
    return Array.from(names);
  }, [selectedColumnForAllocation, workPosts]);

  // Opções de Veículos para o SearchableSelect (com filtro de 3 caracteres)
  const vehicleOptions = useMemo<SearchableOption[]>(() => {
    return vehicles.map((v) => {
      const curClient = (v as any).clientName || v.projectName || 'Sem cliente / garagem';
      const fleetStr = v.fleetNumber ? `Frota ${v.fleetNumber}` : '';
      return {
        value: v.id,
        label: `${v.plate} ${fleetStr ? `(${fleetStr})` : ''} - ${v.model || v.brand || 'Veículo'}`.trim(),
        subtitle: `Cliente atual: ${curClient}`,
        badge: v.fleetNumber ? `Frota ${v.fleetNumber}` : undefined,
        keywords: [
          v.plate,
          v.fleetNumber || '',
          v.model || '',
          v.brand || '',
          curClient,
          (v as any).chassi || '',
          (v as any).renavam || ''
        ].filter(Boolean)
      };
    });
  }, [vehicles]);

  // Opções de Motoristas para o SearchableSelect (com filtro de 3 caracteres)
  const driverOptions = useMemo<SearchableOption[]>(() => {
    return drivers
      .filter((d) => d.status !== 'INATIVO' && d.name)
      .map((d) => ({
        value: d.name,
        label: d.name,
        subtitle: d.cpf ? `CPF: ${d.cpf}` : (d.position || 'Motorista'),
        badge: d.status || undefined,
        keywords: [d.name, d.cpf || '', d.cnh || '', d.position || ''].filter(Boolean)
      }));
  }, [drivers]);

  // Opções de Obras / Setores para o SearchableSelect (com filtro de 3 caracteres + digitação livre)
  const obraOptions = useMemo<SearchableOption[]>(() => {
    const names = new Set<string>();
    suggestedObras.forEach((o) => names.add(o));
    return Array.from(names)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((name) => ({
        value: name,
        label: name,
        subtitle: 'Posto / Obra operacional cadastrada',
        keywords: [name]
      }));
  }, [suggestedObras]);

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <CardHeader className="gap-4 border-b border-slate-200 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/70 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base text-slate-900 dark:text-white sm:text-lg">
                Alocação de Veículos, Motoristas e Obras por Cliente
              </CardTitle>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Cada cliente possui sua cor de identificação. Clique em <b>"+ Alocar"</b> no cliente ou arraste veículos e motoristas diretamente.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente, placa, frota ou obra..."
                className="h-9 border-slate-300 bg-white pl-9 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadBoard()}
              disabled={loading || !!pendingVehicle}
              className="h-9"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className="border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300">
            {vehicles.length} veículos cadastrados
          </Badge>
          <Badge variant="outline" className="border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300">
            {clientColumns.filter((column) => column.id !== UNALLOCATED_ID).length} clientes operacionais
          </Badge>
          <Badge variant="outline" className="border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300">
            {availableDrivers.length} motoristas disponíveis
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4 sm:p-5">
        {allocationNotice && (
          <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-rose-950 shadow-sm dark:border-rose-500/40 dark:bg-rose-950/40 dark:text-rose-100">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-600 dark:bg-rose-400" />
              <div className="min-w-0">
                <p className="text-sm font-bold">{allocationNotice.title}</p>
                <p className="mt-0.5 text-sm opacity-90">{allocationNotice.description}</p>
              </div>
            </div>
            <button type="button" onClick={() => setAllocationNotice(null)} aria-label="Fechar aviso" className="rounded-md p-1 opacity-70 hover:bg-rose-100 hover:opacity-100 dark:hover:bg-rose-900/60">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Faixa de Motoristas Disponíveis */}
        {unassignedActiveDrivers.length > 0 && (
          <section className="overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-slate-950">
            <div className="flex flex-col gap-3 border-b border-indigo-100 px-3 py-3 dark:border-indigo-500/15 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
                  <Users className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Motoristas disponíveis</h3>
                    <Badge variant="outline" className="border-indigo-200 bg-white/70 text-indigo-800 dark:border-indigo-500/30 dark:bg-slate-900 dark:text-indigo-200">
                      {availableDrivers.length}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                    Arraste um motorista até o veículo para atribuí-lo, ou use o botão <b>"+ Alocar"</b> no cliente.
                  </p>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-2 sm:w-auto">
                <div className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={driverSearch}
                    onChange={(event) => {
                      setDriverSearch(event.target.value);
                      if (event.target.value) setDriversExpanded(true);
                    }}
                    placeholder="Buscar motorista..."
                    className="h-8 border-indigo-200 bg-white/80 pl-8 text-xs dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                {!driverSearch && availableDrivers.length > 8 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDriversExpanded((expanded) => !expanded)}
                    className="h-8 shrink-0 px-2 text-xs text-indigo-800 dark:text-indigo-200"
                  >
                    {driversExpanded ? (
                      <>
                        Recolher <ChevronUp className="ml-1 h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        Ver todos <ChevronDown className="ml-1 h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="p-3 sm:p-4">
              {unidentifiedDriversCount > 0 && (
                <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                  {unidentifiedDriversCount} cadastro{unidentifiedDriversCount === 1 ? '' : 's'} de funcionários sem nome identificável foram separados.
                </p>
              )}
              {visibleAvailableDrivers.length ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {visibleAvailableDrivers.map((driver) => (
                    <div
                      key={driver.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData(
                          'application/json',
                          JSON.stringify({ kind: 'driver', driverId: driver.id, driverName: driver.name } satisfies DragPayload)
                        );
                        event.dataTransfer.effectAllowed = 'move';
                        setDraggedDriverId(driver.id);
                      }}
                      onDragEnd={() => setDraggedDriverId(null)}
                      title="Arraste até um veículo ou cliente para atribuir"
                      className={`flex min-w-0 cursor-grab items-center gap-2 rounded-lg border border-indigo-100 bg-white px-3 py-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow active:cursor-grabbing dark:border-slate-800 dark:bg-slate-900 ${
                        draggedDriverId === driver.id ? 'opacity-50' : ''
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
                        <UserRound className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                        {driver.name}
                      </span>
                      <GripVertical className="h-4 w-4 shrink-0 text-slate-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-indigo-200 px-3 py-5 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  {driverSearch ? 'Nenhum motorista encontrado.' : 'Nenhum motorista disponível no momento.'}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Quadro Kanban de Clientes */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
            ))}
          </div>
        ) : visibleColumns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Nenhum cliente ou veículo encontrado para os filtros informados.
          </div>
        ) : (
          <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleColumns.map((column) => {
              const palette = getClientPalette(column);
              const isUnallocated = column.id === UNALLOCATED_ID;

              return (
                <section
                  key={column.id}
                  onDragOver={(event) => {
                    if (draggedVehicleId || draggedDriverId) {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                      setDragOverColumnId(column.id);
                    }
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                      setDragOverColumnId(null);
                    }
                  }}
                  onDrop={(event) => onDropColumn(event, column)}
                  className={`min-h-56 rounded-2xl border transition-all overflow-hidden shadow-sm hover:shadow-md ${
                    dragOverColumnId === column.id
                      ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-400 dark:bg-indigo-950/30'
                      : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40'
                  }`}
                >
                  {/* Faixa Superior Colorida de Identificação Visual */}
                  <div className={`h-2 w-full ${palette.topBar}`} />

                  {/* Cabeçalho do Cliente com Seletor de Cor e Botão de Alocar */}
                  <header className={`p-3.5 border-b border-slate-200 dark:border-slate-800 ${palette.headerBg}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2 flex-1">
                        <MapPin className={`mt-0.5 h-4 w-4 shrink-0 ${palette.iconColor}`} />
                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-extrabold text-sm text-slate-900 dark:text-white truncate"
                            title={column.name}
                          >
                            {column.name}
                          </h3>
                          {column.location && (
                            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5" title={column.location}>
                              {column.location}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Seletor de Cor do Cliente */}
                        {!isUnallocated && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="h-6 w-6 rounded-full flex items-center justify-center border border-slate-300 dark:border-slate-700 hover:scale-110 transition-transform shadow-xs"
                                style={{ backgroundColor: palette.dot }}
                                title="Alterar cor de identificação deste cliente"
                              >
                                <span className="sr-only">Cor</span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2.5" align="end">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">Cor do Cliente:</p>
                              <div className="grid grid-cols-5 gap-1.5">
                                {CLIENT_COLOR_PALETTES.map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleSetClientColor(column.clientId || column.id || column.name, p.id)}
                                    className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                                      palette.id === p.id ? 'border-slate-900 ring-2 ring-slate-400' : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: p.dot }}
                                    title={p.name}
                                  />
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}

                        {/* Badge com Total de Veículos */}
                        <Badge variant="outline" className={`font-bold text-xs ${palette.badge}`}>
                          {column.vehicles.length}
                        </Badge>
                      </div>
                    </div>

                    {/* Botão de Ação Direta: + Alocar Veículo / Motorista / Obra */}
                    {!isUnallocated && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          Frota Alocada ({column.vehicles.length})
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenAddModal(column)}
                          className="h-6 px-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 rounded-md gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Alocar
                        </Button>
                      </div>
                    )}
                  </header>

                  {/* Lista de Veículos da Coluna */}
                  <div className="p-3 space-y-2.5">
                    {column.vehicles.slice(0, 30).map((vehicle) => {
                      const driverName = vehicle.assignedDriver || (vehicle as any).driverName || '';
                      const obraDisplay =
                        vehicle.projectName ||
                        (vehicle as any).workPostName ||
                        vehicle.location ||
                        (vehicle as any).postoDeTrabalho ||
                        '';
                      const school =
                        vehicle.busType === 'ESCOLA' || String(vehicle.vehicleType || '').toLowerCase().includes('escol');

                      return (
                        <article
                          key={vehicle.id}
                          draggable={!pendingVehicle}
                          onDragStart={(event) => {
                            event.dataTransfer.setData(
                              'application/json',
                              JSON.stringify({ kind: 'vehicle', vehicleId: vehicle.id } satisfies DragPayload)
                            );
                            event.dataTransfer.effectAllowed = 'move';
                            setDraggedVehicleId(vehicle.id);
                          }}
                          onDragEnd={() => {
                            setDraggedVehicleId(null);
                            setDragOverColumnId(null);
                          }}
                          onDragOver={(event) => {
                            if (draggedDriverId || draggedVehicleId) {
                              event.preventDefault();
                              event.dataTransfer.dropEffect = 'move';
                              if (draggedVehicleId !== vehicle.id || draggedDriverId) {
                                setDragOverVehicleId(vehicle.id);
                              }
                            }
                          }}
                          onDragLeave={() => setDragOverVehicleId(null)}
                          onDrop={(event) => onDropVehicle(event, vehicle, column)}
                          className={`rounded-xl border bg-white p-3 shadow-xs transition-all dark:bg-slate-950 ${palette.cardBorder} ${
                            dragOverVehicleId === vehicle.id
                              ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 dark:bg-indigo-500/10 dark:ring-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-800'
                          } ${draggedVehicleId === vehicle.id ? 'scale-[0.98] opacity-45' : ''} ${
                            pendingVehicle === vehicle.id ? 'pointer-events-none opacity-60' : ''
                          }`}
                        >
                          {/* Cabeçalho do Card: Ícone + Placa + Prefixo */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-red-600 dark:bg-slate-800 dark:text-red-300 shadow-2xs">
                                <Bus className="h-4 w-4" />
                              </span>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-mono text-sm font-extrabold tracking-wide text-slate-900 dark:text-white">
                                    {vehicle.plate}
                                  </span>
                                  {vehicle.fleetNumber && (
                                    <Badge className="bg-amber-100 text-[10px] font-bold text-amber-900 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-200 border-amber-300 dark:border-amber-800">
                                      Frota {vehicle.fleetNumber}
                                    </Badge>
                                  )}
                                  {school && (
                                    <Badge className="bg-sky-100 text-[10px] font-bold text-sky-900 hover:bg-sky-100 dark:bg-sky-500/20 dark:text-sky-200 border-sky-300 dark:border-sky-800">
                                      Escolar
                                    </Badge>
                                  )}
                                </div>
                                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  {vehicle.brand} {vehicle.model}
                                </p>
                              </div>
                            </div>
                            <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-400" />
                          </div>

                          {/* Campo em Destaque: Obra / Setor de Trabalho */}
                          <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-xs">
                            <HardHat className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="font-bold text-[10px] uppercase text-amber-800 dark:text-amber-300 shrink-0">
                              Obra/Setor:
                            </span>
                            <span
                              className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 truncate flex-1"
                              title={obraDisplay || 'Não definida'}
                            >
                              {obraDisplay || <i className="text-slate-400 font-normal">Não definida</i>}
                            </span>
                          </div>

                          {/* Campo em Destaque: Motorista Atribuído */}
                          <div className="mt-2 flex items-center justify-between gap-1.5 border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                            {vehicle.assignedDriver ? (
                              <span
                                draggable
                                onDragStart={(event) => {
                                  event.stopPropagation();
                                  event.dataTransfer.setData(
                                    'application/json',
                                    JSON.stringify({
                                      kind: 'driver',
                                      driverName: vehicle.assignedDriver,
                                      sourceVehicleId: vehicle.id
                                    } satisfies DragPayload)
                                  );
                                  event.dataTransfer.effectAllowed = 'move';
                                  setDraggedDriverId(vehicle.id);
                                }}
                                onDragEnd={() => setDraggedDriverId(null)}
                                className="inline-flex min-w-0 cursor-grab items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 active:cursor-grabbing dark:bg-indigo-500/10 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                              >
                                <UserRound className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate max-w-[140px]">{vehicle.assignedDriver}</span>
                                <GripVertical className="h-3 w-3 shrink-0 opacity-50" />
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                                <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                <span className="truncate text-[11px]">{driverName || 'Motorista não atribuído'}</span>
                              </div>
                            )}

                            {/* Botão de Edição Rápida */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenAddModal(column, vehicle)}
                              className="h-6 px-1.5 text-[11px] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded"
                              title="Alterar veículo, motorista ou obra"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Editar
                            </Button>

                            {pendingVehicle === vehicle.id && (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
                            )}
                          </div>
                        </article>
                      );
                    })}

                    {column.vehicles.length > 30 && (
                      <div className="p-2 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        + {column.vehicles.length - 30} veículos adicionais nesta coluna (use a busca acima para filtrar)
                      </div>
                    )}

                    {column.vehicles.length === 0 && (
                      <div className="py-6 px-3 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Nenhum veículo alocado neste cliente.
                        </p>
                        {!isUnallocated && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenAddModal(column)}
                            className="mt-2.5 h-7 text-xs font-bold text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800 hover:bg-blue-50"
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Alocar Veículo
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Modal de Alocação: Clicar e Adicionar Veículo, Motorista e Obra ao Cliente */}
      <Dialog open={allocationModalOpen} onOpenChange={setAllocationModalOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl bg-white p-4 dark:bg-slate-900 border-slate-200 dark:border-slate-800 sm:w-[calc(100vw-2rem)] sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
              <Building2 className="h-5 w-5 text-blue-600" />
              Alocar Veículo, Motorista e Obra
            </DialogTitle>
          </DialogHeader>

          {selectedColumnForAllocation && (
            <div className="grid min-w-0 grid-cols-1 gap-3 py-2 md:grid-cols-2 md:gap-4">
              {/* Identificação do Cliente Destino */}
              <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-100/80 p-3 dark:border-slate-700 dark:bg-slate-800/60 md:col-span-2">
                <Label className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">
                  Cliente Selecionado
                </Label>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="min-w-0 break-words text-sm font-extrabold text-slate-900 dark:text-white">
                    {selectedColumnForAllocation.name}
                  </span>
                </div>
              </div>

              {/* Seleção do Veículo com Barra de Pesquisa */}
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Veículo (Placa / Frota / Modelo) *
                  </Label>
                  <span className="text-[10px] text-slate-400">{vehicles.length} disponíveis</span>
                </div>
                <SearchableSelect
                  value={modalVehicleId}
                  onChange={(val) => setModalVehicleId(val)}
                  options={vehicleOptions}
                  placeholder="Selecione o veículo..."
                  searchPlaceholder="Buscar por placa, frota ou modelo..."
                  emptyText="Nenhum veículo encontrado."
                  maxVisibleOptions={60}
                />
              </div>

              {/* Seleção do Motorista com Barra de Pesquisa */}
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Motorista Designado
                  </Label>
                  <span className="text-[10px] text-slate-400">{driverOptions.length} disponíveis</span>
                </div>
                <SearchableSelect
                  value={modalDriverName}
                  fallbackLabel={modalDriverName}
                  onChange={(val) => setModalDriverName(val)}
                  options={driverOptions}
                  placeholder="Selecione o motorista (opcional)..."
                  searchPlaceholder="Buscar por nome ou CPF..."
                  emptyText="Nenhum motorista encontrado."
                  maxVisibleOptions={70}
                />
              </div>

              {/* Campo: Obra / Setor de Trabalho com Barra de Pesquisa e Digitação Livre */}
              <div className="min-w-0 space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Obra / Setor de Trabalho *
                  </Label>
                  <span className="text-[10px] text-slate-400">{obraOptions.length} opções disponíveis</span>
                </div>
                <SearchableSelect
                  value={modalObraName}
                  fallbackLabel={modalObraName}
                  onChange={(val) => setModalObraName(val)}
                  options={obraOptions}
                  allowCustomValue={true}
                  customValuePrefix="Definir obra/setor"
                  placeholder="Digite ou selecione a obra/setor..."
                  searchPlaceholder="Buscar ou digitar obra/setor..."
                  emptyText="Nenhuma obra encontrada. Pressione Enter para cadastrar com o texto digitado."
                  maxVisibleOptions={30}
                />

                {/* Sugestões rápidas de obras cadastradas para esse cliente */}
                {suggestedObras.length > 0 && (
                  <div className="pt-1.5">
                    <p className="text-[10px] font-semibold text-slate-500 mb-1">Obras / Postos cadastrados deste cliente:</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestedObras.slice(0, 5).map((obra, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setModalObraName(obra)}
                          className="px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-[10px] font-medium transition-colors"
                        >
                          {obra}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAllocationModalOpen(false)}
              disabled={savingAllocation}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmModalAllocation}
              disabled={!modalVehicleId || savingAllocation}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              {savingAllocation ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Salvando Alocação...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Confirmar Alocação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ClientVehicleAllocationBoard;
