import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, Edit, Trash2, Eye, User, Mail, Phone, MapPin, 
  Calendar, Building, FileText, UserPlus, AlertCircle, UserMinus, UserCheck, Briefcase,
  ArrowUpDown, ArrowUp, ArrowDown, QrCode, Check
} from 'lucide-react';
import { Employee } from '@/types/employee';

type SortField = 'name' | 'hireDate' | 'terminationDate' | 'position';
type SortDirection = 'asc' | 'desc';

interface FuncionariosTableProps {
  employees: Employee[];
  onView?: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onBulkDelete?: (ids: string[]) => void;
  onDeactivate?: (employee: Employee) => void;
  onReactivate?: (employee: Employee) => void;
  onTerminate: (employee: Employee) => void;
  onViewDocuments: (employee: Employee) => void;
  onViewDependents: (employee: Employee) => void;
  onCracha?: (employee: Employee) => void;
  isLoading?: boolean;
}

export const getEmployeeTerminationDate = (employee: Employee): string | undefined =>
  employee.terminationDate || employee.dataRescisao || undefined;

export const KNOWN_CPF_NAMES: Record<string, string> = {
    '85655350610': 'ADAIR JOSE SOARES DE ABREU',
    '13811972723': 'ADELSO MOREIRA CATRINQUE',
    '00964145618': 'ADEMIR APARECIDO NEZIO FERREIRA',
    '07998501600': 'ADILSON JOSE DE SOUZA',
    '00768583594': 'ADRIANO OLIVEIRA SILVA',
    '83565248653': 'AILTON COSTA MATOSINHOS',
    '74732617620': 'AILTON EVANGELISTA DA SILVA',
    '69011281268': 'ALCEMIR DOS SANTOS COSTA',
    '14139615680': 'ALESSANDER GABRIEL JESUS COSTA',
    '72024682200': 'ALEX LIMA DOS SANTOS',
    '10914795694': 'ALISSON RODRIGO DOS SANTOS',
    '56385340678': 'AMARILDO DIAS DE OLIVEIRA',
    '98848500625': 'AMAURI JOSE DE MOURA',
    '79511260634': 'ANTONIO CARLOS DE CASTRO',
    '27019659268': 'ANTONIO JOSE DE SOUSA GOMES',
    '67582982649': 'ANTONIO ROBERTO NICOLAU',
    '89719638168': 'AUGUSTINHO MOREIRA DE SALES',
    '08084278657': 'BRENER DE OLIVEIRA PAIVA',
    '06195923621': 'BRUNO FRANCA DA SILVA',
    '08379861680': 'BRUNO RAFAEL TEIXEIRA',
    '01932901116': 'CARLOS ALBERTO BISPO DA SILVA',
    '03123388646': 'CASSIO FERREIRA DA SILVA',
    '00638924642': 'CELIO ROBERTO DA COSTA',
    '03588588604': 'CLAUDIO DE SOUZA',
    '05160755608': 'CLAUDIO DO ROSARIO SOUZA',
    '77970764649': 'CLAUDIONOR ANDRE DAS VIRGENS',
    '11562052632': 'CLEBER APARECIDO MORENO',
    '01106391381': 'CLEUDEMIR DO NASCIMENTO SILVA',
    '74876678120': 'CONRADO AUGUSTO DE OLIVEIRA',
    '05483414608': 'CRISTIANO VITALINO DOS SANTOS',
    '08281558601': 'DANIELLE SALLES AMORIM',
    '05101892297': 'DANILO OLIVEIRA ARAUJO',
    '09879351606': 'DAVID REIS DE MOURA DA PAZ',
    '01169026630': 'DILSON VENTURA SANTOS',
    '08028491642': 'EDILTON LEANDRO DA SILVA',
    '08319123674': 'EDIMILSON JOSE DE OLIVEIRA',
    '37737619100': 'EDIVAINE DIONISIO DA SILVA',
    '05581160600': 'EDMAR JOSE DA COSTA',
    '05791220693': 'ELIDA SIMONE ALVES MOREIRA',
    '97045950691': 'ELIDIO ANTONIO ROSA',
    '02868732658': 'ELIODENES DE OLIVEIRA ROSA',
    '47186690220': 'ELSON RIBEIRO FERREIRA',
    '02188965140': 'ELZA GOMES DE OLIVEIRA SILVA',
    '08507025692': 'ERIVALDO DA SILVA PEREIRA',
    '08056365605': 'EVERTON CASTRO DA SILVA',
    '00371384648': 'EZEQUIEL RAMOS DA SILVA',
    '03997868646': 'FABIO DA SILVA LIMA',
    '02374559190': 'FABIO JOSE DE SOUZA SALVIANO',
    '72537523253': 'FAGNER DOS SANTOS MENDES',
    '08724653659': 'FELIPE JUNIO ALVES MACIEL',
    '09477786756': 'FERNANDO GOMES DE SOUZA',
    '03111072657': 'FERNANDO LIMA DE OLIVEIRA',
    '07230651603': 'FERNANDO SILVA SANTOS',
    '75191628268': 'FRANCISCO AURI SOUZA DE MENEZES',
    '83241795187': 'FRANCISCO DAS CHAGAS FERREIRA NOBREGA',
    '29930510249': 'FRANCISCO PEREIRA LIMA',
    '59716010249': 'FRANCOYS MORAES GONCALVES',
    '26978040215': 'GERMANO DUARTE CARDOSO',
    '09506193614': 'GILSON MENDES DOS SANTOS',
    '06133585625': 'HARLEI BRUNO BADARO',
    '09322179660': 'HEBERTH DA SILVA PEREIRA',
    '07402884660': 'HERITON FREITAS DE CARVALHO',
    '15611761682': 'IGOR FONSECA DE CASTRO',
    '61475459220': 'IRANDIR NUNES AMORIM',
    '06279219658': 'ISAIAS DOS SANTOS LOPES',
    '12196030660': 'ISAIAS FILIPE MATIAS',
    '87588293268': 'JACKSON DA CRUZ OLIVEIRA',
    '01109935510': 'JAIR DE JESUS SANTOS',
    '06710498603': 'JOAILSON DE OLIVEIRA FIGUEIREDO',
    '03031081692': 'JOAO BATISTA DA ROCHA',
    '41961552604': 'JORGE CARLOS BARBALHO',
    '99243741691': 'JOSE CARLOS DOS SANTOS',
    '02789049637': 'JOSE DE SOUZA QUATRINI',
    '60228336392': 'JOSE RAIMUNDO DOS SANTOS MENDONCA',
    '66156882200': 'JOSIMAR CHAGAS FREIRE',
    '00922087113': 'JUVANILDO MARTINS DA SILVA',
    '03951379693': 'KARINA EFIGENIA DA SILVA JOSE',
    '08819083639': 'LAUDENIR PESSOA DE OLIVEIRA',
    '08835146640': 'LEOENDER JUNIOR SILVA',
    '10777167611': 'LUCIANO RODRIGUES FARIA',
    '06895394605': 'LUIZ HENRIQUE MARTINS RAMOS',
    '08515566630': 'MAGNO MAGALHAES LAGE',
    '52823563253': 'MANOEL MESSIAS DOS SANTOS',
    '09807430607': 'MARCELO APARECIDO CIRILO',
    '66413648600': 'MARCELO CIRINO',
    '13188822650': 'MARCELO GONZAGA OLAVO',
    '01477688617': 'MARCELO JOSE DA SILVA',
    '09824907637': 'MARCELO VIERA DE MATOS',
    '03552477128': 'MARCIANO GONCALVES DA SILVA',
    '66570956604': 'MARCIO DA FONSECA VIEIRA',
    '05687211608': 'MARCOS JUNIOR DE SOUZA',
    '05928792670': 'MARCOS TULIO DE OLIVEIRA',
    '05826649267': 'MARLO BRANDO COELHO PEREIRA',
    '42059348668': 'MAURO ROCHA GONCALVES',
    '10445182601': 'MAXIMILIANO MONTEIRO DE SOUSA',
    '09879451651': 'NELMER ALEXANDRE GOMES DE AGUIAR',
    '84427159672': 'NILSON CECILIA BRAGA',
    '66842115272': 'OLIEL NUNES SILVA',
    '08430623639': 'PAULO CESAR DA COSTA JUNIOR',
    '06854983606': 'RAFAEL JUNIO DE PAULA',
    '00948851686': 'RAFAEL RODRIGUES LUIS',
    '75690985368': 'RAIMUNDO NONATO EDUNVINGENE SOUSA',
    '02690147645': 'REGINALDO APARECIDO XAVIER',
    '08057077603': 'RENATO ADRIANO SERAFIM',
    '01466539631': 'RICARDO HENRIQUE DE OLIVEIRA',
    '68619812653': 'ROBERTO RODRIGUES CANDIDO',
    '12025006683': 'RODRIGO TIAGO BRAGA',
    '77090330672': 'ROGERIO DE JESUS BRAGA',
    '96155213534': 'RONALDO ANDRADE DOS SANTOS',
    '27617314841': 'RONALDO NASCIMENTO DE PAIVA',
    '04651595677': 'RONIE CARLOS CARDOSO',
    '02669630219': 'RONILDO ALVES DE FREITAS',
    '03556898632': 'RUBENS NEI DAS CHAGAS',
    '04332235614': 'SANDRO MAGNO DA CRUZ',
    '09629140616': 'TAMIRES CRISTINA CRUZ LOURENCO',
    '07980978170': 'THAIS DE PAIVA FERNANDES',
    '89558430200': 'THOMAS MATEUS MACEDO',
    '08454739645': 'TIAGO DE OLIVEIRA E SILVA',
    '00323815146': 'VALDINEI JOSE DE ALMEIDA',
    '01930813260': 'VALDIRLAN GOMES DA SILVA',
    '76792323187': 'VALDUIR XAVIER PISSARRA',
    '04427071694': 'VALMIR CASSIMIRO LUZIA',
    '00233082654': 'VALTER CARDOSO CORREA',
    '13276949644': 'VICTOR THADEU VIEIRA',
    '03732465608': 'VIVIANE APARECIDA SANTOS ROSA',
    '85408506215': 'WELLINGTON MARCOS NASCIMENTO SANTOS',
    '10284930610': 'WEMERSON DIAS DA MOTA',
    '03751253610': 'WERTHER DA SILVA BRITO',
    '00492483671': 'WILLIAN SILVA BRITO',
    '04482479683': 'WILSON SILVA DA ROCHA',
    '03614068277': 'WIPSLORRANA LIMA DOS SANTOS',
  };

