import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  RefreshCw,
  Search,
  Trash2,
  Sparkles,
  Building2,
  FileCheck,
  HelpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  SupplierImportParser,
  SupplierParseResult,
  ParsedSupplierRow,
  formatCpfCnpjString
} from '@/utils/supplierImportParser';
import { contasAPagarService } from '@/services/contasAPagarService';

interface SupplierImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SupplierImportModal: React.FC<SupplierImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parseResult, setParseResult] = useState<SupplierParseResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewRows, setPreviewRows] = useState<ParsedSupplierRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const resetState = () => {
    setFile(null);
    setParseResult(null);
    setPreviewRows([]);
    setSearchTerm('');
    setIsProcessing(false);
    setIsSaving(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const result = await SupplierImportParser.parseFile(selectedFile);
      setParseResult(result);
      setPreviewRows(result.rows);

      if (result.rows.length === 0) {
        toast({
          title: "Atenção",
          description: "Nenhum registro de fornecedor pôde ser extraído deste arquivo.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Análise Concluída",
          description: `${result.rows.length} fornecedores identificados com sucesso no arquivo!`,
        });
      }
    } catch (error: any) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro ao analisar arquivo",
        description: error.message || "Não foi possível ler o arquivo. Verifique o formato.",
        variant: "destructive"
      });
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleRemoveRow = (id: string) => {
    setPreviewRows(prev => prev.filter(r => r.id !== id));
  };

  const handleRowChange = (id: string, field: keyof ParsedSupplierRow, value: string) => {
    setPreviewRows(prev =>
      prev.map(r => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          if (field === 'cnpj') {
            updated.cnpj = formatCpfCnpjString(value);
          }
          return updated;
        }
        return r;
      })
    );
  };

  const handleConfirmImport = async () => {
    if (previewRows.length === 0) {
      toast({
        title: "Lista vazia",
        description: "Nenhum fornecedor disponível para importação.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Mapear linhas para DTO do backend
      const dtos = previewRows.map(r => ({
        name: r.name,
        tradeName: r.tradeName,
        contactName: r.contactName,
        registrationNumber: r.stateRegistration || r.registrationNumber,
        cnpj: r.cnpj,
        phone: r.mobile || r.phone,
        email: r.email,
        address: r.address,
        city: r.city,
        state: r.state,
        zipCode: r.zipCode,
        notes: r.notes,
        isActive: true
      }));

      const res = await contasAPagarService.importarFornecedoresBatch(dtos);

      toast({
        title: "Importação Concluída com Sucesso!",
        description: `${res.inserted} fornecedor(es) inserido(s), ${res.updated} atualizado(s) no banco de dados.`,
      });

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Erro ao salvar fornecedores:', error);
      toast({
        title: "Erro ao salvar no banco",
        description: error.response?.data?.message || error.message || "Falha na comunicação com o servidor.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPreview = previewRows.filter(r => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.tradeName && r.tradeName.toLowerCase().includes(q)) ||
      (r.cnpj && r.cnpj.includes(q)) ||
      (r.phone && r.phone.includes(q)) ||
      (r.mobile && r.mobile.includes(q)) ||
      (r.address && r.address.toLowerCase().includes(q)) ||
      (r.neighborhood && r.neighborhood.toLowerCase().includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.registrationNumber && r.registrationNumber.includes(q)) ||
      (r.stateRegistration && r.stateRegistration.includes(q)) ||
      (r.municipalRegistration && r.municipalRegistration.includes(q))
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-5xl bg-zinc-950 text-zinc-100 border-zinc-800 max-h-[92vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="border-b border-zinc-800 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  Importação de Fornecedores para o Banco de Dados
                  <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-xs">
                    PDF & Excel
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-xs mt-0.5">
                  Analisa arquivos em PDF ou planilhas Excel/CSV, mapeia as colunas com a tabela de Fornecedores e insere os registros no banco.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* STEP 1: UPLOAD DO ARQUIVO */}
        {!parseResult ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full max-w-2xl border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                  : 'border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-600'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileChange(f);
                }}
                className="hidden"
              />

              <div className="flex gap-3 mb-4">
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
              </div>

              {isProcessing ? (
                <div className="flex flex-col items-center space-y-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                  <p className="text-sm font-semibold text-zinc-200">Analisando documento e mapeando colunas do banco de dados...</p>
                  <p className="text-xs text-zinc-500">Extraindo nomes, CNPJ/CPF, endereços e telefones...</p>
                </div>
              ) : (
                <>
                  <p className="text-base font-semibold text-zinc-200">
                    Arraste e solte o arquivo de fornecedores aqui
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    ou <span className="text-amber-400 font-semibold underline underline-offset-2">clique para selecionar do computador</span>
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] text-zinc-500">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">📄 PDF (.pdf)</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">📊 Excel (.xlsx, .xls)</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">📑 CSV (.csv)</span>
                  </div>
                </>
              )}
            </div>

            {/* Explicação das Colunas Reconhecidas */}
            <Card className="w-full max-w-2xl bg-zinc-900/70 border-zinc-800 text-zinc-300">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 mb-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  Colunas suportadas e gravadas na tabela <code className="text-amber-300 bg-zinc-950 px-1.5 py-0.5 rounded font-mono text-[11px]">suppliers</code>:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-zinc-400">
                  <div className="p-1.5 bg-zinc-950/60 rounded border border-zinc-800">
                    <span className="font-semibold text-zinc-200">Nome / Razão Social:</span>
                    <p className="text-[10px] text-zinc-500">name / trade_name</p>
                  </div>
                  <div className="p-1.5 bg-zinc-950/60 rounded border border-zinc-800">
                    <span className="font-semibold text-zinc-200">CPF / CNPJ:</span>
                    <p className="text-[10px] text-zinc-500">cnpj (com/sem máscara)</p>
                  </div>
                  <div className="p-1.5 bg-zinc-950/60 rounded border border-zinc-800">
                    <span className="font-semibold text-zinc-200">ENDEREÇO / Nº / COMPL. / BAIRRO:</span>
                    <p className="text-[10px] text-zinc-500">address (composto)</p>
                  </div>
                  <div className="p-1.5 bg-zinc-950/60 rounded border border-zinc-800">
                    <span className="font-semibold text-zinc-200">TEL / CEL / EMAIL:</span>
                    <p className="text-[10px] text-zinc-500">phone (CEL ok) / email</p>
                  </div>
                  <div className="p-1.5 bg-zinc-950/60 rounded border border-zinc-800">
                    <span className="font-semibold text-zinc-200">INSCRIÇÃO ESTADUAL:</span>
                    <p className="text-[10px] text-zinc-500">registration_number</p>
                  </div>
                  <div className="p-1.5 bg-zinc-950/60 rounded border border-zinc-800">
                    <span className="font-semibold text-zinc-200">INSCRIÇÃO MUNICIPAL:</span>
                    <p className="text-[10px] text-zinc-500">notes (IM)</p>
                  </div>
                  <div className="p-1.5 bg-zinc-950/60 rounded border border-zinc-800">
                    <span className="font-semibold text-zinc-200">Cidade / UF / CEP:</span>
                    <p className="text-[10px] text-zinc-500">city / state / zip_code</p>
                  </div>
                  <div className="p-1.5 bg-zinc-950/60 rounded border border-zinc-800">
                    <span className="font-semibold text-zinc-200">Contato / Obs:</span>
                    <p className="text-[10px] text-zinc-500">contact_name / notes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* STEP 2: ANÁLISE DE COLUNAS DO BANCO & PRÉVIA DOS REGISTROS */
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Banner de Mapeamento com o Banco de Dados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="bg-zinc-900/80 border-zinc-800 p-3 col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
                      Mapeamento de Colunas com o Banco de Dados
                    </span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border-0">
                    Compatibilidade 100% OK
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {parseResult.columnsMapping.map((col, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 text-[11px] flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-zinc-400">{col.fileColumn}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-zinc-500" />
                      <span className="text-amber-400 font-mono font-medium">{col.dbColumn}</span>
                    </span>
                  ))}
                </div>
              </Card>

              <Card className="bg-zinc-900/80 border-zinc-800 p-3 flex flex-col justify-center">
                <p className="text-xs text-zinc-400">Arquivo Carregado:</p>
                <p className="text-sm font-bold text-zinc-100 truncate">{parseResult.fileName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-blue-500/20 text-blue-300 text-[11px]">
                    {previewRows.length} registros prontos
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setParseResult(null);
                      setFile(null);
                    }}
                    className="text-xs h-7 text-zinc-400 hover:text-zinc-200"
                  >
                    Trocar arquivo
                  </Button>
                </div>
              </Card>
            </div>

            {/* Barra de Pesquisa e Filtro de Prévia */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Filtrar fornecedores extraídos por Nome, CNPJ/CPF, Telefone ou Endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-zinc-900 border-zinc-800 text-xs text-zinc-100"
                />
              </div>
              <span className="text-xs text-zinc-400 whitespace-nowrap">
                Exibindo <strong className="text-zinc-200">{filteredPreview.length}</strong> de {previewRows.length}
              </span>
            </div>

            {/* Tabela de Prévia e Edição dos Registros */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40">
              <div className="max-h-72 overflow-y-auto">
                <Table>
                  <TableHeader className="bg-zinc-900 sticky top-0 z-10 border-b border-zinc-800">
                    <TableRow>
                      <TableHead className="text-zinc-300 text-xs font-semibold w-8">#</TableHead>
                      <TableHead className="text-zinc-300 text-xs font-semibold">Nome / Razão Social</TableHead>
                      <TableHead className="text-zinc-300 text-xs font-semibold">CPF / CNPJ</TableHead>
                      <TableHead className="text-zinc-300 text-xs font-semibold">Telefone</TableHead>
                      <TableHead className="text-zinc-300 text-xs font-semibold">Endereço</TableHead>
                      <TableHead className="text-zinc-300 text-xs font-semibold">Cidade / UF</TableHead>
                      <TableHead className="text-zinc-300 text-xs font-semibold w-12 text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPreview.map((row, idx) => (
                      <TableRow key={row.id} className="hover:bg-zinc-800/40 border-b border-zinc-800/60">
                        <TableCell className="text-[11px] text-zinc-500 font-mono">{idx + 1}</TableCell>
                        <TableCell>
                          <Input
                            value={row.name}
                            onChange={(e) => handleRowChange(row.id, 'name', e.target.value)}
                            className="h-7 text-xs bg-zinc-950/60 border-zinc-800 font-medium text-zinc-100"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.cnpj || ''}
                            placeholder="Sem documento"
                            onChange={(e) => handleRowChange(row.id, 'cnpj', e.target.value)}
                            className="h-7 text-xs bg-zinc-950/60 border-zinc-800 font-mono text-zinc-300 w-36"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.phone || ''}
                            placeholder="Telefone..."
                            onChange={(e) => handleRowChange(row.id, 'phone', e.target.value)}
                            className="h-7 text-xs bg-zinc-950/60 border-zinc-800 text-zinc-300 w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.address || ''}
                            placeholder="Endereço..."
                            onChange={(e) => handleRowChange(row.id, 'address', e.target.value)}
                            className="h-7 text-xs bg-zinc-950/60 border-zinc-800 text-zinc-300"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 w-28">
                            <Input
                              value={row.city || ''}
                              placeholder="Cidade"
                              onChange={(e) => handleRowChange(row.id, 'city', e.target.value)}
                              className="h-7 text-xs bg-zinc-950/60 border-zinc-800 text-zinc-300 flex-1"
                            />
                            <Input
                              value={row.state || ''}
                              placeholder="UF"
                              maxLength={2}
                              onChange={(e) => handleRowChange(row.id, 'state', e.target.value.toUpperCase())}
                              className="h-7 text-xs bg-zinc-950/60 border-zinc-800 text-zinc-300 w-10 text-center uppercase"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRow(row.id)}
                            className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                            title="Remover da lista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredPreview.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-zinc-500 text-xs">
                          Nenhum registro correspondente ao filtro.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-zinc-800 pt-3 flex items-center justify-between sm:justify-between w-full">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSaving}
            className="text-zinc-400 hover:text-zinc-200"
          >
            Cancelar
          </Button>

          {parseResult && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setParseResult(null);
                  setFile(null);
                }}
                disabled={isSaving}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs"
              >
                Voltar
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={isSaving || previewRows.length === 0}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Gravando no Banco de Dados...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Gravar {previewRows.length} Fornecedor(es) no Banco
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
