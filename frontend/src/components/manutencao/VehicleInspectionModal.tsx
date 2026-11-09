import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Camera,
  Upload,
  Trash2,
  Printer,
  Save,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Truck,
  Wrench,
  X,
  Search,
  ChevronDown,
  Building2,
  Briefcase,
  UserCheck,
  HardHat,
  Layers,
  Sparkles,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import vehicleInspectionService, {
  VehicleInspection,
  CreateVehicleInspectionDTO,
  DEFAULT_SERVICES_PERFORMED_TEMPLATE,
  VehicleReleaseStatus
} from '@/services/vehicleInspectionService';
import fleetService from '@/services/fleetService';
import { clientService } from '@/services/clientService';
import { workPostService } from '@/services/workPostService';
import { employeeService, Employee } from '@/services/employeeService';
import { openVehicleInspectionPDFPreview } from '@/utils/vehicleInspectionPdfGenerator';
import { compressImageIfNeeded, compressDataUrl } from '@/lib/imageUtils';

interface VehicleInspectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspection?: VehicleInspection | null;
  onSuccess?: () => void;
  initialVehiclePlate?: string;
}

interface SearchableOption {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
  raw?: any;
}

interface SmartSearchSelectProps {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (val: string, option?: SearchableOption) => void;
  options: SearchableOption[];
  placeholder?: string;
  helperText?: string;
  badgeText?: string;
  uppercase?: boolean;
  mono?: boolean;
}

/**
 * Campo inteligente de pesquisa e seleção:
 * - Ao clicar na seta ou no campo, exibe a lista completa para seleção.
 * - Ao digitar os 3 primeiros caracteres (ou qualquer termo), filtra e destaca os registros correspondentes.
 */