export const getDisplayName = (employee: Employee): string => {
    const cleanCpf = (employee.cpf || employee.document || '').replace(/\D/g, '');
    if (cleanCpf && KNOWN_CPF_NAMES[cleanCpf]) {
      return KNOWN_CPF_NAMES[cleanCpf];
    }
    const currentName = (employee.name || '').trim();
    // Se o nome atual tiver dígitos que correspondem a um CPF no mapa
    const nameDigits = currentName.replace(/\D/g, '');
    if (nameDigits && KNOWN_CPF_NAMES[nameDigits]) {
      return KNOWN_CPF_NAMES[nameDigits];
    }
    // Se o nome for 'CPF:' ou começar com 'CPF:'
    if (/^\s*cpf\s*:?/i.test(currentName)) {
      if (cleanCpf && KNOWN_CPF_NAMES[cleanCpf]) {
        return KNOWN_CPF_NAMES[cleanCpf];
      }
      return employee.registrationNumber ? `COLABORADOR ${employee.registrationNumber}` : 'COLABORADOR';
    }
    // Se o nome contiver 'FUNCIONÁRIO <CPF>', limpa e remove o CPF da frente
    if (/^funcion[aá]rio\s+[\d.-]+/i.test(currentName)) {
      const sanitized = currentName.replace(/^funcion[aá]rio\s+[\d.-]+\s*[-–—]?\s*/i, '').trim();
      if (sanitized && !/^\s*cpf\s*:?/i.test(sanitized)) {
        return sanitized;
      }
      return (cleanCpf && KNOWN_CPF_NAMES[cleanCpf]) || (employee.registrationNumber ? `COLABORADOR ${employee.registrationNumber}` : 'COLABORADOR');
    }
    // Remove qualquer CPF que esteja na frente ou no final do nome
    const stripped = currentName.replace(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}\s*[-–—]?\s*/, '')
                                .replace(/\s*[-–—]?\s*\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, '').trim();
    if (/^\s*cpf\s*:?/i.test(stripped) || !stripped) {
      return (cleanCpf && KNOWN_CPF_NAMES[cleanCpf]) || (employee.registrationNumber ? `COLABORADOR ${employee.registrationNumber}` : 'COLABORADOR');
    }
    return stripped;
  };


