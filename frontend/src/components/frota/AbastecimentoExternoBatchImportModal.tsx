import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import fleetService from '@/services/fleetService';
import { contasAPagarService, Supplier } from '@/services/contasAPagarService';
import { stockNfeService } from '@/services/stockNfeService';
import { clientService } from '@/services/clientService';
import { contractService } from '@/services/contractService';
import { workPostService } from '@/services/workPostService';
import { Vehicle } from '@/types/fleet';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import {
  Upload,
  FileText,
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Trash2,
  Loader2,
  Layers,
  Sparkles,
  PlusCircle,
  Truck,
  Fuel,
  Receipt,
} from 'lucide-react';

interface AbastecimentoExternoBatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  veiculos: Vehicle[];
}

export interface BatchInvoiceRow {
  id: string;
  file: File;
  fileName: string;
  fileType: 'XML' | 'PDF';
  invoiceNumber: string;
  series: string;
  accessKey: string;
  issueDate: string; // YYYY-MM-DD
  supplierName: string;
  supplierTradeName: string;
  supplierCnpj: string;
  supplierAddress?: string;
  supplierCity?: string;
  supplierState?: string;
  supplierZipCode?: string;
  supplierPhone?: string;
  fuelType: 'DIESEL' | 'GASOLINE' | 'ETHANOL' | 'FLEX';
  liters: number;
  pricePerLiter: number;
  totalValue: number;
  vehicleId: string;
  detectedPlate: string;
  mileage: number;
  notes: string;
  parseWarning?: string;
  alreadyImported?: boolean;
  duplicateWarning?: string;
}

function cleanDigits(val?: string): string {
  return (val || '').replace(/\D/g, '');
}

function formatCnpj(cnpj?: string): string {
  const d = cleanDigits(cnpj);
  if (d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
  }
  return cnpj || '';
}

function normalizeName(str?: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function sanitizeSupplierName(raw?: string): string {
  if (!raw) return '';
  const cleaned = raw
    .replace(/^.*?RECEBEMOS\s+DE\s+/i, '')
    .replace(/\s*OS\s+PRODUTOS.*$/i, '')
    .replace(/\s*AS\s+MERCADORIAS.*$/i, '')
    .replace(/\s*CONSTANTES\s+DA.*$/i, '')
    .replace(/\s*NOTA\s+FISCAL.*$/i, '')
    .replace(/^(?:IDENTIFICA[ÇC][ÃA]O\s+DO\s+EMITENTE|RAZ[ÃA]O\s+SOCIAL|NOME\/RAZ[ÃA]O\s+SOCIAL|NOME\s+FANTASIA|EMITENTE)\s*[:.-]?\s*/i, '')
    .replace(/\bCNPJ(?:\s*\/\s*CPF)?\s*[:.]?.*$/i, '')
    .replace(/\bCPF\s*[:.]?.*$/i, '')
    .replace(/\bI\.?E\.?\s*[:.]?.*$/i, '')
    .replace(/\bINSC(?:\.?|\s+ESTADUAL).*$/i, '')
    .replace(/\bDANFE.*$/i, '')
    .replace(/\bDOCUMENTO\s+AUXILIAR.*$/i, '')
    .replace(/^[\s:;.,/-]+|[\s:;.,/-]+$/g, '')
    .trim();

  const upperNoAccents = cleaned
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const withoutLabels = upperNoAccents
    .replace(
      /\b(CNPJ|CPF|IE|INSC|INSCRICAO|ESTADUAL|MUNICIPAL|CEP|UF|FONE|FAX|TEL|TELEFONE|DATA|HORA|EMISSAO|SAIDA|ENTRADA|SERIE|FOLHA|PAGINA|NF|NFE|DANFE|CHAVE|ACESSO|PROTOCOLO|VALOR|TOTAL|NOTA|FISCAL|NUMERO|EMITENTE|DESTINATARIO|REMETENTE)\b/g,
      ''
    )
    .replace(/[^A-Z]/g, '')
    .trim();

  if (withoutLabels.length < 3) return '';
  return cleaned;
}

function normalizeIsoDate(raw: any): string {
  if (!raw) return '';
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, m, d] = raw;
    return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const str = String(raw).trim();
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
  return '';
}

function extractFromAccessKey(accessKey?: string): { cnpj: string; yearMonth: string; nfNumber: string } {
  const digits = cleanDigits(accessKey);
  if (digits.length !== 44) return { cnpj: '', yearMonth: '', nfNumber: '' };
  const yy = digits.slice(2, 4);
  const mm = digits.slice(4, 6);
  const cnpjDigits = digits.slice(6, 20);
  const nfRaw = digits.slice(25, 34).replace(/^0+(?!$)/, '');
  const monthNum = Number(mm);
  const yearMonth = monthNum >= 1 && monthNum <= 12 ? `20${yy}-${mm}` : '';
  return {
    cnpj: formatCnpj(cnpjDigits),
    yearMonth,
    nfNumber: nfRaw,
  };
}

function detectFuelTypeFromDescription(desc: string): 'DIESEL' | 'GASOLINE' | 'ETHANOL' | 'FLEX' {
  const upper = (desc || '').toUpperCase();
  if (upper.includes('ETANOL') || upper.includes('ALCOOL') || upper.includes('ÁLCOOL')) {
    return 'ETHANOL';
  }
  if (upper.includes('GASOLINA')) {
    return 'GASOLINE';
  }
  return 'DIESEL';
}

function formatPlate(plate?: string): string {
  if (!plate) return '';
  const clean = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (clean.length === 7) {
    if (/^[A-Z]{3}[0-9]{4}$/.test(clean)) {
      return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }
    return clean;
  }
  return plate;
}