const SmartSearchSelect: React.FC<SmartSearchSelectProps> = ({
  label,
  icon,
  value,
  onChange,
  options,
  placeholder,
  helperText,
  badgeText,
  uppercase = false,
  mono = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalize = (str: string) =>
    (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const filteredOptions = useMemo(() => {
    const q = normalize(query);
    if (!q) return options;
    return options.filter(
      (opt) =>
        normalize(opt.label).includes(q) ||
        normalize(opt.sublabel || '').includes(q) ||
        normalize(opt.badge || '').includes(q)
    );
  }, [options, query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = uppercase ? e.target.value.toUpperCase() : e.target.value;
    setQuery(rawVal);
    onChange(rawVal);
    if (rawVal.trim().length >= 3 || !isOpen) {
      setIsOpen(true);
    }
  };

  const handleSelectOption = (opt: SearchableOption) => {
    setQuery(opt.label);
    onChange(opt.label, opt);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative space-y-1">
      <div className="flex items-center justify-between gap-1">
        <Label className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
        </Label>
        {badgeText && (
          <span className="text-[10px] text-amber-400/90 font-semibold">{badgeText}</span>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || 'Digite 3 letras ou selecione...'}
          className={`bg-zinc-950/90 border-zinc-700/80 focus:border-amber-500 h-9 pl-8 pr-8 text-xs sm:text-sm text-white transition-all rounded-xl ${
            uppercase ? 'uppercase' : ''
          } ${mono ? 'font-mono font-bold text-amber-300' : 'font-semibold'}`}
        />
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-2 top-2 p-0.5 text-zinc-400 hover:text-amber-400 transition-colors"
          title="Abrir lista"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
        </button>
      </div>

      {helperText && (
        <p className="text-[10px] text-zinc-500 leading-tight">{helperText}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-amber-500/40 bg-zinc-950/98 shadow-2xl backdrop-blur-xl divide-y divide-zinc-800/70">
          <div className="px-3 py-1.5 bg-zinc-900/90 text-[10px] text-zinc-400 flex items-center justify-between sticky top-0 z-10">
            <span>
              {query.trim().length >= 3
                ? `Resultados para "${query.trim()}" (${filteredOptions.length})`
                : `Lista disponível (${filteredOptions.length}) — digite 3 caracteres para filtrar`}
            </span>
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  onChange('');
                }}
                className="text-amber-400 hover:underline font-bold"
              >
                Limpar
              </button>
            )}
          </div>

          {filteredOptions.length === 0 ? (
            <div className="p-3 text-center text-xs text-zinc-400">
              Nenhum registro encontrado. O valor digitado <strong className="text-white">"{query}"</strong> será utilizado.
            </div>
          ) : (
            filteredOptions.slice(0, 60).map((opt) => {
              const isSelected = normalize(opt.label) === normalize(value);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-200 font-bold'
                      : 'text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className={`truncate ${mono ? 'font-mono font-bold text-amber-300' : 'font-semibold text-white'}`}>
                      {opt.label}
                    </div>
                    {opt.sublabel && (
                      <div className="text-[10px] text-zinc-400 truncate">{opt.sublabel}</div>
                    )}
                  </div>
                  {opt.badge && (
                    <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px] shrink-0">
                      {opt.badge}
                    </Badge>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

type NavSection = 'ALL' | 'IDENTIFICACAO' | 'SERVICOS' | 'EVIDENCIAS' | 'CONCLUSAO';

const MAX_EVIDENCES = 10;

export const VehicleInspectionModal: React.FC<VehicleInspectionModalProps> = ({
  open,
  onOpenChange,
  inspection,
  onSuccess,
  initialVehiclePlate
}) => {
  const { toast } = useToast();
  const deviceUploadInputRef = useRef<HTMLInputElement>(null);
  const mobileCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [activeNav, setActiveNav] = useState<NavSection>('ALL');
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Câmera ao vivo (para navegador mobile/desktop quando o usuário clicar em Fotografar)
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Form State (Ordem: Nº Registro, Cliente, Obra / Setor de Trabalho, Placa do Veículo)
  const [registryNumber, setRegistryNumber] = useState('');
  const [clientName, setClientName] = useState('MSM');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [projectName, setProjectName] = useState('VALE');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [inspectionDate, setInspectionDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [currentMileage, setCurrentMileage] = useState<string>('7000');
  const [horimeterHours, setHorimeterHours] = useState('215HRS');
  const [executionTeam, setExecutionTeam] = useState('VAGNER SABINO / JAIRO');

  const [problemDescription, setProblemDescription] = useState('1- MANUTENÇÃO PREVENTIVA\n2-\n3-');
  const [occurrenceDescription, setOccurrenceDescription] = useState('PREVENTIVA MENSAL');
  const [servicesPerformed, setServicesPerformed] = useState(DEFAULT_SERVICES_PERFORMED_TEMPLATE);
  const [partsReplaced, setPartsReplaced] = useState('Descritas acima.');
  const [releaseStatus, setReleaseStatus] = useState<VehicleReleaseStatus>('LIBERADO_SEM_RESTRICAO');
  const [restrictionDescription, setRestrictionDescription] = useState('Sem restrição.');

  // Responsáveis Técnicos (Encarregado de Manutenção e Mecânico buscados na base de funcionários)
  const [managerName, setManagerName] = useState('');
  const [engineerName, setEngineerName] = useState('');

  // Evidências Fotográficas (Lista dinâmica de até 10 fotos)
  const [evidences, setEvidences] = useState<string[]>([]);

  // Dados carregados da base
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [workPosts, setWorkPosts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Fecha stream de câmera ao desmontar ou fechar modal
  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsLiveCameraOpen(false);
  };

  useEffect(() => {
    if (!open) {
      stopLiveCamera();
      return;
    }

    // Carrega Veículos, Clientes, Obras/Setores e Funcionários em paralelo
    fleetService.getVehicles().then((list) => {
      if (Array.isArray(list)) setVehicles(list);
    }).catch(() => {});

    clientService.getAllClients().then((list) => {
      if (Array.isArray(list)) setClients(list);
    }).catch(() => {});

    workPostService.getWorkPosts().then((list) => {
      if (Array.isArray(list)) setWorkPosts(list);
    }).catch(() => {});

    employeeService.getAllEmployees().then((list) => {
      if (Array.isArray(list)) {
        setEmployees(list);
        // Se for novo laudo e ainda não tiver preenchido Encarregado / Mecânico, sugere da base
        if (!inspection) {
          const encarregados = filterEncarregados(list);
          const mecanicos = filterMecanicos(list);
          if (encarregados.length > 0) {
            setManagerName((prev) => prev || encarregados[0].label);
          }
          if (mecanicos.length > 0) {
            setEngineerName((prev) => prev || mecanicos[0].label);
          }
        }
      }
    }).catch(() => {});

    if (inspection) {
      setRegistryNumber(inspection.registryNumber || '');
      setInspectionDate(inspection.inspectionDate || new Date().toISOString().substring(0, 10));
      setVehiclePlate(inspection.vehiclePlate || '');
      setProjectName(inspection.projectName || 'VALE');
      setClientName(inspection.clientName || 'MSM');
      setCurrentMileage(inspection.currentMileage != null ? String(inspection.currentMileage) : '7000');
      setHorimeterHours(inspection.horimeterHours || '215HRS');
      setProblemDescription(inspection.problemDescription || '1- MANUTENÇÃO PREVENTIVA\n2-\n3-');
      setOccurrenceDescription(inspection.occurrenceDescription || 'PREVENTIVA MENSAL');
      setExecutionTeam(inspection.executionTeam || 'VAGNER SABINO / JAIRO');
      setServicesPerformed(inspection.servicesPerformed || DEFAULT_SERVICES_PERFORMED_TEMPLATE);
      setPartsReplaced(inspection.partsReplaced || inspection.partsUsed || 'Descritas acima.');
      setReleaseStatus(inspection.releaseStatus || 'LIBERADO_SEM_RESTRICAO');
      setRestrictionDescription(inspection.restrictionDescription || 'Sem restrição.');
      setManagerName(inspection.managerName || inspection.supervisorName || '');
      setEngineerName(inspection.engineerName || inspection.inspectorName || '');

      let parsedPhotos: string[] = [];
      if (inspection.evidencesUrls) {
        try {
          const arr = JSON.parse(inspection.evidencesUrls);
          if (Array.isArray(arr)) parsedPhotos = arr.filter(Boolean).slice(0, MAX_EVIDENCES);
        } catch {
          parsedPhotos = inspection.evidencesUrls
            .split(',')
            .map((u) => u.trim())
            .filter(Boolean)
            .slice(0, MAX_EVIDENCES);
        }
      }
      setEvidences(parsedPhotos);
    } else {
      vehicleInspectionService.getNextRegistryNumber().then((next) => {
        setRegistryNumber(next);
      }).catch(() => {
        setRegistryNumber('14598');
      });

      if (initialVehiclePlate) {
        setVehiclePlate(initialVehiclePlate);
      } else {
        setVehiclePlate('');
      }
      setEvidences([]);
      setReleaseStatus('LIBERADO_SEM_RESTRICAO');
      setRestrictionDescription('Sem restrição.');
      setActiveNav('ALL');
    }
  }, [open, inspection, initialVehiclePlate]);

  // Helpers para filtrar cargos de funcionários na base
  const getEmployeeRoleText = (emp: Employee): string => {
    const parts = [
      emp.positionDescription,
      emp.role,
      emp.position?.name,
      emp.position?.description,
      emp.department?.name,
    ].filter(Boolean);
    return parts.join(' - ');
  };

  function filterEncarregados(empList: Employee[]): SearchableOption[] {
    const normalize = (s: string) =>
      (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

    const matched: SearchableOption[] = [];
    const others: SearchableOption[] = [];

    empList.forEach((emp) => {
      if (!emp.name) return;
      const roleStr = getEmployeeRoleText(emp);
      const normRole = normalize(roleStr);
      const opt: SearchableOption = {
        id: emp.id || emp.name,
        label: emp.name,
        sublabel: roleStr || 'Colaborador Cadastrado',
        badge: emp.registrationNumber ? `Mat. ${emp.registrationNumber}` : undefined,
        raw: emp,
      };
      if (
        normRole.includes('ENCARREGAD') ||
        normRole.includes('SUPERVISOR') ||
        normRole.includes('GERENTE') ||
        normRole.includes('LIDER') ||
        normRole.includes('COORDENADOR') ||
        normRole.includes('CHEFE DE OFICINA') ||
        normRole.includes('MANUTENCAO')
      ) {
        matched.push(opt);
      } else {
        others.push(opt);
      }
    });

    return matched.length > 0 ? [...matched, ...others] : others;
  }

  function filterMecanicos(empList: Employee[]): SearchableOption[] {
    const normalize = (s: string) =>
      (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

    const matched: SearchableOption[] = [];
    const others: SearchableOption[] = [];

    empList.forEach((emp) => {
      if (!emp.name) return;
      const roleStr = getEmployeeRoleText(emp);
      const normRole = normalize(roleStr);
      const opt: SearchableOption = {
        id: emp.id || emp.name,
        label: emp.name,
        sublabel: roleStr || 'Colaborador Cadastrado',
        badge: emp.registrationNumber ? `Mat. ${emp.registrationNumber}` : undefined,
        raw: emp,
      };
      if (
        normRole.includes('MECANIC') ||
        normRole.includes('MANUTENCAO') ||
        normRole.includes('ELETRICISTA') ||
        normRole.includes('TECNICO') ||
        normRole.includes('LANTERNEIRO') ||
        normRole.includes('BORRACHEIRO')
      ) {
        matched.push(opt);
      } else {
        others.push(opt);
      }
    });

    return matched.length > 0 ? [...matched, ...others] : others;
  }

  // Opções de Clientes (extraídas de clientService + obras + veículos)
  const clientOptions = useMemo<SearchableOption[]>(() => {
    const map = new Map<string, SearchableOption>();
    clients.forEach((c) => {
      const name = (c.name || c.razaoSocial || c.nomeFantasia || '').trim();
      if (!name) return;
      map.set(name.toUpperCase(), {
        id: c.id || name,
        label: name,
        sublabel: c.cnpj ? `CNPJ: ${c.cnpj}` : 'Cliente Cadastrado',
        badge: c.status === 'ACTIVE' ? 'Ativo' : undefined,
        raw: c,
      });
    });
    workPosts.forEach((wp) => {
      const cName = (wp.clientName || '').trim();
      if (cName && !map.has(cName.toUpperCase())) {
        map.set(cName.toUpperCase(), {
          id: wp.clientId || cName,
          label: cName,
          sublabel: `Obra vinculada: ${wp.name || ''}`,
        });
      }
    });
    vehicles.forEach((v) => {
      const cName = (v.clientName || v.empresa || v.client?.name || '').trim();
      if (cName && !map.has(cName.toUpperCase())) {
        map.set(cName.toUpperCase(), {
          id: v.clientId || cName,
          label: cName,
          sublabel: 'Cliente com frota alocada',
        });
      }
    });
    return Array.from(map.values());
  }, [clients, workPosts, vehicles]);

  // Opções de Obra / Setor de Trabalho (filtradas pelo cliente selecionado quando houver)
  const workPostOptions = useMemo<SearchableOption[]>(() => {
    const map = new Map<string, SearchableOption>();
    const normClient = (clientName || '').trim().toUpperCase();

    workPosts.forEach((wp) => {
      const name = (wp.name || wp.postCode || '').trim();
      if (!name) return;
      const wpClientName = (wp.clientName || '').trim().toUpperCase();
      const belongsToSelectedClient =
        (selectedClientId && wp.clientId === selectedClientId) ||
        (normClient && wpClientName && wpClientName.includes(normClient));

      map.set(`${name.toUpperCase()}-${wp.id}`, {
        id: wp.id || name,
        label: name,
        sublabel: wp.clientName
          ? `Cliente: ${wp.clientName}${wp.city ? ` • ${wp.city}/${wp.state || ''}` : ''}`
          : wp.address || 'Obra / Setor de Trabalho',
        badge: belongsToSelectedClient ? 'Do Cliente' : wp.postCode || undefined,
        raw: { ...wp, priority: belongsToSelectedClient ? 1 : 2 },
      });
    });

    vehicles.forEach((v) => {
      const obra = (v.obraSetorNome || v.projectName || v.obraName || v.postoDeTrabalho || '').trim();
      if (!obra) return;
      const key = obra.toUpperCase();
      if (!Array.from(map.values()).some((o) => o.label.toUpperCase() === key)) {
        const vClient = (v.clientName || v.empresa || '').trim();
        const belongs = normClient && vClient.toUpperCase().includes(normClient);
        map.set(key, {
          id: key,
          label: obra,
          sublabel: vClient ? `Cliente: ${vClient}` : 'Setor / Obra de Alocação',
          badge: belongs ? 'Do Cliente' : 'Alocação',
          raw: { priority: belongs ? 1 : 2 },
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => (a.raw?.priority || 2) - (b.raw?.priority || 2));
  }, [workPosts, vehicles, clientName, selectedClientId]);

  // Opções de Placa do Veículo (priorizando veículos do cliente/obra selecionado)
  const vehicleOptions = useMemo<SearchableOption[]>(() => {
    const normClient = (clientName || '').trim().toUpperCase();
    const normProject = (projectName || '').trim().toUpperCase();

    return vehicles
      .map((v) => {
        const plate = (v.plate || v.placa || '').toUpperCase().trim();
        if (!plate) return null;
        const model = [v.brand || v.marca, v.model || v.modelo].filter(Boolean).join(' ');
        const vClient = (v.clientName || v.empresa || v.client?.name || '').trim();
        const vObra = (v.obraSetorNome || v.projectName || v.obraName || '').trim();
        const matchesClient = normClient && vClient.toUpperCase().includes(normClient);
        const matchesObra = normProject && vObra.toUpperCase().includes(normProject);

        return {
          id: v.id || plate,
          label: plate,
          sublabel: [
            v.prefix ? `Pref. ${v.prefix}` : null,
            model || 'Veículo da Frota',
            vClient ? `Cliente: ${vClient}` : null,
            vObra ? `Obra: ${vObra}` : null,
          ]
            .filter(Boolean)
            .join(' • '),
          badge: matchesClient || matchesObra ? 'Alocado no Cliente' : v.currentMileage ? `${v.currentMileage} km` : undefined,
          raw: { ...v, priority: matchesClient || matchesObra ? 1 : 2 },
        } as SearchableOption;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (a.raw?.priority || 2) - (b.raw?.priority || 2)) as SearchableOption[];
  }, [vehicles, clientName, projectName]);

  // Opções de Encarregado de Manutenção e Mecânico da base de funcionários
  const encarregadoOptions = useMemo(() => filterEncarregados(employees), [employees]);
  const mecanicoOptions = useMemo(() => filterMecanicos(employees), [employees]);

  const handleSelectClient = (val: string, opt?: SearchableOption) => {
    setClientName(val);
    if (opt?.raw?.id) {
      setSelectedClientId(opt.raw.id);
      const clientPosts = workPosts.filter((wp) => wp.clientId === opt.raw.id);
      if (clientPosts.length > 0 && (!projectName || projectName === 'VALE')) {
        setProjectName(clientPosts[0].name || '');
      }
    }
  };

  const handleSelectVehicle = (plate: string, opt?: SearchableOption) => {
    const cleanPlate = plate.toUpperCase().trim();
    setVehiclePlate(cleanPlate);
    const found =
      opt?.raw ||
      vehicles.find((v) => (v.plate || v.placa || '').toUpperCase() === cleanPlate);
    if (found) {
      if (found.currentMileage != null) setCurrentMileage(String(found.currentMileage));
      const vClient = found.clientName || found.empresa || found.client?.name;
      if (vClient && (!clientName || clientName === 'MSM')) setClientName(vClient);
      const vObra = found.obraSetorNome || found.projectName || found.obraName;
      if (vObra && (!projectName || projectName === 'VALE')) setProjectName(vObra);
    }
  };

  // Adição de fotos via Upload do Dispositivo ou Captura Nativa (até 10 fotos)
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_EVIDENCES - evidences.length;
    if (remainingSlots <= 0) {
      toast({
        title: 'Limite de 10 fotos atingido',
        description: 'Remova uma foto existente caso deseje anexar uma nova evidência.',
        variant: 'destructive',
      });
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    for (const file of selectedFiles) {
      try {
        const compressedFile = await compressImageIfNeeded(file, 1280, 960, 0.75);
        const reader = new FileReader();
        reader.onload = async () => {
          let result = reader.result as string;
          try {
            result = await compressDataUrl(result, 1280, 960, 0.75);
          } catch {
            // fallback silencioso
          }
          setEvidences((prev) => {
            if (prev.length >= MAX_EVIDENCES) return prev;
            return [...prev, result];
          });
        };
        reader.readAsDataURL(compressedFile);
      } catch {
        const reader = new FileReader();
        reader.onload = async () => {
          let result = reader.result as string;
          try {
            result = await compressDataUrl(result, 1280, 960, 0.75);
          } catch {
            // fallback silencioso
          }
          setEvidences((prev) => {
            if (prev.length >= MAX_EVIDENCES) return prev;
            return [...prev, result];
          });
        };
        reader.readAsDataURL(file);
      }
    }

    toast({
      title: `${selectedFiles.length} foto(s) adicionada(s)`,
      description: 'Evidências fotográficas anexadas ao laudo.',
    });

    e.target.value = '';
  };

  // Abrir câmera ao vivo ou câmera nativa do telefone
  const handleOpenCamera = async () => {
    if (evidences.length >= MAX_EVIDENCES) {
      toast({
        title: 'Limite de 10 fotos atingido',
        description: 'Você já anexou o máximo de 10 evidências fotográficas.',
        variant: 'destructive',
      });
      return;
    }

    // Em dispositivos móveis com câmera ou navegadores com suporte a getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        setCameraStream(stream);
        setIsLiveCameraOpen(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }, 100);
        return;
      } catch {
        // Fallback para input file com capture="environment"
      }
    }

    if (mobileCameraInputRef.current) {
      mobileCameraInputRef.current.value = '';
      mobileCameraInputRef.current.click();
    }
  };

  const handleCapturePhotoFromLiveCamera = () => {
    if (!videoRef.current) return;
    if (evidences.length >= MAX_EVIDENCES) {
      stopLiveCamera();
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.75);

    setEvidences((prev) => {
      const next = [...prev, dataUrl].slice(0, MAX_EVIDENCES);
      if (next.length >= MAX_EVIDENCES) {
        stopLiveCamera();
      }
      return next;
    });

    toast({
      title: `📸 Foto #${evidences.length + 1} capturada!`,
      description: 'Evidência adicionada ao laudo com sucesso.',
    });
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setEvidences((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const buildFormData = async (): Promise<CreateVehicleInspectionDTO> => {
    const validPhotos = evidences.filter(Boolean).slice(0, MAX_EVIDENCES);
    const compressedPhotos = await Promise.all(
      validPhotos.map((photo) => compressDataUrl(photo, 1280, 960, 0.75))
    );
    const photosJson = compressedPhotos.length > 0 ? JSON.stringify(compressedPhotos) : undefined;
    return {
      registryNumber,
      inspectionType: 'LAUDO',
      inspectionDate,
      vehiclePlate: vehiclePlate.toUpperCase().trim(),
      projectName,
      clientName,
      currentMileage: currentMileage ? parseInt(currentMileage, 10) : undefined,
      horimeterHours,
      executionTeam,
      problemDescription,
      occurrenceDescription,
      servicesPerformed,
      partsReplaced,
      partsUsed: partsReplaced,
      evidencesUrls: photosJson,
      releaseStatus,
      restrictionDescription:
        releaseStatus === 'LIBERADO_SEM_RESTRICAO' ? 'Sem restrição.' : restrictionDescription,
      managerName: managerName || 'Encarregado de Manutenção',
      engineerName: engineerName || 'Mecânico Responsável',
      supervisorName: managerName || 'Encarregado de Manutenção',
      inspectorName: engineerName || 'Mecânico Responsável',
    };
  };

  const handleSave = async () => {
    if (!vehiclePlate.trim()) {
      toast({
        title: 'Placa do Veículo Obrigatória',
        description: 'Selecione ou digite a placa do veículo na seção de Identificação.',
        variant: 'destructive',
      });
      setActiveNav('IDENTIFICACAO');
      return;
    }

    setSaving(true);
    try {
      const payload = await buildFormData();
      if (inspection?.id) {
        await vehicleInspectionService.updateInspection(inspection.id, payload);
        toast({ title: 'Laudo Atualizado!', description: `Laudo Nº ${registryNumber} salvo com sucesso.` });
      } else {
        await vehicleInspectionService.createInspection(payload);
        toast({ title: 'Laudo Criado!', description: `Laudo Nº ${registryNumber} emitido com sucesso.` });
      }
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast({
        title: 'Erro ao Salvar Laudo',
        description: err?.message || 'Não foi possível salvar o laudo de inspeção.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrintPDF = async () => {
    setGeneratingPdf(true);
    try {
      const formData = await buildFormData();
      const mockObj: VehicleInspection = {
        id: inspection?.id || 'preview',
        ...formData,
      };
      await openVehicleInspectionPDFPreview(mockObj);
      toast({
        title: 'PDF com Logomarca Gerado',
        description: 'O Laudo de Inspeção Oficial foi aberto em nova guia para visualização e impressão.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao Gerar PDF',
        description: err?.message || 'Falha ao processar o PDF do laudo.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const showSection = (sec: NavSection) => activeNav === 'ALL' || activeNav === sec;

  return (
    <>
      {/* Input para Upload de Arquivos do Dispositivo (múltiplos até 10) */}
      <input
        ref={deviceUploadInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Input para Câmera Nativa do Telefone */}
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFilesSelected}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[96vw] max-w-5xl max-h-[94vh] flex flex-col overflow-hidden bg-zinc-950/98 border border-amber-500/30 text-white shadow-2xl rounded-2xl sm:rounded-3xl p-0">
          {/* CABEÇALHO FIXO COM NAVEGAÇÃO INTELIGENTE */}
          <DialogHeader className="px-4 sm:px-6 pt-4 pb-3 border-b border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 shrink-0 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-amber-400 shadow-inner">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black text-white flex items-center gap-2 flex-wrap">
                    <span>LAUDO DE INSPEÇÃO TÉCNICA E MANUTENÇÃO</span>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-mono font-bold">
                      Nº {registryNumber || '14598'}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-[11px] sm:text-xs text-zinc-400">
                    Vistoria preventiva, diagnóstico técnico, até 10 evidências fotográficas e liberação operacional
                  </DialogDescription>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrintPDF}
                disabled={generatingPdf}
                className="border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold gap-1.5 h-9 rounded-xl"
              >
                {generatingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                Visualizar / Imprimir PDF
              </Button>
            </div>

            {/* BARRA DE NAVEGAÇÃO INTELIGENTE (RESPONSIVA / MOBILE SCROLL) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'ALL', label: 'Visão Completa', icon: Layers },
                { id: 'IDENTIFICACAO', label: '1. Registro, Cliente, Obra & Placa', icon: Truck },
                { id: 'SERVICOS', label: '2. Diagnóstico & Serviços', icon: Wrench },
                { id: 'EVIDENCIAS', label: `3. Evidências (${evidences.length}/${MAX_EVIDENCES})`, icon: Camera },
                { id: 'CONCLUSAO', label: '4. Conclusão & Responsáveis', icon: UserCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeNav === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveNav(tab.id as NavSection)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                      isActive
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                        : 'bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </DialogHeader>

          {/* CORPO ROLÁVEL FLUÍDO */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-5 text-sm">
            {/* SEÇÃO 1: IDENTIFICAÇÃO (ORDEM EXATA: Nº REGISTRO -> CLIENTE -> OBRA/SETOR -> PLACA DO VEÍCULO) */}
            {showSection('IDENTIFICACAO') && (
              <div className="p-4 sm:p-5 bg-zinc-900/50 border border-white/10 rounded-2xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500 text-black font-black text-[10px]">ETAPA 1</Badge>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                      Identificação do Registro, Cliente, Obra/Setor e Veículo
                    </h3>
                  </div>
                  <span className="text-[11px] text-zinc-400 hidden sm:inline">
                    Digite 3 caracteres para pesquisar ou selecione na lista
                  </span>
                </div>

                {/* Linha Principal na Ordem Solicitada: 1. Nº Registro | 2. Cliente | 3. Obra / Setor de Trabalho | 4. Placa do Veículo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* 1. Nº Registro */}
                  <div className="space-y-1">
                    <Label className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-amber-400" />
                      <span>1. Nº Registro</span>
                    </Label>
                    <Input
                      value={registryNumber}
                      onChange={(e) => setRegistryNumber(e.target.value)}
                      placeholder="14598"
                      className="bg-zinc-950/90 border-zinc-700/80 focus:border-amber-500 h-9 font-mono font-bold text-amber-400 text-sm rounded-xl"
                    />
                    <p className="text-[10px] text-zinc-500">Numeração sequencial do laudo</p>
                  </div>

                  {/* 2. Cliente (Pesquisa 3 caracteres ou seleção na lista) */}
                  <SmartSearchSelect
                    label="2. Cliente"
                    icon={<Building2 className="h-3.5 w-3.5 text-amber-400" />}
                    value={clientName}
                    onChange={handleSelectClient}
                    options={clientOptions}
                    placeholder="Digite 3 letras ou selecione..."
                    helperText="Lista de clientes ou digite 3 caracteres"
                    badgeText={`${clientOptions.length} clientes`}
                  />

                  {/* 3. Obra / Setor de Trabalho (Pesquisa 3 caracteres ou seleção na lista) */}
                  <SmartSearchSelect
                    label="3. Obra / Setor de Trabalho"
                    icon={<Briefcase className="h-3.5 w-3.5 text-amber-400" />}
                    value={projectName}
                    onChange={(val) => setProjectName(val)}
                    options={workPostOptions}
                    placeholder="Digite 3 letras ou selecione..."
                    helperText="Obras/setores do cliente ou digite 3 letras"
                    badgeText={`${workPostOptions.length} obras`}
                  />

                  {/* 4. Placa do Veículo (Pesquisa 3 caracteres ou seleção na lista) */}
                  <SmartSearchSelect
                    label="4. Placa do Veículo"
                    icon={<Truck className="h-3.5 w-3.5 text-amber-400" />}
                    value={vehiclePlate}
                    onChange={handleSelectVehicle}
                    options={vehicleOptions}
                    placeholder="Ex: UVG3H03"
                    helperText="Selecione na frota ou digite 3 caracteres"
                    badgeText={`${vehicleOptions.length} veículos`}
                    uppercase
                    mono
                  />
                </div>

                {/* Segunda Linha: Data Inspeção | KM Atual | Horímetro (Horas) | Execução (Equipe) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2 border-t border-white/5">
                  <div>
                    <Label className="text-[11px] text-zinc-400 font-bold uppercase">Data da Inspeção</Label>
                    <Input
                      type="date"
                      value={inspectionDate}
                      onChange={(e) => setInspectionDate(e.target.value)}
                      className="bg-zinc-950/90 border-zinc-700/80 h-9 text-xs sm:text-sm mt-1 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] text-zinc-400 font-bold uppercase">KM Atual (Odômetro)</Label>
                    <Input
                      type="number"
                      value={currentMileage}
                      onChange={(e) => setCurrentMileage(e.target.value)}
                      placeholder="7000"
                      className="bg-zinc-950/90 border-zinc-700/80 h-9 text-xs sm:text-sm mt-1 font-mono font-bold text-white rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] text-zinc-400 font-bold uppercase">Horímetro (Horas)</Label>
                    <Input
                      value={horimeterHours}
                      onChange={(e) => setHorimeterHours(e.target.value)}
                      placeholder="215HRS"
                      className="bg-zinc-950/90 border-zinc-700/80 h-9 text-xs sm:text-sm mt-1 font-mono font-bold text-sky-400 rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] text-zinc-400 font-bold uppercase">Execução (Equipe)</Label>
                    <Input
                      value={executionTeam}
                      onChange={(e) => setExecutionTeam(e.target.value)}
                      placeholder="VAGNER SABINO / JAIRO"
                      className="bg-zinc-950/90 border-zinc-700/80 h-9 text-xs sm:text-sm mt-1 font-semibold rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 2: DIAGNÓSTICO, PROBLEMA, OCORRIDO E SERVIÇO REALIZADO */}
            {showSection('SERVICOS') && (
              <div className="p-4 sm:p-5 bg-zinc-900/50 border border-white/10 rounded-2xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500 text-black font-black text-[10px]">ETAPA 2</Badge>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                      Diagnóstico Técnico, Peças e Serviços Executados
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setServicesPerformed(DEFAULT_SERVICES_PERFORMED_TEMPLATE)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Restaurar Checklist Padrão São Silvestre
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <Label className="text-[11px] text-zinc-300 font-bold uppercase">
                      Descrição do Problema (Numerado)
                    </Label>
                    <Textarea
                      rows={3}
                      value={problemDescription}
                      onChange={(e) => setProblemDescription(e.target.value)}
                      placeholder="1- MANUTENÇÃO PREVENTIVA&#10;2-&#10;3-"
                      className="bg-zinc-950/90 border-zinc-700/80 text-xs mt-1 font-mono rounded-xl"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <Label className="text-[11px] text-zinc-300 font-bold uppercase">Descrição do Ocorrido</Label>
                      <Input
                        value={occurrenceDescription}
                        onChange={(e) => setOccurrenceDescription(e.target.value)}
                        placeholder="PREVENTIVA MENSAL"
                        className="bg-zinc-950/90 border-zinc-700/80 h-9 text-xs sm:text-sm mt-1 font-bold text-emerald-400 uppercase rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-zinc-300 font-bold uppercase">Peças Trocadas</Label>
                      <Input
                        value={partsReplaced}
                        onChange={(e) => setPartsReplaced(e.target.value)}
                        placeholder="Descritas acima."
                        className="bg-zinc-950/90 border-zinc-700/80 h-9 text-xs sm:text-sm mt-1 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-zinc-300 font-bold uppercase flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5 text-amber-400" />
                    Serviço Realizado (Itens Inspecionados e Revisados)
                  </Label>
                  <Textarea
                    rows={4}
                    value={servicesPerformed}
                    onChange={(e) => setServicesPerformed(e.target.value)}
                    placeholder="Descreva todos os serviços executados..."
                    className="bg-zinc-950/90 border-zinc-700/80 text-xs leading-relaxed rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* SEÇÃO 3: EVIDÊNCIAS FOTOGRÁFICAS (APENAS UPLOAD DO DISPOSITIVO OU CÂMERA DO TELEFONE — ATÉ 10 FOTOS) */}
            {showSection('EVIDENCIAS') && (
              <div className="p-4 sm:p-5 bg-zinc-900/50 border border-white/10 rounded-2xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500 text-black font-black text-[10px]">ETAPA 3</Badge>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Camera className="h-4 w-4 text-amber-400" />
                      Evidências Fotográficas (Placa, Painel/Horímetro e Componentes)
                    </h3>
                  </div>
                  <Badge
                    className={`text-xs font-mono font-bold ${
                      evidences.length > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {evidences.length} de {MAX_EVIDENCES} fotos anexadas
                  </Badge>
                </div>

                {/* Área Única de Ação: Upload do Dispositivo OU Câmera do Telefone */}
                <div className="p-4 sm:p-5 rounded-2xl border border-dashed border-amber-500/40 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="text-xs sm:text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                      <ImageIcon className="h-4 w-4 text-amber-400" />
                      Adicionar Evidências Fotográficas (Até {MAX_EVIDENCES} fotos)
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Selecione imagens do dispositivo/galeria ou utilize a câmera do telefone para fotografar na hora.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                    <Button
                      type="button"
                      onClick={() => deviceUploadInputRef.current?.click()}
                      disabled={evidences.length >= MAX_EVIDENCES}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 font-bold text-xs h-10 px-4 rounded-xl gap-2"
                    >
                      <Upload className="h-4 w-4 text-amber-400" />
                      Buscar no Dispositivo (Upload)
                    </Button>

                    <Button
                      type="button"
                      onClick={handleOpenCamera}
                      disabled={evidences.length >= MAX_EVIDENCES}
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black text-xs h-10 px-4 rounded-xl shadow-lg shadow-amber-500/20 gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Usar Câmera do Telefone
                    </Button>
                  </div>
                </div>

                {/* Modal / Visor de Câmera Ao Vivo quando acionado */}
                {isLiveCameraOpen && (
                  <div className="p-4 rounded-2xl bg-black border border-amber-500/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Camera className="h-4 w-4 animate-pulse" />
                        Câmera Ativa — Fotografe as evidências ({evidences.length}/{MAX_EVIDENCES})
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={stopLiveCamera}
                        className="h-7 text-xs text-zinc-400 hover:text-white"
                      >
                        <X className="h-4 w-4 mr-1" /> Fechar Câmera
                      </Button>
                    </div>
                    <div className="relative rounded-xl overflow-hidden bg-zinc-900 max-h-72 flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-h-72 object-contain"
                      />
                    </div>
                    <div className="flex justify-center gap-3">
                      <Button
                        type="button"
                        onClick={handleCapturePhotoFromLiveCamera}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 h-10 rounded-xl gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Capturar Foto #{evidences.length + 1}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Grade limpa exibindo apenas as fotos anexadas (até 10 fotos) */}
                {evidences.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
                    {evidences.map((photoUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group aspect-[4/3] rounded-xl border border-zinc-700 bg-black overflow-hidden shadow-md"
                      >
                        <img
                          src={photoUrl}
                          alt={`Evidência ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                            title="Remover Evidência"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Excluir
                          </button>
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 bg-black/80 text-[10px] px-2 py-0.5 rounded-md font-mono font-bold text-amber-300 border border-white/10">
                          Foto #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SEÇÃO 4: CONCLUSÃO OPERACIONAL & RESPONSÁVEIS TÉCNICOS (ENCARREGADO DE MANUTENÇÃO E MECÂNICO) */}
            {showSection('CONCLUSAO') && (
              <div className="p-4 sm:p-5 bg-zinc-900/50 border border-white/10 rounded-2xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500 text-black font-black text-[10px]">ETAPA 4</Badge>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                      Conclusão da Inspeção & Responsáveis Técnicos
                    </h3>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-xs text-zinc-300 font-extrabold uppercase tracking-wider block">
                    Declaro que o veículo foi inspecionado por mim com a seguinte conclusão:
                  </Label>

                  <RadioGroup
                    value={releaseStatus}
                    onValueChange={(val: any) => setReleaseStatus(val)}
                    className="space-y-2"
                  >
                    <div
                      onClick={() => setReleaseStatus('LIBERADO_SEM_RESTRICAO')}
                      className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        releaseStatus === 'LIBERADO_SEM_RESTRICAO'
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-sm'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                      }`}
                    >
                      <RadioGroupItem value="LIBERADO_SEM_RESTRICAO" id="r1" />
                      <Label htmlFor="r1" className="cursor-pointer font-bold text-xs flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        ( {releaseStatus === 'LIBERADO_SEM_RESTRICAO' ? 'X' : ' '} ) EQUIPAMENTO LIBERADO SEM RESTRIÇÃO OPERATIVA OU DE SEGURANÇA
                      </Label>
                    </div>

                    <div
                      onClick={() => setReleaseStatus('LIBERADO_COM_RESTRICAO')}
                      className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        releaseStatus === 'LIBERADO_COM_RESTRICAO'
                          ? 'bg-amber-950/40 border-amber-500 text-amber-200 shadow-sm'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                      }`}
                    >
                      <RadioGroupItem value="LIBERADO_COM_RESTRICAO" id="r2" />
                      <Label htmlFor="r2" className="cursor-pointer font-bold text-xs flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        ( {releaseStatus === 'LIBERADO_COM_RESTRICAO' ? 'X' : ' '} ) EQUIPAMENTO LIBERADO COM RESTRIÇÃO OPERATIVA OU DE SEGURANÇA
                      </Label>
                    </div>

                    <div
                      onClick={() => setReleaseStatus('NAO_LIBERADO')}
                      className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        releaseStatus === 'NAO_LIBERADO'
                          ? 'bg-rose-950/40 border-rose-500 text-rose-200 shadow-sm'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                      }`}
                    >
                      <RadioGroupItem value="NAO_LIBERADO" id="r3" />
                      <Label htmlFor="r3" className="cursor-pointer font-bold text-xs flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                        ( {releaseStatus === 'NAO_LIBERADO' ? 'X' : ' '} ) EQUIPAMENTO NÃO LIBERADO PARA OPERAÇÃO
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-[11px] text-zinc-300 font-bold uppercase">Descrever a Restrição</Label>
                  <Input
                    value={restrictionDescription}
                    onChange={(e) => setRestrictionDescription(e.target.value)}
                    placeholder="Sem restrição."
                    className="bg-zinc-950/90 border-zinc-700/80 h-9 text-xs sm:text-sm mt-1 rounded-xl"
                  />
                </div>

                {/* Campos de Responsáveis: Encarregado de Manutenção e Mecânico (buscando na base de funcionários) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                  <SmartSearchSelect
                    label="Encarregado de Manutenção"
                    icon={<UserCheck className="h-3.5 w-3.5 text-amber-400" />}
                    value={managerName}
                    onChange={(val) => setManagerName(val)}
                    options={encarregadoOptions}
                    placeholder="Selecione ou digite o Encarregado..."
                    helperText="Busca funcionários com cargo de Encarregado / Manutenção"
                    badgeText={`${encarregadoOptions.length} funcionários`}
                  />

                  <SmartSearchSelect
                    label="Mecânico"
                    icon={<HardHat className="h-3.5 w-3.5 text-amber-400" />}
                    value={engineerName}
                    onChange={(val) => setEngineerName(val)}
                    options={mecanicoOptions}
                    placeholder="Selecione ou digite o Mecânico..."
                    helperText="Busca funcionários com cargo de Mecânico na base"
                    badgeText={`${mecanicoOptions.length} funcionários`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* RODAPÉ FIXO COM NAVEGAÇÃO ENTRE ETAPAS E AÇÕES */}
          <DialogFooter className="px-4 sm:px-6 py-3 border-t border-white/10 bg-zinc-950 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs h-9 rounded-xl"
              >
                Cancelar
              </Button>

              {activeNav !== 'ALL' && (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const order: NavSection[] = ['IDENTIFICACAO', 'SERVICOS', 'EVIDENCIAS', 'CONCLUSAO'];
                      const idx = order.indexOf(activeNav);
                      if (idx > 0) setActiveNav(order[idx - 1]);
                    }}
                    disabled={activeNav === 'IDENTIFICACAO'}
                    className="h-8 text-xs text-zinc-400 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4 mr-0.5" /> Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const order: NavSection[] = ['IDENTIFICACAO', 'SERVICOS', 'EVIDENCIAS', 'CONCLUSAO'];
                      const idx = order.indexOf(activeNav);
                      if (idx >= 0 && idx < order.length - 1) setActiveNav(order[idx + 1]);
                    }}
                    disabled={activeNav === 'CONCLUSAO'}
                    className="h-8 text-xs text-amber-400 hover:text-amber-300"
                  >
                    Próxima Etapa <ChevronRight className="h-4 w-4 ml-0.5" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrintPDF}
                disabled={generatingPdf}
                className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10 text-xs font-bold gap-1.5 h-9 rounded-xl flex-1 sm:flex-initial"
              >
                {generatingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                Prévia PDF
              </Button>

              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-extrabold text-xs px-5 h-9 rounded-xl shadow-lg shadow-amber-500/20 gap-1.5 flex-1 sm:flex-initial"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Salvar Laudo
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