export const FuncionariosTable: React.FC<FuncionariosTableProps> = ({
  employees,
  onView,
  onEdit,
  onDelete,
  onBulkDelete,
  onDeactivate,
  onReactivate,
  onTerminate,
  onViewDocuments,
  onViewDependents,
  onCracha,
  isLoading = false
}) => {
  const [sortField, setSortField] = useState<SortField>('hireDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'name' || field === 'position' ? 'asc' : 'desc');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === employees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map(e => e.id)));
    }
  };

    const sortedEmployees = useMemo(() => {
    if (!employees?.length) return [];
    return [...employees].sort((a, b) => {
      if (sortField === 'name') {
        const nameA = getDisplayName(a);
        const nameB = getDisplayName(b);
        const cmp = nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      if (sortField === 'position') {
        const cmp = (a.position?.name || '').localeCompare(b.position?.name || '', 'pt-BR', { sensitivity: 'base' });
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      const valA = sortField === 'hireDate' ? (a.hireDate || '') : (getEmployeeTerminationDate(a) || '');
      const valB = sortField === 'hireDate' ? (b.hireDate || '') : (getEmployeeTerminationDate(b) || '');
      const cmp = valA.localeCompare(valB, 'pt-BR');
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [employees, sortField, sortDirection]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-40 group-hover/head:opacity-100 transition-opacity inline ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-seguranca-yellow font-bold inline ml-1" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-seguranca-yellow font-bold inline ml-1" />
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Ativo
          </span>
        );
      case 'TERMINATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/60 border border-rose-500/40 text-rose-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Demitido
          </span>
        );
      case 'VACATION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/60 border border-blue-500/40 text-blue-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Férias
          </span>
        );
      case 'MEDICAL_CERTIFICATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-950/60 border border-purple-500/40 text-purple-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Atestado
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-950/60 border border-orange-500/40 text-orange-400 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Suspenso
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-800/80 border border-gray-600 text-gray-300 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Inativo
          </span>
        );
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    try {
      const clean = date.includes('T') ? date : (date.length === 10 ? `${date}T00:00:00` : date);
      const parsed = new Date(clean);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('pt-BR');
      }
    } catch (_err) {
      // Ignorar data mal formatada
    }
    return '-';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="h-20 bg-seguranca-black/50 animate-pulse rounded-xl border border-gray-700/40"
          />
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-16">
        <User className="h-16 w-16 mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg font-medium">Nenhum funcionário encontrado</p>
        <p className="text-gray-500 text-sm mt-2">
          Tente ajustar os filtros ou adicione um novo funcionário
        </p>
      </div>
    );
  }

  const allSelected = employees.length > 0 && selectedIds.size === employees.length;

  return (
    <>
      {/* Barra de Ações em Massa (Exclusão em Lote) */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-red-950/70 via-slate-900 to-red-950/50 border border-red-500/50 rounded-2xl px-4 py-3 mb-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold shadow-md shadow-red-950">
              {selectedIds.size}
            </span>
            <span className="text-sm font-semibold text-gray-200">
              colaborador(es) selecionado(s) de <strong className="text-amber-400">{employees.length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-300 hover:text-white hover:bg-slate-800 h-9 px-3 rounded-xl"
            >
              Desmarcar Todos
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (onBulkDelete) {
                  onBulkDelete(Array.from(selectedIds));
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 px-4 gap-2 rounded-xl shadow-lg shadow-rose-950/50 transition-all active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
              <span>Desativar / Excluir da Lista ({selectedIds.size})</span>
            </Button>
          </div>
        </div>
      )}

      {/* Desktop View - Table (Ajustada para caber perfeitamente na tela) */}
      <div className="hidden lg:block rounded-2xl border border-gray-800/80 overflow-x-auto bg-[#12141a]">
        <Table className="w-full text-xs">
          <TableHeader>
            <TableRow className="bg-[#161820] hover:bg-[#1a1d26] border-b border-gray-800/90">
              
              {/* Checkbox Circular */}
              <TableHead className="w-9 px-1 text-center h-10">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={`w-4 h-4 rounded-full border transition-colors inline-flex items-center justify-center cursor-pointer ${
                    allSelected 
                      ? 'border-seguranca-red bg-seguranca-red text-white' 
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  title="Selecionar todos"
                >
                  {allSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </button>
              </TableHead>

              {/* Funcionário */}
              <TableHead 
                className="text-amber-400 font-bold text-[11px] uppercase tracking-wider cursor-pointer select-none group/head px-2 h-10 min-w-[170px] max-w-[210px]"
                onClick={() => handleSort('name')}
              >
                Funcionário{renderSortIcon('name')}
              </TableHead>

              {/* Cargo/Função */}
              <TableHead 
                className="text-amber-400 font-bold text-[11px] uppercase tracking-wider cursor-pointer select-none group/head px-2 h-10 min-w-[110px] max-w-[150px]"
                onClick={() => handleSort('position')}
              >
                Cargo/Função{renderSortIcon('position')}
              </TableHead>

              {/* Empresa */}
              <TableHead className="text-amber-400 font-bold text-[11px] uppercase tracking-wider px-1 text-center h-10 w-[55px]">
                Empresa
              </TableHead>

              {/* Setor de Trabalho */}
              <TableHead className="text-amber-400 font-bold text-[11px] uppercase tracking-wider px-1.5 h-10 min-w-[90px] max-w-[125px]">
                Setor
              </TableHead>

              {/* Escala */}
              <TableHead className="text-amber-400 font-bold text-[11px] uppercase tracking-wider px-1 text-center h-10 w-[70px]">
                Escala
              </TableHead>

              {/* Horário */}
              <TableHead className="text-amber-400 font-bold text-[11px] uppercase tracking-wider px-1 text-center h-10 w-[65px]">
                Horário
              </TableHead>

              {/* Admissão */}
              <TableHead 
                className="text-amber-400 font-bold text-[11px] uppercase tracking-wider cursor-pointer select-none group/head px-1 text-center h-10 w-[82px]"
                onClick={() => handleSort('hireDate')}
              >
                Admissão{renderSortIcon('hireDate')}
              </TableHead>

              {/* Demissão */}
              <TableHead 
                className="text-amber-400 font-bold text-[11px] uppercase tracking-wider cursor-pointer select-none group/head px-1 text-center h-10 w-[82px]"
                onClick={() => handleSort('terminationDate')}
              >
                Demissão{renderSortIcon('terminationDate')}
              </TableHead>

              {/* Status */}
              <TableHead className="text-amber-400 font-bold text-[11px] uppercase tracking-wider px-1 text-center h-10 w-[80px]">
                Status
              </TableHead>

              {/* Ações */}
              <TableHead className="text-amber-400 font-bold text-[11px] uppercase tracking-wider w-[68px] text-right pr-2 pl-1 h-10">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedEmployees.map((employee, index) => {
              const isSelected = selectedIds.has(employee.id);
              const workSector = (employee as any).department?.name || employee.unit?.name || employee.workPost?.name;
              const companySigla = employee.company?.sigla || (employee as any).empresaNome || (employee as any).companyName || 'VIG';
              const escala = employee.escalaTrabalho || employee.currentScale || employee.diasTrabalho;
              const horario = employee.horarioTrabalho || (employee as any).workSchedule;

              return (
                <TableRow 
                  key={employee.id}
                  onClick={() => onView?.(employee)}
                  className={`border-b border-gray-800/60 hover:bg-[#1a1e29] cursor-pointer transition-colors duration-150 group ${
                    isSelected ? 'bg-red-950/20' : ''
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Checkbox Circular */}
                  <TableCell className="w-9 px-1 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggleSelect(employee.id)}
                      className={`w-4 h-4 rounded-full border transition-colors inline-flex items-center justify-center cursor-pointer ${
                        isSelected 
                          ? 'border-seguranca-red bg-seguranca-red text-white' 
                          : 'border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </button>
                  </TableCell>

                  {/* Funcionário (Avatar Vermelho + Nome Caixa Alta + CPF) */}
                  <TableCell className="px-2 py-2 min-w-[170px] max-w-[210px]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-red-600/15 border border-red-500/30 flex items-center justify-center shrink-0 text-red-500">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div 
                          className="font-bold text-white text-xs uppercase tracking-wide group-hover:text-amber-300 transition-colors truncate block"
                          title={getDisplayName(employee)}
                        >
                          {getDisplayName(employee)}
                        </div>
                        {employee.cpf ? (
                          <div className="text-[10px] text-gray-500 font-mono leading-tight truncate">
                            CPF: {employee.cpf}
                          </div>
                        ) : employee.registrationNumber ? (
                          <div className="text-[10px] text-gray-500 font-mono leading-tight truncate">
                            Mat: {employee.registrationNumber}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>

                  {/* Cargo/Função */}
                  <TableCell className="px-2 py-2 min-w-[110px] max-w-[150px]">
                    <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium">
                      <Building className="h-3 w-3 text-gray-500 shrink-0" />
                      <span className="truncate block" title={employee.position?.name || 'Não definido'}>
                        {employee.position?.name || 'Não definido'}
                      </span>
                    </div>
                  </TableCell>

                  {/* Empresa */}
                  <TableCell className="px-1 py-2 text-center w-[55px]">
                    <span className="inline-block px-1.5 py-0.5 rounded bg-gray-800/80 border border-gray-700/60 text-[11px] font-bold text-white tracking-wider">
                      {companySigla}
                    </span>
                  </TableCell>

                  {/* Setor de Trabalho */}
                  <TableCell className="px-1.5 py-2 min-w-[90px] max-w-[125px]">
                    <div className="flex items-center gap-1 text-xs text-gray-300">
                      <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                      <span className="truncate block uppercase font-medium" title={workSector || 'não definido'}>
                        {workSector || <span className="italic text-gray-500 lowercase">não definido</span>}
                      </span>
                    </div>
                  </TableCell>

                  {/* Escala */}
                  <TableCell className="px-1 py-2 text-center w-[70px]">
                    <span className="text-xs font-medium text-gray-300 uppercase truncate block" title={escala || 'não definida'}>
                      {escala || <span className="text-gray-500 italic text-[11px] lowercase">não def.</span>}
                    </span>
                  </TableCell>

                  {/* Horário */}
                  <TableCell className="px-1 py-2 text-center w-[65px]">
                    <span className="text-xs font-medium text-gray-300 truncate block" title={horario || '-'}>
                      {horario || <span className="text-gray-500 italic text-xs">-</span>}
                    </span>
                  </TableCell>

                  {/* Admissão */}
                  <TableCell className="px-1 py-2 text-center w-[82px]">
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-300 whitespace-nowrap">
                      <Calendar className="h-3 w-3 text-gray-500 shrink-0" />
                      <span>{formatDate(employee.hireDate)}</span>
                    </div>
                  </TableCell>

                  {/* Demissão */}
                  <TableCell className="px-1 py-2 text-center w-[82px]">
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-300 whitespace-nowrap">
                      <Calendar className="h-3 w-3 text-gray-500 shrink-0" />
                      <span>{formatDate(getEmployeeTerminationDate(employee))}</span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="px-1 py-2 text-center w-[80px]">
                    {getStatusBadge(employee.status || 'INACTIVE')}
                  </TableCell>

                  {/* Ações: Olho + Menu Dropdown */}
                  <TableCell className="text-right pr-2 pl-1 py-2 w-[68px]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {/* Botão de Olho (Visualizar) Direto na Linha */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView?.(employee);
                        }}
                        className="h-7 w-7 p-0 text-sky-400 hover:text-sky-300 hover:bg-sky-500/15 rounded-lg transition-colors"
                        title="Visualizar Detalhes"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      {/* Menu 3 Pontinhos */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent 
                          align="end" 
                          className="bg-[#12141c]/95 border-gray-800 w-56 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md"
                        >
                          {/* 1. Visualizar Detalhes */}
                          <DropdownMenuItem 
                            onClick={() => onView?.(employee)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300 cursor-pointer rounded-xl text-xs font-semibold"
                          >
                            <Eye className="h-4 w-4" />
                            Visualizar Detalhes
                          </DropdownMenuItem>

                          {/* 2. Editar Funcionário */}
                          <DropdownMenuItem 
                            onClick={() => onEdit(employee)}
                            className="flex items-center gap-2.5 px-3 py-2 text-gray-200 hover:bg-gray-800 hover:text-white cursor-pointer rounded-xl text-xs font-medium"
                          >
                            <Edit className="h-4 w-4 text-gray-400" />
                            Editar Funcionário
                          </DropdownMenuItem>

                          {/* 3. Ver Documentos */}
                          <DropdownMenuItem 
                            onClick={() => onViewDocuments(employee)}
                            className="flex items-center gap-2.5 px-3 py-2 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 cursor-pointer rounded-xl text-xs font-medium"
                          >
                            <FileText className="h-4 w-4" />
                            Ver Documentos
                          </DropdownMenuItem>

                          {/* 4. Crachá / QR Code */}
                          <DropdownMenuItem 
                            onClick={() => onCracha ? onCracha(employee) : onView?.(employee)}
                            className="flex items-center gap-2.5 px-3 py-2 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 cursor-pointer rounded-xl text-xs font-medium"
                          >
                            <QrCode className="h-4 w-4" />
                            Crachá / QR Code
                          </DropdownMenuItem>

                          {/* 5. Ver Dependentes */}
                          <DropdownMenuItem 
                            onClick={() => onViewDependents(employee)}
                            className="flex items-center gap-2.5 px-3 py-2 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 cursor-pointer rounded-xl text-xs font-medium"
                          >
                            <UserPlus className="h-4 w-4" />
                            Ver Dependentes
                          </DropdownMenuItem>

                          {/* 6. Desativar da Lista (se ativo) */}
                          {employee.status === 'ACTIVE' ? (
                            <DropdownMenuItem 
                              onClick={() => (onDeactivate ? onDeactivate(employee) : onDelete(employee))}
                              className="flex items-center gap-2.5 px-3 py-2 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 cursor-pointer rounded-xl text-xs font-medium border-t border-gray-800/80 mt-1 pt-2"
                            >
                              <UserMinus className="h-4 w-4" />
                              Desativar da Lista
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => onReactivate?.(employee)}
                              className="flex items-center gap-2.5 px-3 py-2 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 cursor-pointer rounded-xl text-xs font-medium border-t border-gray-800/80 mt-1 pt-2"
                            >
                              <UserCheck className="h-4 w-4" />
                              Reativar Colaborador
                            </DropdownMenuItem>
                          )}

                          {/* 7. Demitir Funcionário (se não demitido) */}
                          {employee.status !== 'TERMINATED' && (
                            <DropdownMenuItem 
                              onClick={() => onTerminate(employee)}
                              className="flex items-center gap-2.5 px-3 py-2 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 cursor-pointer rounded-xl text-xs font-medium"
                            >
                              <UserMinus className="h-4 w-4" />
                              Demitir Funcionário
                            </DropdownMenuItem>
                          )}

                          {/* 8. Excluir da Lista (Inativar com Histórico Preservado) */}
                          <DropdownMenuItem 
                            onClick={() => onDelete(employee)}
                            className="flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer rounded-xl text-xs font-medium border-t border-gray-800/80 mt-1 pt-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir da Lista (Inativar)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View - Cards */}
      <div className="lg:hidden space-y-4">
        {sortedEmployees.map((employee, index) => {
          const workSector = (employee as any).department?.name || employee.unit?.name || employee.workPost?.name;
          const companySigla = employee.company?.sigla || (employee as any).empresaNome || (employee as any).companyName || 'VIG';
          const escala = employee.escalaTrabalho || employee.currentScale || employee.diasTrabalho;
          const horario = employee.horarioTrabalho || (employee as any).workSchedule;

          return (
            <Card 
              key={employee.id}
              onClick={() => onView?.(employee)}
              className="bg-[#161820] border-gray-800 hover:border-red-500/40 cursor-pointer transition-all duration-300 overflow-hidden group rounded-2xl"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Checkbox Circular Mobile */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(employee.id);
                      }}
                      className={`w-5 h-5 mt-1 rounded-full border transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer ${
                        selectedIds.has(employee.id)
                          ? 'border-seguranca-red bg-seguranca-red text-white' 
                          : 'border-gray-600 hover:border-gray-400'
                      }`}
                      title={selectedIds.has(employee.id) ? "Desmarcar" : "Selecionar"}
                    >
                      {selectedIds.has(employee.id) && <Check className="h-3 w-3 stroke-[3]" />}
                    </button>

                    <div className="p-2 rounded-xl bg-red-600/15 border border-red-500/30 text-red-500 shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white uppercase text-sm tracking-wide truncate group-hover:text-amber-300 transition-colors">
                        {getDisplayName(employee)}
                      </h3>
                      {employee.cpf ? (
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          CPF: {employee.cpf}
                        </p>
                      ) : employee.registrationNumber ? (
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          Mat: {employee.registrationNumber}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {getStatusBadge(employee.status || 'INACTIVE')}
                </div>

                {/* Info */}
                <div className="space-y-2 text-xs text-gray-300 pt-1">
                  {employee.position?.name && (
                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                      <span>{employee.position.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span className="font-bold text-white">Empresa: {companySigla}</span>
                  </div>
                  {workSector && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="uppercase">{workSector}</span>
                    </div>
                  )}
                  {escala && (
                    <div className="flex items-center gap-2 text-amber-400 font-medium">
                      <span>Escala: {escala}</span>
                      {horario && <span className="text-gray-400">• {horario}</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-gray-400 pt-1 border-t border-gray-800">
                    <span>Adm: {formatDate(employee.hireDate)}</span>
                    {getEmployeeTerminationDate(employee) && (
                      <span>Dem: {formatDate(getEmployeeTerminationDate(employee))}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-800" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView?.(employee)}
                    className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10 flex-1 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Visualizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(employee)}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 flex-1 text-xs"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDocuments(employee)}
                    className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 flex-1 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Docs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(employee)}
                    className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs px-2.5"
                    title="Desativar / Excluir da Lista (Preserva Histórico no Banco)"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
};