function extractPlateAndKmFromText(
  text: string,
  veiculosList?: Vehicle[]
): { plate: string; km: number; matchedVehicleId?: string } {
  if (!text) return { plate: '', km: 0 };
  const upper = text.toUpperCase();

  let rawPlate = '';

  // 1. Rótulo explícito com placa: PLACA: ABC-1234, PLACA ABC1D23, PLACA:ABC1234, PL: ABC-1234, VEIC: ABC-1234, CARRO: ABC-1234, AUTO: ABC-1234
  const labeledMatch =
    upper.match(/(?:PLACA|PL\.?|VE[ÍI]C(?:ULO)?|CARRO|FROTA|AUTO)\s*[:=-]?\s*([A-Z]{3}[-\s]?[0-9][A-Z0-9][0-9]{2})\b/) ||
    upper.match(/PLACA[:\s-]*([A-Z]{3}[-\s]?[0-9][A-Z0-9][0-9]{2})/);

  if (labeledMatch) {
    rawPlate = labeledMatch[1].replace(/[^A-Z0-9]/g, '');
  }

  // 2. Padrão Mercosul (3 letras + 1 dígito + 1 letra + 2 dígitos, ex: BRA2E19)
  if (!rawPlate) {
    const mercosulMatch = upper.match(/\b([A-Z]{3}[0-9][A-Z][0-9]{2})\b/);
    if (mercosulMatch) {
      rawPlate = mercosulMatch[1].replace(/[^A-Z0-9]/g, '');
    }
  }

  // 3. Padrão tradicional com traço ou espaço: ABC-1234
  if (!rawPlate) {
    const oldMatch = upper.match(/\b([A-Z]{3}[-\s][0-9]{4})\b/);
    if (oldMatch) {
      rawPlate = oldMatch[1].replace(/[^A-Z0-9]/g, '');
    }
  }

  let matchedVehicleId: string | undefined;

  // 4. Cruzamento direto com a frota cadastrada (por placa ou prefixo/frota)
  if (Array.isArray(veiculosList) && veiculosList.length > 0) {
    if (rawPlate) {
      const found = veiculosList.find((v) => {
        const vp = (v.plate || (v as any).placa || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
        return vp === rawPlate;
      });
      if (found) {
        matchedVehicleId = found.id;
      }
    }

    // Busca direta pelas placas cadastradas no texto da nota
    if (!matchedVehicleId) {
      for (const v of veiculosList) {
        const vp = (v.plate || (v as any).placa || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (vp.length === 7) {
          const vHyphen = `${vp.slice(0, 3)}-${vp.slice(3)}`;
          if (upper.includes(vp) || upper.includes(vHyphen)) {
            rawPlate = vp;
            matchedVehicleId = v.id;
            break;
          }
        }
      }
    }

    // Busca por número de frota / prefixo (ex: FROTA: 1020, PREFIXO: 1020, CARRO: 1020, #1020)
    if (!matchedVehicleId) {
      for (const v of veiculosList) {
        const pfx = String(v.fleetNumber || (v as any).prefixo || '').trim();
        if (pfx.length >= 2) {
          const pfxRegex = new RegExp(`(?:PREFIXO|FROTA|CARRO|VE[ÍI]C(?:ULO)?|AUTO|#)\\s*[:=-]?\\s*\\b0*${pfx}\\b`, 'i');
          if (pfxRegex.test(upper)) {
            matchedVehicleId = v.id;
            const vp = (v.plate || (v as any).placa || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
            if (vp) rawPlate = vp;
            break;
          }
        }
      }
    }
  }

  // KM / Hodômetro
  const kmMatch =
    upper.match(/(?:KM(?:\s*ATUAL|\s*FINAL|\s*RODADO|\s*VE[ÍI]CULO)?|HOD[ÔO]METRO|OD[ÔO]METRO|HOD\.?|ODO\.?|QUILOMETRAGEM)\s*[:=-]?\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]{2,7})(?:\s*KM)?\b/) ||
    upper.match(/(?:KM|HODOMETRO|HODÔMETRO|ODOMETRO|ODÔMETRO)[:\s]*([0-9]{1,3}(?:\.?[0-9]{3})+|[0-9]{2,7})/);
  const km = kmMatch ? Number(kmMatch[1].replace(/\./g, '')) : 0;

  return { plate: rawPlate, km: isNaN(km) ? 0 : km, matchedVehicleId };
}

const AbastecimentoExternoBatchImportModal: React.FC<AbastecimentoExternoBatchImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  veiculos,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentYearMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [competenceMonth, setCompetenceMonth] = useState<string>(currentYearMonth);
  const [rows, setRows] = useState<BatchInvoiceRow[]>([]);
  const [parsingFiles, setParsingFiles] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Dados consolidados do fornecedor do lote
  const [batchSupplierName, setBatchSupplierName] = useState('');
  const [batchSupplierTradeName, setBatchSupplierTradeName] = useState('');
  const [batchSupplierCnpj, setBatchSupplierCnpj] = useState('');
  const [batchSupplierCity, setBatchSupplierCity] = useState('');
  const [batchSupplierState, setBatchSupplierState] = useState('');
  const [batchSupplierAddress, setBatchSupplierAddress] = useState('');
  const [batchSupplierPhone, setBatchSupplierPhone] = useState('');
  const [selectedExistingSupplierId, setSelectedExistingSupplierId] = useState<string>('');

  // Vínculo padrão em lote (Veículo, Cliente, Obra, Contrato)
  const [defaultVehicleId, setDefaultVehicleId] = useState<string>('');
  const [defaultClientId, setDefaultClientId] = useState<string>('');
  const [defaultClientName, setDefaultClientName] = useState<string>('');
  const [defaultWorkPostId, setDefaultWorkPostId] = useState<string>('');
  const [defaultObraName, setDefaultObraName] = useState<string>('');
  const [defaultContractId, setDefaultContractId] = useState<string>('');
  const [defaultContractNumber, setDefaultContractNumber] = useState<string>('');

  // Integração com Fechamento Mensal / Despesas
  const [createFinancialClosing, setCreateFinancialClosing] = useState<boolean>(true);
  const [closingDueDate, setClosingDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });

  // Consultas de dados auxiliares
  const { data: suppliers = [], refetch: refetchSuppliers } = useQuery({
    queryKey: ['suppliers-all-batch'],
    queryFn: () => contasAPagarService.getFornecedores(),
    enabled: isOpen,
  });

  const { data: existingFuelRecords = [] } = useQuery({
    queryKey: ['fuelRecords'],
    queryFn: () => fleetService.getFuelRecords(),
    enabled: isOpen,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAllClients(),
    enabled: isOpen,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => contractService.getAllContracts(),
    enabled: isOpen,
  });

  const { data: workPosts = [] } = useQuery({
    queryKey: ['workPosts'],
    queryFn: () => workPostService.getAllWorkPosts(),
    enabled: isOpen,
  });

  // Verifica se uma Nota Fiscal já foi importada anteriormente no Abastecimento Externo
  const checkInvoiceAlreadyImported = useCallback(
    (
      nfNumber?: string,
      accessKey?: string,
      supplierCnpj?: string,
      supplierName?: string
    ): { alreadyImported: boolean; reason?: string } => {
      const records = Array.isArray(existingFuelRecords) ? existingFuelRecords : [];
      if (records.length === 0) return { alreadyImported: false };

      const cleanKey = cleanDigits(accessKey);
      if (cleanKey.length === 44) {
        const byKey = records.find((rec: any) => String(rec?.notes || '').includes(cleanKey));
        if (byKey) {
          return {
            alreadyImported: true,
            reason: `A chave de acesso desta NF (${nfNumber || cleanKey.slice(25, 34)}) já consta importada no Abastecimento Externo.`,
          };
        }
      }

      const cleanNf = (nfNumber || '').trim().replace(/^0+(?!$)/, '');
      if (cleanNf) {
        const nfRegex = new RegExp(`NF:\\s*0*${cleanNf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\b|\\s|\\||$)`, 'i');
        const targetCnpj = cleanDigits(supplierCnpj);
        const targetRoot = targetCnpj.length >= 8 ? targetCnpj.slice(0, 8) : '';
        const targetSupNorm = normalizeName(supplierName);

        const byNf = records.find((rec: any) => {
          const notes = String(rec?.notes || '');
          if (!nfRegex.test(notes)) return false;

          const notesDigits = cleanDigits(notes);
          if (targetCnpj.length === 14 && notesDigits.includes(targetCnpj)) return true;
          if (targetRoot.length === 8 && notesDigits.includes(targetRoot)) return true;

          const stationNorm = normalizeName(rec?.station || '');
          if (targetSupNorm.length >= 4 && stationNorm.length >= 4) {
            if (stationNorm.includes(targetSupNorm) || targetSupNorm.includes(stationNorm)) return true;
          }

          // Se não houver CNPJ para distinguir mas a NF já consta no Abastecimento Externo
          if (!targetCnpj && notes.toUpperCase().includes('ABASTECIMENTO EXTERNO')) {
            return true;
          }
          return false;
        });

        if (byNf) {
          return {
            alreadyImported: true,
            reason: `A Nota Fiscal nº ${cleanNf} já foi importada anteriormente (${byNf.station || 'Abastecimento Externo'}).`,
          };
        }
      }

      return { alreadyImported: false };
    },
    [existingFuelRecords]
  );

  const vehicleOptions: SearchableOption[] = useMemo(
    () =>
      veiculos.map((v) => {
        const plate = v.plate || (v as any).placa || '';
        const prefix = v.fleetNumber || (v as any).prefixo || '';
        return {
          value: v.id,
          label: prefix ? `${plate} (${prefix})` : plate,
          subtitle: `${v.brand || ''} ${v.model || ''}`.trim(),
          keywords: [plate.replace(/[^A-Z0-9]/gi, ''), prefix],
        };
      }),
    [veiculos]
  );

  const clientOptions: SearchableOption[] = useMemo(
    () =>
      (Array.isArray(clients) ? clients : []).map((c: any) => ({
        value: String(c.id),
        label: c.name || c.companyName || c.razaoSocial || 'Cliente',
        subtitle: c.cnpj || c.cpf || '',
      })),
    [clients]
  );

  const workPostOptions: SearchableOption[] = useMemo(
    () =>
      (Array.isArray(workPosts) ? workPosts : []).map((wp: any) => ({
        value: String(wp.id),
        label: wp.name || wp.description || `Obra #${wp.id}`,
        subtitle: wp.clientName || wp.city || '',
      })),
    [workPosts]
  );

  const contractOptions: SearchableOption[] = useMemo(
    () =>
      (Array.isArray(contracts) ? contracts : []).map((ct: any) => ({
        value: String(ct.id),
        label: ct.contractNumber || ct.number || ct.title || `Contrato #${ct.id}`,
        subtitle: ct.clientName || '',
      })),
    [contracts]
  );

  const supplierOptions: SearchableOption[] = useMemo(
    () =>
      (Array.isArray(suppliers) ? suppliers : []).map((s: Supplier) => ({
        value: String(s.id),
        label: s.tradeName || s.name,
        subtitle: s.cnpj || s.registrationNumber || s.city || '',
        keywords: [cleanDigits(s.cnpj || s.registrationNumber), s.name, s.tradeName || ''],
      })),
    [suppliers]
  );

  // Verifica se o fornecedor detectado já existe no banco (por CNPJ exato, raiz de CNPJ ou Nome)
  const matchedSupplier = useMemo(() => {
    if (selectedExistingSupplierId) {
      return suppliers.find((s) => String(s.id) === String(selectedExistingSupplierId)) || null;
    }
    const targetCnpj = cleanDigits(batchSupplierCnpj);
    if (targetCnpj.length >= 11) {
      const byCnpj = suppliers.find(
        (s) => cleanDigits(s.cnpj || s.registrationNumber) === targetCnpj
      );
      if (byCnpj) return byCnpj;

      // Verifica mesma raiz de CNPJ (8 primeiros dígitos — matriz/filial do mesmo posto)
      if (targetCnpj.length === 14) {
        const root = targetCnpj.slice(0, 8);
        const byRoot = suppliers.find((s) => {
          const sc = cleanDigits(s.cnpj || s.registrationNumber);
          return sc.length === 14 && sc.slice(0, 8) === root;
        });
        if (byRoot) return byRoot;
      }
    }
    const targetName = normalizeName( sanitizeSupplierName(batchSupplierName) || sanitizeSupplierName(batchSupplierTradeName) );
    if (targetName.length >= 3) {
      const byName = suppliers.find(
        (s) =>
          normalizeName(s.name) === targetName ||
          normalizeName(s.tradeName) === targetName ||
          (normalizeName(s.name).length > 4 && targetName.includes(normalizeName(s.name)))
      );
      if (byName) return byName;
    }
    return null;
  }, [suppliers, batchSupplierCnpj, batchSupplierName, batchSupplierTradeName, selectedExistingSupplierId]);

  // Sempre que encontrar um fornecedor cadastrado ou consultar CNPJ na Receita/BrasilAPI, sincroniza o nome se estiver vazio ou inválido
  useEffect(() => {
    const cleanCurrentName = sanitizeSupplierName(batchSupplierName);
    if (matchedSupplier) {
      const officialName = sanitizeSupplierName(matchedSupplier.name || matchedSupplier.tradeName);
      const officialTrade = sanitizeSupplierName(matchedSupplier.tradeName || matchedSupplier.name);
      if (!cleanCurrentName && officialName) {
        setBatchSupplierName(officialName);
        setBatchSupplierTradeName(officialTrade || officialName);
      }
      if (!batchSupplierCnpj && (matchedSupplier.cnpj || matchedSupplier.registrationNumber)) {
        setBatchSupplierCnpj(formatCnpj(matchedSupplier.cnpj || matchedSupplier.registrationNumber));
      }
      return;
    }

    const cnpjDigits = cleanDigits(batchSupplierCnpj);
    if (!cleanCurrentName && cnpjDigits.length === 14) {
      // 1. Tenta localizar nos abastecimentos anteriores pelo CNPJ
      const prevRecord = (Array.isArray(existingFuelRecords) ? existingFuelRecords : []).find((rec: any) => {
        const notesDigits = cleanDigits(String(rec?.notes || ''));
        return (
          (notesDigits.includes(cnpjDigits) || notesDigits.includes(cnpjDigits.slice(0, 8))) &&
          sanitizeSupplierName(rec?.station)
        );
      });
      if (prevRecord && sanitizeSupplierName(prevRecord.station)) {
        const resolved = sanitizeSupplierName(prevRecord.station);
        setBatchSupplierName(resolved);
        setBatchSupplierTradeName(resolved);
        return;
      }

      // 2. Consulta BrasilAPI (Receita Federal) pelo CNPJ para preencher Razão Social automaticamente
      let cancelled = false;
      fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjDigits}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled || !data) return;
          const razao = sanitizeSupplierName(data.razao_social || data.nome_fantasia);
          const fantasia = sanitizeSupplierName(data.nome_fantasia || data.razao_social);
          if (razao) {
            setBatchSupplierName((prev) => sanitizeSupplierName(prev) || razao);
            setBatchSupplierTradeName((prev) => sanitizeSupplierName(prev) || fantasia || razao);
            setRows((prevRows) =>
              prevRows.map((r) => ({
                ...r,
                supplierName: sanitizeSupplierName(r.supplierName) || razao,
                supplierTradeName: sanitizeSupplierName(r.supplierTradeName) || fantasia || razao,
              }))
            );
          }
          if (data.municipio) setBatchSupplierCity((prev) => prev || data.municipio);
          if (data.uf) setBatchSupplierState((prev) => prev || data.uf);
          if (data.logradouro) {
            const addr = [data.logradouro, data.numero, data.bairro].filter(Boolean).join(', ');
            setBatchSupplierAddress((prev) => prev || addr);
          }
          if (data.ddd_telefone_1) setBatchSupplierPhone((prev) => prev || data.ddd_telefone_1);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
  }, [matchedSupplier, batchSupplierCnpj, batchSupplierName, existingFuelRecords]);

  const matchVehicleByPlate = (rawPlate: string): string => {
    if (!rawPlate) return '';
    const clean = rawPlate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    const found = veiculos.find((v) => {
      const vp = (v.plate || (v as any).placa || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
      return vp === clean;
    });
    return found?.id || '';
  };

  // Parser local de XML (NF-e / NFC-e) resiliente a namespaces SEFAZ
  const parseXmlFile = async (file: File): Promise<Partial<BatchInvoiceRow> | null> => {
    try {
      const xmlText = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      if (xmlDoc.querySelector('parsererror')) return null;

      const getTag = (parent: Document | Element | null, tag: string): string => {
        if (!parent) return '';
        const byNs = parent.getElementsByTagName(tag)?.[0]?.textContent;
        if (byNs !== undefined && byNs !== null) return byNs.trim();
        const byQuery = parent.querySelector(tag)?.textContent;
        return (byQuery || '').trim();
      };

      const ideNode = xmlDoc.getElementsByTagName('ide')?.[0] || xmlDoc;
      const emitNode = xmlDoc.getElementsByTagName('emit')?.[0] || xmlDoc;
      const enderEmitNode = emitNode.getElementsByTagName?.('enderEmit')?.[0] || emitNode;
      const icmsTotNode = xmlDoc.getElementsByTagName('ICMSTot')?.[0] || xmlDoc;
      const infAdicNode = xmlDoc.getElementsByTagName('infAdic')?.[0] || xmlDoc;

      const infNFeEl = xmlDoc.getElementsByTagName('infNFe')?.[0] || xmlDoc.querySelector('infNFe');
      const chNFe =
        getTag(xmlDoc, 'chNFe') ||
        infNFeEl?.getAttribute('Id')?.replace(/^NFe/i, '') ||
        '';
      const keyMeta = extractFromAccessKey(chNFe);

      const nNF = getTag(ideNode, 'nNF') || keyMeta.nfNumber || '';
      const serie = getTag(ideNode, 'serie') || '1';
      const dhEmi = getTag(ideNode, 'dhEmi') || getTag(ideNode, 'dEmi') || '';
      const issueDate = normalizeIsoDate(dhEmi) || (keyMeta.yearMonth ? `${keyMeta.yearMonth}-01` : '');

      const emitNome = sanitizeSupplierName(getTag(emitNode, 'xNome'));
      const emitFant = sanitizeSupplierName(getTag(emitNode, 'xFant'));
      const emitCNPJ =
        formatCnpj(getTag(emitNode, 'CNPJ') || getTag(emitNode, 'CPF')) ||
        keyMeta.cnpj ||
        '';
      const xLgr = getTag(enderEmitNode, 'xLgr');
      const nro = getTag(enderEmitNode, 'nro');
      const xBairro = getTag(enderEmitNode, 'xBairro');
      const xMun = getTag(enderEmitNode, 'xMun');
      const uf = getTag(enderEmitNode, 'UF');
      const cep = getTag(enderEmitNode, 'CEP');
      const fone = getTag(enderEmitNode, 'fone');

      const vNF = parseFloat(getTag(icmsTotNode, 'vNF') || '0');
      const vProdTotal = parseFloat(getTag(icmsTotNode, 'vProd') || '0');
      const infCpl = getTag(infAdicNode, 'infCpl');
      const infAdFisco = getTag(infAdicNode, 'infAdFisco');

      // Extrai campos estruturados de obsContr (ex: Placa, KM) e veicProd
      let explicitPlate = '';
      let explicitKm = 0;
      const obsContrTexts: string[] = [];
      const obsContrNodes = Array.from(xmlDoc.getElementsByTagName('obsContr'));
      obsContrNodes.forEach((obs) => {
        const xCampo = (obs.getAttribute('xCampo') || '').toUpperCase();
        const xTexto = getTag(obs, 'xTexto') || obs.textContent?.trim() || '';
        obsContrTexts.push(`${xCampo}: ${xTexto}`);
        if (xCampo.includes('PLACA') || xCampo.includes('VEIC')) {
          const cleanP = xTexto.replace(/[^A-Z0-9]/gi, '').toUpperCase();
          if (cleanP.length === 7) explicitPlate = cleanP;
        } else if (xCampo.includes('KM') || xCampo.includes('HODOMETRO') || xCampo.includes('ODOMETRO')) {
          const num = parseInt(xTexto.replace(/\D/g, ''), 10);
          if (!isNaN(num) && num > 0) explicitKm = num;
        }
      });

      const veicProdNodes = Array.from(xmlDoc.getElementsByTagName('veicProd'));
      if (veicProdNodes.length > 0) {
        const pTag = getTag(veicProdNodes[0], 'placa');
        if (pTag) {
          const cleanP = pTag.replace(/[^A-Z0-9]/gi, '').toUpperCase();
          if (cleanP.length === 7) explicitPlate = cleanP;
        }
        const chassiTag = getTag(veicProdNodes[0], 'chassi');
        if (chassiTag) obsContrTexts.push(`CHASSI: ${chassiTag}`);
      }

      const detNodes = Array.from(xmlDoc.getElementsByTagName('det'));
      let totalLiters = 0;
      let totalProdVal = 0;
      let weightedUnitPrice = 0;
      let detectedFuel: 'DIESEL' | 'GASOLINE' | 'ETHANOL' | 'FLEX' = 'DIESEL';
      const itemDescriptions: string[] = [];

      detNodes.forEach((det, idx) => {
        const xProd = getTag(det, 'xProd');
        const infAdProd = getTag(det, 'infAdProd');
        const qCom = parseFloat(getTag(det, 'qCom') || '0');
        const vUnCom = parseFloat(getTag(det, 'vUnCom') || '0');
        const vProd = parseFloat(getTag(det, 'vProd') || '0');
        if (xProd) itemDescriptions.push(xProd);
        if (infAdProd) itemDescriptions.push(infAdProd);
        if (idx === 0 && xProd) {
          detectedFuel = detectFuelTypeFromDescription(xProd);
        }
        totalLiters += qCom > 0 ? qCom : 0;
        totalProdVal += vProd > 0 ? vProd : qCom * vUnCom;
      });

      const finalTotal = vNF > 0 ? vNF : totalProdVal > 0 ? totalProdVal : vProdTotal;
      if (totalLiters > 0 && finalTotal > 0) {
        weightedUnitPrice = Number((finalTotal / totalLiters).toFixed(4));
      } else if (detNodes.length > 0) {
        weightedUnitPrice = parseFloat(getTag(detNodes[0], 'vUnCom') || '0');
      }

      const fullXmlSearch = `${infCpl} ${infAdFisco} ${obsContrTexts.join(' ')} ${itemDescriptions.join(' ')}`;
      const { plate, km, matchedVehicleId } = extractPlateAndKmFromText(fullXmlSearch, veiculos);
      const finalPlate = explicitPlate || plate;
      const finalKm = explicitKm > 0 ? explicitKm : km;
      const matchedVeh = matchedVehicleId || (finalPlate ? matchVehicleByPlate(finalPlate) : '') || defaultVehicleId || '';

      return {
        invoiceNumber: nNF,
        series: serie,
        accessKey: chNFe,
        issueDate,
        supplierName: emitNome || emitFant,
        supplierTradeName: emitFant || emitNome,
        supplierCnpj: emitCNPJ,
        supplierAddress: [xLgr, nro, xBairro].filter(Boolean).join(', '),
        supplierCity: xMun,
        supplierState: uf,
        supplierZipCode: cep,
        supplierPhone: fone,
        fuelType: detectedFuel,
        liters: Number(totalLiters.toFixed(2)),
        pricePerLiter: Number(weightedUnitPrice.toFixed(3)),
        totalValue: Number(finalTotal.toFixed(2)),
        detectedPlate: finalPlate,
        vehicleId: matchedVeh,
        mileage: finalKm,
        notes: infCpl ? infCpl.slice(0, 220) : '',
      };
    } catch (e) {
      console.warn('Erro no parser XML client-side:', e);
      return null;
    }
  };

  // Processa lote de arquivos (XML e/ou PDF)
  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setParsingFiles(true);

    const incomingFiles = Array.from(fileList);
    const newRows: BatchInvoiceRow[] = [];

    let firstSupplierName = sanitizeSupplierName(batchSupplierName);
    let firstSupplierTrade = sanitizeSupplierName(batchSupplierTradeName);
    let firstSupplierCnpj = batchSupplierCnpj;
    let firstCity = batchSupplierCity;
    let firstState = batchSupplierState;
    let firstAddress = batchSupplierAddress;
    let firstPhone = batchSupplierPhone;

    for (const file of incomingFiles) {
      const lower = file.name.toLowerCase();
      const isXml = lower.endsWith('.xml') || file.type.includes('xml');
      const isPdf = lower.endsWith('.pdf') || file.type.includes('pdf');

      if (!isXml && !isPdf) {
        toast({
          title: 'Formato ignorado',
          description: `O arquivo "${file.name}" não é XML nem PDF.`,
          variant: 'destructive',
        });
        continue;
      }

      let parsedData: Partial<BatchInvoiceRow> | null = null;
      let backendAlreadyImported = false;
      let backendAlreadyImportedMsg = '';

      if (isXml) {
        parsedData = await parseXmlFile(file);
      }

      // Se for PDF ou se o XML falhar localmente, tenta o parser inteligente do backend
      if (!parsedData || (!parsedData.invoiceNumber && !parsedData.totalValue)) {
        try {
          const backendParsed = await stockNfeService.parseNfe(file);
          if (backendParsed) {
            backendAlreadyImported = Boolean(backendParsed.alreadyImported);
            backendAlreadyImportedMsg = backendParsed.alreadyImportedMessage || '';
            const items = Array.isArray(backendParsed.items) ? backendParsed.items : [];
            const litersSum = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
            const totalVal =
              Number(backendParsed.totalInvoiceAmount) ||
              Number(backendParsed.totalProductsAmount) ||
              items.reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
            const unitPrice =
              litersSum > 0 && totalVal > 0
                ? Number((totalVal / litersSum).toFixed(3))
                : Number(items[0]?.unitPrice || 0);
            const firstDesc = items.map((i) => i.description || '').join(' ');
            const combinedPdfText = `${backendParsed.additionalInfo || ''} ${firstDesc} ${file.name}`;
            const { plate, km, matchedVehicleId } = extractPlateAndKmFromText(combinedPdfText, veiculos);

            const finalPlate = (backendParsed.vehiclePlate || plate || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
            const finalKm = (backendParsed.mileage && backendParsed.mileage > 0) ? backendParsed.mileage : km;
            const matchedVeh = matchedVehicleId || (finalPlate ? matchVehicleByPlate(finalPlate) : '') || defaultVehicleId || '';

            const keyMeta = extractFromAccessKey(backendParsed.accessKey);
            const cleanName = sanitizeSupplierName(backendParsed.supplierName);
            const cleanTrade = sanitizeSupplierName(backendParsed.supplierTradeName) || cleanName;
            const cleanCnpj = keyMeta.cnpj || formatCnpj(backendParsed.supplierCnpj) || '';
            const normDate =
              normalizeIsoDate(backendParsed.issueDate) ||
              (keyMeta.yearMonth ? `${keyMeta.yearMonth}-01` : '');

            parsedData = {
              invoiceNumber: backendParsed.invoiceNumber || keyMeta.nfNumber || '',
              series: backendParsed.series || '1',
              accessKey: backendParsed.accessKey || '',
              issueDate: normDate,
              supplierName: cleanName,
              supplierTradeName: cleanTrade,
              supplierCnpj: cleanCnpj,
              supplierAddress: backendParsed.supplierAddress || '',
              supplierCity: backendParsed.supplierCity || '',
              supplierState: backendParsed.supplierState || '',
              supplierZipCode: backendParsed.supplierZipCode || '',
              supplierPhone: backendParsed.supplierPhone || '',
              fuelType: detectFuelTypeFromDescription(firstDesc),
              liters: Number((litersSum || 0).toFixed(2)),
              pricePerLiter: unitPrice,
              totalValue: Number((totalVal || 0).toFixed(2)),
              detectedPlate: finalPlate,
              vehicleId: matchedVeh,
              mileage: finalKm,
              notes: backendParsed.additionalInfo ? backendParsed.additionalInfo.slice(0, 220) : '',
            };
          }
        } catch {
          // Fallback: extrai possível chave de 44 dígitos, número de NF e placa do nome do arquivo PDF
          const digitsInFileName = file.name.replace(/\D/g, '');
          const keyInFile = digitsInFileName.length >= 44 ? digitsInFileName.slice(0, 44) : '';
          const keyMeta = extractFromAccessKey(keyInFile);
          const nfMatch =
            file.name.match(/(?:NF|NOTA|NFE|DANFE)[_\-\s]*(\d{2,9})/i) || file.name.match(/(\d{3,9})/);
          const { plate, km, matchedVehicleId } = extractPlateAndKmFromText(file.name, veiculos);
          parsedData = {
            invoiceNumber: keyMeta.nfNumber || (nfMatch ? nfMatch[1] : ''),
            series: '1',
            accessKey: keyInFile,
            issueDate: keyMeta.yearMonth ? `${keyMeta.yearMonth}-01` : '',
            supplierName: firstSupplierName || '',
            supplierTradeName: firstSupplierTrade || '',
            supplierCnpj: keyMeta.cnpj || firstSupplierCnpj || '',
            fuelType: 'DIESEL',
            liters: 0,
            pricePerLiter: 0,
            totalValue: 0,
            detectedPlate: plate,
            vehicleId: matchedVehicleId || (plate ? matchVehicleByPlate(plate) : '') || defaultVehicleId || '',
            mileage: km,
            parseWarning: 'Verifique os valores da nota PDF na linha abaixo.',
          };
        }
      }

      if (parsedData) {
        const validRowName = sanitizeSupplierName(parsedData.supplierName || parsedData.supplierTradeName);
        const validRowTrade = sanitizeSupplierName(parsedData.supplierTradeName || parsedData.supplierName);
        const validRowCnpj = formatCnpj(parsedData.supplierCnpj);
        const rowNf = (parsedData.invoiceNumber || '').trim().replace(/^0+(?!$)/, '');
        const rowKey = cleanDigits(parsedData.accessKey);

        // 1. Verifica se esta mesma Nota Fiscal já foi adicionada neste lote (evita duplicidade dentro do lote)
        const existingInCurrentBatch = [...rows, ...newRows].find((existing) => {
          const exKey = cleanDigits(existing.accessKey);
          if (rowKey.length === 44 && exKey.length === 44 && rowKey === exKey) return true;
          const exNf = (existing.invoiceNumber || '').trim().replace(/^0+(?!$)/, '');
          if (rowNf && exNf && rowNf === exNf) {
            const exCnpj = cleanDigits(existing.supplierCnpj);
            const curCnpj = cleanDigits(validRowCnpj);
            if (!exCnpj || !curCnpj || exCnpj.slice(0, 8) === curCnpj.slice(0, 8)) return true;
          }
          return false;
        });

        if (existingInCurrentBatch) {
          toast({
            title: 'Nota Fiscal Duplicada no Lote!',
            description: `A Nota Fiscal nº ${rowNf || file.name} já foi adicionada neste lote e foi ignorada para evitar importação duplicada.`,
            variant: 'destructive',
          });
          continue;
        }

        // 2. Verifica se a Nota Fiscal já foi importada anteriormente no sistema
        const localDupCheck = checkInvoiceAlreadyImported(
          rowNf,
          rowKey,
          validRowCnpj || firstSupplierCnpj,
          validRowName || firstSupplierName
        );
        const isAlreadyImported = backendAlreadyImported || localDupCheck.alreadyImported;
        const duplicateReason =
          localDupCheck.reason ||
          backendAlreadyImportedMsg ||
          (isAlreadyImported ? `A Nota Fiscal nº ${rowNf || file.name} já consta importada no sistema.` : undefined);

        if (isAlreadyImported) {
          toast({
            title: 'Nota Fiscal Já Importada!',
            description: duplicateReason,
            variant: 'destructive',
          });
        }

        if (!firstSupplierName && validRowName) {
          firstSupplierName = validRowName;
          firstSupplierTrade = validRowTrade || validRowName;
        }
        if (!firstSupplierCnpj && validRowCnpj) {
          firstSupplierCnpj = validRowCnpj;
        }
        if (!firstCity && parsedData.supplierCity) firstCity = parsedData.supplierCity;
        if (!firstState && parsedData.supplierState) firstState = parsedData.supplierState;
        if (!firstAddress && parsedData.supplierAddress) firstAddress = parsedData.supplierAddress;
        if (!firstPhone && parsedData.supplierPhone) firstPhone = parsedData.supplierPhone;

        newRows.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file,
          fileName: file.name,
          fileType: isXml ? 'XML' : 'PDF',
          invoiceNumber: parsedData.invoiceNumber || '',
          series: parsedData.series || '1',
          accessKey: parsedData.accessKey || '',
          issueDate: parsedData.issueDate || '',
          supplierName: validRowName,
          supplierTradeName: validRowTrade,
          supplierCnpj: validRowCnpj,
          supplierAddress: parsedData.supplierAddress,
          supplierCity: parsedData.supplierCity,
          supplierState: parsedData.supplierState,
          supplierZipCode: parsedData.supplierZipCode,
          supplierPhone: parsedData.supplierPhone,
          fuelType: parsedData.fuelType || 'DIESEL',
          liters: parsedData.liters || 0,
          pricePerLiter: parsedData.pricePerLiter || 0,
          totalValue: parsedData.totalValue || 0,
          vehicleId: parsedData.vehicleId || defaultVehicleId || '',
          detectedPlate: parsedData.detectedPlate || '',
          mileage: parsedData.mileage || 0,
          notes: parsedData.notes || '',
          parseWarning: parsedData.parseWarning,
          alreadyImported: isAlreadyImported,
          duplicateWarning: duplicateReason,
        });
      }
    }

    // Determinar o mês de competência predominante (moda) entre todas as notas com data real extraída
    const combinedRows = [...rows, ...newRows];
    const monthCounts: Record<string, number> = {};
    combinedRows.forEach((r) => {
      if (r.issueDate && r.issueDate.length >= 7) {
        const ym = r.issueDate.slice(0, 7);
        monthCounts[ym] = (monthCounts[ym] || 0) + 1;
      }
    });
    let predominantMonth = competenceMonth;
    let maxMonthCount = 0;
    Object.entries(monthCounts).forEach(([ym, count]) => {
      if (count > maxMonthCount) {
        maxMonthCount = count;
        predominantMonth = ym;
      }
    });
    if (predominantMonth && predominantMonth !== competenceMonth) {
      setCompetenceMonth(predominantMonth);
    }

    // Se o fornecedor foi identificado por CNPJ na base de fornecedores cadastrados, recupera o nome oficial
    if (!firstSupplierName && firstSupplierCnpj) {
      const targetDigits = cleanDigits(firstSupplierCnpj);
      const existingByCnpj = suppliers.find(
        (s) => cleanDigits(s.cnpj || s.registrationNumber) === targetDigits
      );
      if (existingByCnpj) {
        firstSupplierName = existingByCnpj.name || existingByCnpj.tradeName || '';
        firstSupplierTrade = existingByCnpj.tradeName || existingByCnpj.name || '';
      }
    }

    // Propaga fornecedor e mês predominante para linhas que vieram sem data ou sem razão social/CNPJ no PDF
    const finalizedNewRows = newRows.map((r) => ({
      ...r,
      issueDate: r.issueDate || `${predominantMonth}-01`,
      supplierName: r.supplierName || firstSupplierName || '',
      supplierTradeName: r.supplierTradeName || firstSupplierTrade || firstSupplierName || '',
      supplierCnpj: r.supplierCnpj || firstSupplierCnpj || '',
    }));

    if (firstSupplierName && !sanitizeSupplierName(batchSupplierName)) {
      setBatchSupplierName(firstSupplierName);
    }
    if (firstSupplierTrade && !sanitizeSupplierName(batchSupplierTradeName)) {
      setBatchSupplierTradeName(firstSupplierTrade);
    }
    if (firstSupplierCnpj && !batchSupplierCnpj) setBatchSupplierCnpj(firstSupplierCnpj);
    if (firstCity && !batchSupplierCity) setBatchSupplierCity(firstCity);
    if (firstState && !batchSupplierState) setBatchSupplierState(firstState);
    if (firstAddress && !batchSupplierAddress) setBatchSupplierAddress(firstAddress);
    if (firstPhone && !batchSupplierPhone) setBatchSupplierPhone(firstPhone);

    setRows((prev) =>
      [...prev, ...finalizedNewRows].map((r) => ({
        ...r,
        supplierName: sanitizeSupplierName(r.supplierName) || firstSupplierName || '',
        supplierTradeName: sanitizeSupplierName(r.supplierTradeName) || firstSupplierTrade || firstSupplierName || '',
        supplierCnpj: r.supplierCnpj || firstSupplierCnpj || '',
      }))
    );
    setParsingFiles(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateRow = (id: string, field: keyof BatchInvoiceRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        if (field === 'invoiceNumber') {
          const dup = checkInvoiceAlreadyImported(
            String(value || ''),
            updated.accessKey,
            updated.supplierCnpj || batchSupplierCnpj,
            updated.supplierName || batchSupplierName
          );
          updated.alreadyImported = dup.alreadyImported;
          updated.duplicateWarning = dup.reason;
        } else if (field === 'liters' || field === 'pricePerLiter') {
          const l = field === 'liters' ? Number(value) : r.liters;
          const p = field === 'pricePerLiter' ? Number(value) : r.pricePerLiter;
          if (l > 0 && p > 0) {
            updated.totalValue = Number((l * p).toFixed(2));
          }
        } else if (field === 'totalValue') {
          const t = Number(value);
          if (r.liters > 0 && t > 0) {
            updated.pricePerLiter = Number((t / r.liters).toFixed(3));
          }
        }
        return updated;
      })
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const applyDefaultVehicleToAll = () => {
    if (!defaultVehicleId) return;
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        vehicleId: r.vehicleId || defaultVehicleId,
      }))
    );
    toast({
      title: 'Veículo aplicado',
      description: 'O veículo padrão foi vinculado às notas sem veículo selecionado.',
    });
  };

  // Validações de Fechamento Mensal (Mesmo Mês, Mesmo Fornecedor e Duplicidade)
  const validation = useMemo(() => {
    const alreadyImportedRows = rows.filter((r) => Boolean(r.alreadyImported));

    const outOfMonthRows = rows.filter((r) => {
      if (!r.issueDate || r.issueDate.length < 7) return true;
      return r.issueDate.slice(0, 7) !== competenceMonth;
    });

    const targetCnpj = cleanDigits(batchSupplierCnpj);
    const targetName = normalizeName(sanitizeSupplierName(batchSupplierName));

    const differentSupplierRows = rows.filter((r) => {
      const rowCnpj = cleanDigits(r.supplierCnpj);
      // Compara raiz de 8 dígitos do CNPJ para permitir notas de filiais do mesmo posto/rede sem falso positivo
      if (targetCnpj.length >= 8 && rowCnpj.length >= 8) {
        return targetCnpj.slice(0, 8) !== rowCnpj.slice(0, 8);
      }
      if (targetCnpj && rowCnpj && targetCnpj !== rowCnpj) return true;
      const rowName = normalizeName(sanitizeSupplierName(r.supplierName));
      if (!targetCnpj && targetName && rowName && targetName !== rowName) return true;
      return false;
    });

    const missingVehicleRows = rows.filter((r) => !r.vehicleId && !defaultVehicleId);
    const invalidValueRows = rows.filter((r) => !(r.liters > 0) || !(r.totalValue > 0));

    const totalLiters = rows.reduce((s, r) => s + (Number(r.liters) || 0), 0);
    const totalCost = rows.reduce((s, r) => s + (Number(r.totalValue) || 0), 0);
    const avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0;

    return {
      alreadyImportedRows,
      outOfMonthRows,
      differentSupplierRows,
      missingVehicleRows,
      invalidValueRows,
      totalLiters,
      totalCost,
      avgPrice,
      isValid:
        rows.length > 0 &&
        alreadyImportedRows.length === 0 &&
        outOfMonthRows.length === 0 &&
        differentSupplierRows.length === 0 &&
        missingVehicleRows.length === 0 &&
        invalidValueRows.length === 0 &&
        Boolean((sanitizeSupplierName(batchSupplierName) || matchedSupplier?.name || '').trim()),
    };
  }, [rows, competenceMonth, batchSupplierCnpj, batchSupplierName, defaultVehicleId, matchedSupplier]);

  const handleConfirmImport = async () => {
    if (rows.length === 0) return;

    if (validation.alreadyImportedRows.length > 0) {
      const nfNumbers = validation.alreadyImportedRows
        .map((r) => r.invoiceNumber || r.fileName)
        .join(', ');
      toast({
        title: 'Nota(s) Fiscal(is) Já Importada(s)!',
        description: `O sistema detectou ${validation.alreadyImportedRows.length} nota(s) já importada(s) anteriormente (${nfNumbers}). Remova-as antes de confirmar.`,
        variant: 'destructive',
      });
      return;
    }

    if (validation.outOfMonthRows.length > 0) {
      toast({
        title: 'Mês de Competência Divergente!',
        description: `Todas as notas do lote devem pertencer ao mês ${competenceMonth.split('-').reverse().join('/')} (Fechamento Mensal). Corrija ou remova as ${validation.outOfMonthRows.length} nota(s) destacada(s).`,
        variant: 'destructive',
      });
      return;
    }

    if (validation.differentSupplierRows.length > 0) {
      toast({
        title: 'Fornecedor Divergente no Lote!',
        description: 'A importação em lote de fechamento mensal deve conter notas do mesmo fornecedor.',
        variant: 'destructive',
      });
      return;
    }

    if (validation.missingVehicleRows.length > 0) {
      toast({
        title: 'Veículo Obrigatório',
        description: 'Selecione um veículo padrão ou informe o veículo em cada nota fiscal da lista.',
        variant: 'destructive',
      });
      return;
    }

    if (validation.invalidValueRows.length > 0) {
      toast({
        title: 'Valores Incompletos',
        description: 'Todas as notas precisam ter Litros e Valor Total maiores que zero.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Verificar ou cadastrar automaticamente o fornecedor
      let finalSupplierId = matchedSupplier?.id || '';
      let finalSupplierName =
        matchedSupplier?.tradeName ||
        matchedSupplier?.name ||
        batchSupplierTradeName.trim() ||
        batchSupplierName.trim();
      const finalSupplierCnpj = matchedSupplier?.cnpj || batchSupplierCnpj.trim();

      if (!matchedSupplier) {
        const newSupplierPayload = {
          name: batchSupplierName.trim() || batchSupplierTradeName.trim(),
          tradeName: batchSupplierTradeName.trim() || batchSupplierName.trim(),
          cnpj: cleanDigits(batchSupplierCnpj) || undefined,
          registrationNumber: cleanDigits(batchSupplierCnpj) || undefined,
          documentType: cleanDigits(batchSupplierCnpj).length === 11 ? 'CPF' : 'CNPJ',
          address: batchSupplierAddress || undefined,
          city: batchSupplierCity || undefined,
          state: batchSupplierState || undefined,
          phone: batchSupplierPhone || undefined,
          category: 'COMBUSTIVEL',
          notes: `Cadastrado automaticamente na importação em lote de Abastecimento Externo (${competenceMonth.split('-').reverse().join('/')})`,
        };

        try {
          const createdSupplier = await contasAPagarService.createFornecedor(newSupplierPayload);
          finalSupplierId = createdSupplier.id;
          finalSupplierName = createdSupplier.tradeName || createdSupplier.name || finalSupplierName;
          await refetchSuppliers();
          queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
          queryClient.invalidateQueries({ queryKey: ['suppliers'] });
          toast({
            title: 'Fornecedor Cadastrado Automaticamente!',
            description: `${finalSupplierName} (${formatCnpj(finalSupplierCnpj) || 'Sem CNPJ'}) foi registrado na base de fornecedores.`,
          });
        } catch (supErr) {
          console.warn('Aviso ao cadastrar fornecedor automaticamente:', supErr);
        }
      }

      // 2. Criar cada registro de abastecimento externo (1 lançamento por Nota Fiscal)
      const competenceLabel = competenceMonth.split('-').reverse().join('/');
      let importedCount = 0;

      for (const row of rows) {
        const targetVehicleId = row.vehicleId || defaultVehicleId;
        const vehicleObj = veiculos.find((v) => v.id === targetVehicleId);
        const parsedRowKm = Number(row.mileage);
        const parsedVehicleKm = Number(vehicleObj?.currentMileage);
        const currentKm =
          Number.isFinite(parsedRowKm) && parsedRowKm > 0
            ? Math.round(parsedRowKm)
            : Number.isFinite(parsedVehicleKm) && parsedVehicleKm > 0
              ? Math.round(parsedVehicleKm)
              : 0;
        const safeStation = (finalSupplierName || row.supplierTradeName || row.supplierName || 'Posto Externo').trim();

        const nfTag = row.invoiceNumber ? `NF: ${row.invoiceNumber}` : `Arquivo: ${row.fileName}`;
        const cnpjTag = finalSupplierCnpj ? ` | CNPJ: ${formatCnpj(finalSupplierCnpj)}` : '';
        const keyTag = row.accessKey ? ` | Chave: ${row.accessKey}` : '';
        const extraNotes = row.notes ? ` | ${row.notes}` : '';

        const payload = {
          vehicleId: targetVehicleId,
          date: row.issueDate,
          fuelType: row.fuelType || 'DIESEL',
          quantity: Number(row.liters),
          cost: Number(row.totalValue),
          pricePerLiter: Number(row.pricePerLiter) || Number((row.totalValue / row.liters).toFixed(3)),
          mileage: currentKm,
          initialMileage: Number.isFinite(parsedVehicleKm) && parsedVehicleKm >= 0 ? Math.round(parsedVehicleKm) : null,
          station: safeStation,
          driverId: null,
          notes: `Abastecimento Externo | ${nfTag} | Origem: Lote ${row.fileType} | Competência: ${competenceLabel}${cnpjTag}${keyTag}${extraNotes}`,
          costCenter: 'Abastecimento Externo',
          clientId: defaultClientId || null,
          clientName: defaultClientName || null,
          workPostId: defaultWorkPostId || null,
          obraName: defaultObraName || null,
          contractId: defaultContractId || null,
          contractNumber: defaultContractNumber || null,
          supplierId: finalSupplierId || null,
        };

        const fd = new FormData();
        fd.append('fuelRecord', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
        if (row.file) {
          fd.append('receipt', row.file);
        }

        await fleetService.createFuelRecord(fd);
        importedCount++;
      }

      // 3. Opcionalmente gerar o título consolidado de Fechamento Mensal no Contas a Pagar / Despesas & Boletos
      if (createFinancialClosing && validation.totalCost > 0) {
        try {
          const nfList = rows
            .map((r) => r.invoiceNumber)
            .filter(Boolean)
            .join(', ');

          // Detalhar rateio e atribuição de custos/litros por veículo no lote
          const vehicleTotals = rows.reduce((acc, r) => {
            const vId = r.vehicleId || defaultVehicleId;
            const veh = veiculos.find((v) => v.id === vId);
            const vPlate = veh
              ? `${veh.plate || (veh as any).placa}${veh.fleetNumber ? ` (${veh.fleetNumber})` : ''}`
              : r.detectedPlate
                ? formatPlate(r.detectedPlate)
                : 'Veículo N/D';
            if (!acc[vPlate]) acc[vPlate] = { liters: 0, cost: 0, count: 0 };
            acc[vPlate].liters += Number(r.liters) || 0;
            acc[vPlate].cost += Number(r.totalValue) || 0;
            acc[vPlate].count += 1;
            return acc;
          }, {} as Record<string, { liters: number; cost: number; count: number }>);

          const breakdownParts = Object.entries(vehicleTotals).map(
            ([vPlate, data]) =>
              `• ${vPlate}: R$ ${data.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${data.liters.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L em ${data.count} NF${data.count > 1 ? 's' : ''})`
          );

          await contasAPagarService.createContaAPagar({
            invoiceNumber: nfList ? `FECH-${competenceMonth}-${rows.length}NFs` : `FECH-${competenceMonth}`,
            dataEmissao: new Date(`${competenceMonth}-01T12:00:00`),
            vencimento: new Date((closingDueDate || `${competenceMonth}-28`) + 'T12:00:00'),
            fornecedor: finalSupplierName,
            fornecedorId: finalSupplierId,
            cliente: defaultClientName || undefined,
            clienteId: defaultClientId || undefined,
            contrato: defaultContractNumber || undefined,
            contratoId: defaultContractId || undefined,
            obra: defaultObraName || undefined,
            obraId: defaultWorkPostId || undefined,
            descricao: `Fechamento Mensal Abastecimento Externo (${competenceLabel}) - ${finalSupplierName} (${rows.length} NFs | ${validation.totalLiters.toFixed(2)} L)`,
            tipo: 'VARIAVEL',
            valor: Number(validation.totalCost.toFixed(2)),
            status: 'Em Aberto',
            baixa: false,
            categoria: 'COMBUSTIVEL',
            centroCusto: 'Abastecimento Externo',
            observacoes: `Fechamento mensal importado em lote (${rows.length} notas fiscais | ${validation.totalLiters.toFixed(2)} L | Competência ${competenceLabel}).\nRateio e atribuição por Veículo:\n${breakdownParts.join('\n')}\nNFs: ${nfList || 'Ver Abastecimento Externo'}`,
          } as any);
          queryClient.invalidateQueries({ queryKey: ['fuel-expenses-contas'] });
          queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
          queryClient.invalidateQueries({ queryKey: ['contas-a-pagar'] });
        } catch (finErr) {
          console.warn('Aviso ao registrar título consolidado no Contas a Pagar:', finErr);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['fuelRecords'] });
      toast({
        title: 'Importação em Lote Concluída!',
        description: `${importedCount} nota(s) de ${finalSupplierName} importada(s) no fechamento de ${competenceLabel} (Total: R$ ${validation.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      const respData = error?.response?.data;
      const fieldErrorsText =
        respData?.fieldErrors && typeof respData.fieldErrors === 'object'
          ? Object.entries(respData.fieldErrors)
              .map(([k, v]) => `${k}: ${v}`)
              .join('; ')
          : '';
      toast({
        title: 'Erro na Importação em Lote',
        description:
          [respData?.message || respData?.error || error?.message, fieldErrorsText]
            .filter(Boolean)
            .join(' — ') || 'Erro ao salvar os abastecimentos do lote.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-6xl !max-h-[94vh] flex flex-col !p-0 overflow-hidden bg-seguranca-graphite text-white border-gray-700">
        <DialogHeader className="p-5 pb-3 border-b border-gray-700/60 bg-seguranca-black/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-400" />
                Importação de Notas em Lote — Fechamento Mensal (Abastecimento Externo)
              </DialogTitle>
              <DialogDescription className="text-gray-300 text-xs sm:text-sm mt-0.5">
                Importe várias notas fiscais (XML ou PDF) do mesmo fornecedor e do mesmo mês de competência. Se o posto/fornecedor não estiver cadastrado, o sistema cadastra automaticamente.
              </DialogDescription>
            </div>
            <Badge className="bg-emerald-600 text-white font-mono text-xs px-3 py-1 self-start sm:self-center shrink-0">
              {rows.length} {rows.length === 1 ? 'Nota no Lote' : 'Notas no Lote'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* 1. SELETOR DE COMPETÊNCIA + ZONA DE UPLOAD MÚLTIPLO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 bg-seguranca-black/40 border border-gray-700/60 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Mês de Competência (Fechamento) *
                </Label>
                <p className="text-[11px] text-gray-400 mt-1">
                  Todas as notas importadas no lote devem pertencer a este mês de fechamento.
                </p>
              </div>
              <Input
                type="month"
                value={competenceMonth}
                onChange={(e) => setCompetenceMonth(e.target.value)}
                className="bg-seguranca-black border-gray-600 text-white font-semibold h-10"
              />
              <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-700/50">
                <span className="text-gray-400">Volume Total do Lote:</span>
                <span className="font-mono font-bold text-blue-400">
                  {validation.totalLiters.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Total do Fornecedor no Lote:</span>
                <span className="font-mono font-bold text-base text-emerald-400">
                  R$ {validation.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFilesSelected(e.dataTransfer.files);
              }}
              className="lg:col-span-8 border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 bg-seguranca-black/30 hover:bg-emerald-950/10 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[150px]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xml,.pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              {parsingFiles ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-9 w-9 text-emerald-400 animate-spin" />
                  <p className="text-sm font-semibold text-white">Lendo e extraindo dados das notas fiscais...</p>
                  <p className="text-xs text-gray-400">Identificando fornecedor, CNPJ, itens de combustível e valores</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      <FileCode2 className="h-6 w-6" />
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                      <Upload className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-white">
                    Clique aqui ou arraste várias Notas Fiscais (XML ou PDF)
                  </p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xl">
                    Selecione todas as notas do fechamento mensal do posto. O sistema extrai automaticamente nº da NF, data, CNPJ, razão social, litros, valor unitário e valor total.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 2. DADOS DO FORNECEDOR (AUTO-DETECÇÃO E AUTO-CADASTRO) */}
          <div className="bg-seguranca-black/40 border border-gray-700/60 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-400" />
                Fornecedor / Posto de Abastecimento Externo do Lote
              </h4>
              {matchedSupplier ? (
                <Badge className="bg-emerald-600 text-white text-xs flex items-center gap-1.5 w-fit">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Fornecedor já cadastrado: {matchedSupplier.tradeName || matchedSupplier.name}
                </Badge>
              ) : batchSupplierName || batchSupplierCnpj ? (
                <Badge className="bg-amber-600 text-white text-xs flex items-center gap-1.5 w-fit">
                  <PlusCircle className="h-3.5 w-3.5" />
                  Fornecedor não cadastrado — Será cadastrado automaticamente ao confirmar
                </Badge>
              ) : (
                <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs w-fit">
                  Aguardando importação de nota ou seleção manual
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs text-gray-300">Vincular a Posto Existente (Opcional se novo)</Label>
                <SearchableSelect
                  value={selectedExistingSupplierId || matchedSupplier?.id || ''}
                  onChange={(val, opt) => {
                    setSelectedExistingSupplierId(val);
                    if (val) {
                      const sup = suppliers.find((s) => String(s.id) === String(val));
                      if (sup) {
                        setBatchSupplierName(sup.name);
                        setBatchSupplierTradeName(sup.tradeName || sup.name);
                        setBatchSupplierCnpj(sup.cnpj || sup.registrationNumber || '');
                      } else if (opt) {
                        setBatchSupplierName(opt.label);
                      }
                    }
                  }}
                  options={supplierOptions}
                  placeholder="Detectar automaticamente da Nota Fiscal..."
                  searchPlaceholder="Buscar posto/fornecedor por nome ou CNPJ..."
                  emptyText="Não encontrado — preencha ao lado para auto-cadastro"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Razão Social / Nome do Posto *</Label>
                <Input
                  value={batchSupplierName}
                  onChange={(e) => {
                    setBatchSupplierName(e.target.value);
                    if (!batchSupplierTradeName) setBatchSupplierTradeName(e.target.value);
                  }}
                  placeholder="Ex: AUTO POSTO SAO SILVESTRE LTDA"
                  className="bg-seguranca-black border-gray-600 text-white text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-300">CNPJ do Fornecedor</Label>
                <Input
                  value={batchSupplierCnpj}
                  onChange={(e) => setBatchSupplierCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="bg-seguranca-black border-gray-600 text-white text-xs h-9 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3. VÍNCULO OPERACIONAL PADRÃO (VEÍCULO / CLIENTE / OBRA / CONTRATO) */}
          <div className="bg-seguranca-black/40 border border-gray-700/60 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-400" />
                Vínculo Padrão do Lote (Veículo, Cliente, Obra e Fechamento Financeiro)
              </h4>
              {defaultVehicleId && rows.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={applyDefaultVehicleToAll}
                  className="h-7 text-xs border-blue-500/50 text-blue-400 hover:bg-blue-950/30"
                >
                  Aplicar Veículo Padrão a Todas as Notas
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-300">Veículo Padrão do Lote (Fallback)</Label>
                  <span className="text-[10px] text-gray-400">Opcional</span>
                </div>
                <SearchableSelect
                  value={defaultVehicleId}
                  onChange={(val) => {
                    setDefaultVehicleId(val);
                    setRows((prev) =>
                      prev.map((r) => ({
                        ...r,
                        vehicleId: r.vehicleId || val,
                      }))
                    );
                  }}
                  options={vehicleOptions}
                  placeholder="Usado se a nota não tiver placa..."
                  searchPlaceholder="Placa ou prefixo..."
                  emptyText="Nenhum veículo encontrado"
                />
                <p className="text-[10px] text-gray-400">Identificado em cada nota. Use aqui se houver notas sem placa.</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Cliente (Opcional)</Label>
                <SearchableSelect
                  value={defaultClientId}
                  onChange={(val, opt) => {
                    setDefaultClientId(val);
                    setDefaultClientName(opt?.label || '');
                  }}
                  options={clientOptions}
                  placeholder="Selecionar cliente..."
                  searchPlaceholder="Nome do cliente..."
                  emptyText="Nenhum cliente"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Obra / Setor (Opcional)</Label>
                <SearchableSelect
                  value={defaultWorkPostId}
                  onChange={(val, opt) => {
                    setDefaultWorkPostId(val);
                    setDefaultObraName(opt?.label || '');
                  }}
                  options={workPostOptions}
                  placeholder="Selecionar obra..."
                  searchPlaceholder="Nome da obra..."
                  emptyText="Nenhuma obra"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-300">Contrato (Opcional)</Label>
                <SearchableSelect
                  value={defaultContractId}
                  onChange={(val, opt) => {
                    setDefaultContractId(val);
                    setDefaultContractNumber(opt?.label || '');
                  }}
                  options={contractOptions}
                  placeholder="Selecionar contrato..."
                  searchPlaceholder="Nº do contrato..."
                  emptyText="Nenhum contrato"
                />
              </div>
            </div>

            {/* Opção de Fechamento Mensal no Contas a Pagar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-700/50">
              <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createFinancialClosing}
                  onChange={(e) => setCreateFinancialClosing(e.target.checked)}
                  className="rounded border-gray-600 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <Receipt className="h-4 w-4 text-purple-400" />
                <span>
                  Gerar também título consolidado de <strong>Fechamento Mensal</strong> em Despesas & Boletos (Contas a Pagar)
                </span>
              </label>

              {createFinancialClosing && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-300 whitespace-nowrap">Vencimento da Fatura:</Label>
                  <Input
                    type="date"
                    value={closingDueDate}
                    onChange={(e) => setClosingDueDate(e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-white text-xs h-8 w-40"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ALERTAS DE VALIDAÇÃO DO LOTE (DUPLICIDADE / MESMO MÊS / MESMO FORNECEDOR) */}
          {validation.alreadyImportedRows.length > 0 && (
            <div className="batch-alert-error p-3.5 rounded-xl bg-red-950/85 border-2 border-red-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-100 shadow-sm">
              <div className="flex items-start sm:items-center gap-3">
                <AlertTriangle className="batch-alert-icon h-5 w-5 text-red-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <strong className="batch-alert-title font-bold text-white text-sm block">
                    Atenção: {validation.alreadyImportedRows.length} nota(s) fiscal(is) já foi(ram) importada(s) anteriormente!
                  </strong>
                  <span className="batch-alert-desc block mt-0.5 leading-relaxed">
                    O sistema detectou que a(s) NF(s){' '}
                    <strong>
                      {validation.alreadyImportedRows
                        .map((r) => (r.invoiceNumber ? `nº ${r.invoiceNumber}` : r.fileName))
                        .join(', ')}
                    </strong>{' '}
                    já consta(m) no Abastecimento Externo e bloqueou a reimportação para evitar lançamentos duplicados.
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setRows((prev) => prev.filter((r) => !r.alreadyImported));
                }}
                className="batch-alert-btn shrink-0 h-8 text-xs font-bold bg-red-600 hover:bg-red-700 text-white border border-red-400"
              >
                Remover {validation.alreadyImportedRows.length === 1 ? 'nota já importada' : 'notas já importadas'}
              </Button>
            </div>
          )}

          {validation.outOfMonthRows.length > 0 && (
            <div className="batch-alert-error p-3.5 rounded-xl bg-red-950/85 border-2 border-red-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-100 shadow-sm">
              <div className="flex items-start sm:items-center gap-3">
                <AlertTriangle className="batch-alert-icon h-5 w-5 text-red-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <strong className="batch-alert-title font-bold text-white text-sm block">
                    Atenção: Há {validation.outOfMonthRows.length} nota(s) fora do mês de fechamento ({competenceMonth.split('-').reverse().join('/')})!
                  </strong>
                  <span className="batch-alert-desc block mt-0.5 leading-relaxed">
                    Como este lote refere-se ao fechamento mensal de abastecimento externo, todas as notas devem pertencer ao mesmo mês de competência. Ajuste a data ou clique ao lado para padronizar.
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setRows((prev) =>
                    prev.map((r) => {
                      if (!r.issueDate || r.issueDate.slice(0, 7) !== competenceMonth) {
                        const day = r.issueDate && r.issueDate.length >= 10 ? r.issueDate.slice(8, 10) : '01';
                        return { ...r, issueDate: `${competenceMonth}-${day}` };
                      }
                      return r;
                    })
                  );
                }}
                className="batch-alert-btn shrink-0 h-8 text-xs font-bold bg-red-600 hover:bg-red-700 text-white border border-red-400"
              >
                Ajustar datas para {competenceMonth.split('-').reverse().join('/')}
              </Button>
            </div>
          )}

          {validation.differentSupplierRows.length > 0 && (
            <div className="batch-alert-warning p-3.5 rounded-xl bg-amber-950/85 border-2 border-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-100 shadow-sm">
              <div className="flex items-start sm:items-center gap-3">
                <AlertTriangle className="batch-alert-icon h-5 w-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <strong className="batch-alert-title font-bold text-white text-sm block">
                    Atenção: Há {validation.differentSupplierRows.length} nota(s) com CNPJ/Fornecedor diferente do lote principal!
                  </strong>
                  <span className="batch-alert-desc block mt-0.5 leading-relaxed">
                    O lote de fechamento mensal deve conter apenas notas do mesmo fornecedor ({batchSupplierName || matchedSupplier?.name || 'Posto selecionado'}).
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const unifiedName = batchSupplierName || matchedSupplier?.name || '';
                  const unifiedTrade = batchSupplierTradeName || matchedSupplier?.tradeName || unifiedName;
                  const unifiedCnpj = batchSupplierCnpj || matchedSupplier?.cnpj || '';
                  setRows((prev) =>
                    prev.map((r) => ({
                      ...r,
                      supplierName: unifiedName,
                      supplierTradeName: unifiedTrade,
                      supplierCnpj: unifiedCnpj,
                    }))
                  );
                }}
                className="batch-alert-btn shrink-0 h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white border border-amber-400"
              >
                Unificar fornecedor no lote
              </Button>
            </div>
          )}

          {/* 4. TABELA DE NOTAS IMPORTADAS NO LOTE */}
          <div className="bg-seguranca-black/40 border border-gray-700/60 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-gray-700/60 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <Fuel className="h-4 w-4 text-emerald-400" />
                Notas Fiscais no Lote ({rows.length})
              </span>
              {rows.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRows([])}
                  className="h-7 text-xs text-red-400 hover:text-red-300"
                >
                  Limpar Lote
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-xs w-20">Tipo</TableHead>
                    <TableHead className="text-xs w-28">Nº Nota (NF)</TableHead>
                    <TableHead className="text-xs w-36">Data Emissão</TableHead>
                    <TableHead className="text-xs min-w-[200px]">Veículo (Placa) *</TableHead>
                    <TableHead className="text-xs w-32">Combustível</TableHead>
                    <TableHead className="text-xs w-28 text-right">Litros *</TableHead>
                    <TableHead className="text-xs w-28 text-right">R$ / Litro</TableHead>
                    <TableHead className="text-xs w-32 text-right">Valor Total (R$) *</TableHead>
                    <TableHead className="text-xs w-28 text-right">Hodômetro</TableHead>
                    <TableHead className="text-xs w-14 text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length > 0 ? (
                    rows.map((row) => {
                      const isOutOfMonth =
                        !row.issueDate || row.issueDate.slice(0, 7) !== competenceMonth;
                      const isDiffSupplier = validation.differentSupplierRows.some(
                        (d) => d.id === row.id
                      );
                      const isDuplicate = Boolean(row.alreadyImported);

                      return (
                        <TableRow
                          key={row.id}
                          className={`border-gray-700/60 ${
                            isDuplicate || isOutOfMonth || isDiffSupplier ? 'bg-red-950/20' : ''
                          }`}
                        >
                          <TableCell className="py-2">
                            <div className="flex flex-wrap items-center gap-1">
                              <Badge
                                className={
                                  row.fileType === 'XML'
                                    ? 'bg-emerald-600 text-white text-[10px]'
                                    : 'bg-blue-600 text-white text-[10px]'
                                }
                              >
                                {row.fileType}
                              </Badge>
                              {isDuplicate && (
                                <Badge className="bg-red-600 text-white text-[9px] px-1.5 py-0">
                                  JÁ IMPORTADA
                                </Badge>
                              )}
                            </div>
                            <div
                              className="text-[10px] text-gray-400 truncate max-w-[85px] mt-0.5"
                              title={row.fileName}
                            >
                              {row.fileName}
                            </div>
                          </TableCell>

                          <TableCell className="py-2">
                            <Input
                              value={row.invoiceNumber}
                              onChange={(e) => updateRow(row.id, 'invoiceNumber', e.target.value)}
                              placeholder="Nº NF"
                              className={`h-8 text-xs font-mono bg-seguranca-black text-white ${
                                isDuplicate ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-600'
                              }`}
                            />
                            {isDuplicate && (
                              <span
                                className="text-[10px] text-red-400 font-semibold block mt-0.5"
                                title={row.duplicateWarning}
                              >
                                Nota já cadastrada
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="py-2">
                            <Input
                              type="date"
                              value={row.issueDate}
                              onChange={(e) => updateRow(row.id, 'issueDate', e.target.value)}
                              className={`h-8 text-xs bg-seguranca-black text-white ${
                                isOutOfMonth ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-600'
                              }`}
                            />
                            {isOutOfMonth && (
                              <span className="text-[10px] text-red-400 font-semibold block mt-0.5">
                                Fora de {competenceMonth.split('-').reverse().join('/')}
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="py-2">
                            <Select
                              value={row.vehicleId || ''}
                              onValueChange={(val) => updateRow(row.id, 'vehicleId', val)}
                            >
                              <SelectTrigger
                                className={`h-8 text-xs bg-seguranca-black text-white ${
                                  !row.vehicleId && !defaultVehicleId ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-600'
                                }`}
                              >
                                <SelectValue placeholder="Selecionar placa..." />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 border-gray-700 text-white max-h-60">
                                {veiculos.map((v) => {
                                  const plate = v.plate || (v as any).placa || '';
                                  const prefix = v.fleetNumber || (v as any).prefixo || '';
                                  return (
                                    <SelectItem key={v.id} value={v.id}>
                                      {prefix ? `${plate} (${prefix})` : plate} — {v.model}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            {row.detectedPlate ? (
                              row.vehicleId ? (
                                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                                  Placa na NF: {formatPlate(row.detectedPlate)}
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                                  <AlertTriangle className="h-3 w-3 shrink-0" />
                                  Placa na NF: {formatPlate(row.detectedPlate)} (não cadastrada)
                                </span>
                              )
                            ) : defaultVehicleId && row.vehicleId === defaultVehicleId ? (
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                Padrão do lote aplicado
                              </span>
                            ) : null}
                          </TableCell>

                          <TableCell className="py-2">
                            <Select
                              value={row.fuelType}
                              onValueChange={(val) => updateRow(row.id, 'fuelType', val)}
                            >
                              <SelectTrigger className="h-8 text-xs bg-seguranca-black border-gray-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-900 border-gray-700 text-white">
                                <SelectItem value="DIESEL">Diesel</SelectItem>
                                <SelectItem value="GASOLINE">Gasolina</SelectItem>
                                <SelectItem value="ETHANOL">Etanol</SelectItem>
                                <SelectItem value="FLEX">Flex</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell className="py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={row.liters || ''}
                              onChange={(e) => updateRow(row.id, 'liters', Number(e.target.value))}
                              className="h-8 text-xs text-right font-mono bg-seguranca-black border-gray-600 text-white"
                            />
                          </TableCell>

                          <TableCell className="py-2">
                            <Input
                              type="number"
                              step="0.001"
                              value={row.pricePerLiter || ''}
                              onChange={(e) =>
                                updateRow(row.id, 'pricePerLiter', Number(e.target.value))
                              }
                              className="h-8 text-xs text-right font-mono bg-seguranca-black border-gray-600 text-white"
                            />
                          </TableCell>

                          <TableCell className="py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={row.totalValue || ''}
                              onChange={(e) =>
                                updateRow(row.id, 'totalValue', Number(e.target.value))
                              }
                              className="h-8 text-xs text-right font-mono font-bold bg-seguranca-black border-gray-600 text-emerald-400"
                            />
                          </TableCell>

                          <TableCell className="py-2">
                            <Input
                              type="number"
                              value={row.mileage || ''}
                              onChange={(e) => updateRow(row.id, 'mileage', Number(e.target.value))}
                              placeholder="KM"
                              className="h-8 text-xs text-right font-mono bg-seguranca-black border-gray-600 text-white"
                            />
                            {row.mileage > 0 && (
                              <span className="text-[10px] text-emerald-400 font-mono block text-right mt-0.5">
                                {row.mileage.toLocaleString('pt-BR')} km
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="py-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRow(row.id)}
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                              title="Remover nota do lote"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-400 text-xs">
                        Nenhuma nota fiscal selecionada ainda. Clique na área acima para importar arquivos XML ou PDF em lote.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* RODAPÉ COM RESUMO CONSOLIDADO DO FORNECEDOR E BOTÃO DE CONFIRMAÇÃO */}
        <div className="flex-none p-4 border-t border-gray-700/60 bg-seguranca-black/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div>
              <span className="text-gray-400">Competência: </span>
              <strong className="text-white font-mono">
                {competenceMonth.split('-').reverse().join('/')}
              </strong>
            </div>
            <div>
              <span className="text-gray-400">Notas: </span>
              <strong className="text-white font-mono">{rows.length}</strong>
            </div>
            <div>
              <span className="text-gray-400">Total Litros: </span>
              <strong className="text-blue-400 font-mono">
                {validation.totalLiters.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L
              </strong>
            </div>
            <div>
              <span className="text-gray-400">Total do Fornecedor: </span>
              <strong className="text-emerald-400 font-mono text-sm">
                R$ {validation.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={submitting || rows.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold min-w-[220px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando {rows.length} Nota(s)...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Confirmar Importação ({rows.length} {rows.length === 1 ? 'Nota' : 'Notas'})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AbastecimentoExternoBatchImportModal;

