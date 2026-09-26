import React, { useState, useEffect, useRef } from 'react';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  FileText,
  Download,
  HardHat,
  Plus,
  Trash2,
  CheckCircle2,
  PenTool,
  RotateCcw,
  Package,
  Calendar,
  Shield,
  Layers,
  FileSpreadsheet,
  Save,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Employee } from '@/services/employeeService';
import { stockService } from '@/services/stockService';
import { StockItem } from '@/types/stock';
import { epiDeliveryFormService } from '@/services/epiDeliveryFormService';
import { epiPdfGeneratorService, EpiFormItemData } from '@/services/epiPdfGeneratorService';
import { useToast } from '@/hooks/use-toast';

interface EpiDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess?: () => void;
}

export const EpiDeliveryModal: React.FC<EpiDeliveryModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSuccess,
}) => {
  const { toast } = useToast();

  // Configurações do Documento
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [isManual, setIsManual] = useState<boolean>(false); // false = Preenchido, true = Manual (folha em branco com dados do empregado)
  const [enableDigitalSignature, setEnableDigitalSignature] = useState<boolean>(false);

  // Itens de EPI
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState<boolean>(false);
  const [selectedStockItemId, setSelectedStockItemId] = useState<string>('');
  const [customEpiName, setCustomEpiName] = useState<string>('');
  const [itemCa, setItemCa] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemDeliveryDate, setItemDeliveryDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [epiList, setEpiList] = useState<EpiFormItemData[]>([]);

  // Canvas de Assinatura Digital
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSignature, setHasSignature] = useState<boolean>(false);

  // Ações
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Carregar itens de estoque ao abrir
  useEffect(() => {
    if (isOpen) {
      loadStockItems();
      // Resetar estados
      setEpiList([]);
      setEnableDigitalSignature(false);
      setHasSignature(false);
      clearSignature();
    }
  }, [isOpen]);

  const loadStockItems = async () => {
    try {
      setLoadingStock(true);
      const items = await stockService.getAllItems();
      // Filtrar itens da categoria EPI ou Uniformes, ou permitir todos
      const filtered = items.filter(
        item => 
          item.category === 'EPI' || 
          item.category === 'UNIFORMES' || 
          item.category === 'FERRAMENTAS' ||
          (item.name && item.name.toLowerCase().includes('epi')) ||
          (item.name && item.name.toLowerCase().includes('luva')) ||
          (item.name && item.name.toLowerCase().includes('óculos')) ||
          (item.name && item.name.toLowerCase().includes('capacete')) ||
          (item.name && item.name.toLowerCase().includes('bota'))
      );
      setStockItems(filtered.length > 0 ? filtered : items);
    } catch (err) {
      console.error('Erro ao carregar estoque de EPIs:', err);
    } finally {
      setLoadingStock(false);
    }
  };

  // Quando o usuário seleciona um item do estoque, preenche os campos automaticamente
  const handleSelectStockItem = (itemId: string) => {
    setSelectedStockItemId(itemId);
    const found = stockItems.find(i => i.id === itemId);
    if (found) {
      setCustomEpiName(found.name);
      setItemCa(found.caNumber || '');
    }
  };

  // Adicionar EPI na lista
  const handleAddEpi = () => {
    if (!customEpiName.trim()) {
      toast({
        title: 'Nome do EPI obrigatório',
        description: 'Selecione um item do estoque ou digite o nome do equipamento.',
        variant: 'destructive',
      });
      return;
    }

    if (itemQuantity <= 0) {
      toast({
        title: 'Quantidade inválida',
        description: 'A quantidade deve ser de no mínimo 1.',
        variant: 'destructive',
      });
      return;
    }

    const newItem: EpiFormItemData = {
      itemNumber: epiList.length + 1,
      name: customEpiName.trim(),
      ca: itemCa.trim() || 'N/A',
      quantity: itemQuantity,
      deliveryDate: itemDeliveryDate 
        ? new Date(itemDeliveryDate + 'T12:00:00').toLocaleDateString('pt-BR') 
        : new Date().toLocaleDateString('pt-BR'),
    };

    setEpiList(prev => [...prev, newItem]);
    // Limpar formulário de inserção
    setSelectedStockItemId('');
    setCustomEpiName('');
    setItemCa('');
    setItemQuantity(1);

    toast({
      title: 'EPI adicionado',
      description: `${newItem.name} incluído na ficha.`,
    });
  };

  const handleRemoveEpi = (index: number) => {
    setEpiList(prev => prev.filter((_, i) => i !== index));
  };

  // Lógica de Canvas para Assinatura Digital
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0b2046'; // Azul escuro caneta
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const getSignatureDataUrl = (): string | null => {
    if (!enableDigitalSignature || !hasSignature) return null;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  };

  // Gerar e Baixar PDF
  const handleDownloadPdf = async () => {
    if (!employee) return;

    if (!isManual && epiList.length === 0) {
      toast({
        title: 'Nenhum EPI selecionado',
        description: 'Adicione pelo menos um EPI à lista ou escolha a opção "Ficha Manual" para gerar sem itens.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGeneratingPdf(true);
      const signatureImg = getSignatureDataUrl();

      await epiPdfGeneratorService.downloadPdf({
        employee,
        orientation,
        isManual,
        items: epiList,
        digitalSignature: signatureImg,
        signedAt: new Date(),
      });

      toast({
        title: 'Ficha de EPI gerada com sucesso!',
        description: `O arquivo PDF (${orientation === 'landscape' ? 'Paisagem' : 'Retrato'}) foi baixado.`,
      });
    } catch (err) {
      console.error('Erro ao gerar PDF da ficha de EPI:', err);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível gerar a ficha. Verifique as configurações e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Salvar no Sistema e Baixar
  const handleSaveAndDownload = async () => {
    if (!employee) return;

    if (!isManual && epiList.length === 0) {
      toast({
        title: 'Adicione itens de EPI',
        description: 'Inclua os itens entregues para registrar no histórico do colaborador.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);

      // 1. Salvar no backend caso haja itens para registrar
        let companyId = (employee as any).companyId || (employee as any).company?.id;
        if (!companyId) {
          try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const u = JSON.parse(userStr);
              companyId = u.companyId || u.company?.id;
            }
          } catch (_) {}
        }
        try {
          await epiDeliveryFormService.create({
            employeeId: employee.id,
            companyId: companyId,
            deliveryDate: itemDeliveryDate || new Date().toISOString().split('T')[0],
            items: epiList.map(item => ({
              epiName: item.name,
              quantity: Number(item.quantity) || 1,
              ca: item.ca || undefined,
            })),
          });
        } catch (saveError) {
          console.warn('Aviso: Registro no banco falhou ou já cadastrado, prosseguindo com geração do PDF:', saveError);
        }
      }

      // 2. Baixar PDF
      await handleDownloadPdf();

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Erro ao salvar e baixar ficha:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!employee) return null;

  const cargo = (employee as any).position?.name || employee.role || 'Não Informado';
  const matricula = employee.registrationNumber || employee.employeeCode || 'EMP' + employee.id.substring(0, 4);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-seguranca-graphite border-gray-700 text-white p-6 shadow-2xl">
        <DialogHeader className="border-b border-gray-700/80 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-seguranca-red/20 border border-seguranca-red/30 text-seguranca-red">
                <HardHat className="h-6 w-6 text-seguranca-yellow" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  Emissão de Ficha de Entrega de EPI
                  <Badge variant="outline" className="text-xs border-seguranca-yellow text-seguranca-yellow">
                    NR-6 / SST
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-400">
                  Gere o documento oficial da Viação São Silvestre em PDF preenchido ou manual para prancheta.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Card do Colaborador */}
        <div className="bg-seguranca-black/50 border border-gray-700 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Colaborador</span>
            <span className="text-white font-bold truncate block">{employee.name}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Matrícula</span>
            <span className="text-white font-mono">{matricula}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Função / Cargo</span>
            <span className="text-white truncate block">{cargo}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">CPF</span>
            <span className="text-white font-mono">{employee.cpf || employee.document || 'N/D'}</span>
          </div>
        </div>

        {/* Configurações de Emissão: Modo e Orientação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Seletor de Modo: Preenchida vs Manual */}
          <div className="bg-seguranca-black/30 border border-gray-700/80 rounded-xl p-4 space-y-3">
            <Label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-seguranca-yellow" />
              Modo de Preenchimento da Ficha
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsManual(false)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                  !isManual
                    ? 'border-seguranca-red bg-seguranca-red/20 text-white shadow-sm'
                    : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:bg-gray-800'
                }`}
              >
                <FileText className={`h-5 w-5 mb-1 ${!isManual ? 'text-seguranca-red' : 'text-gray-400'}`} />
                <span>Ficha Preenchida</span>
                <span className="text-[10px] text-gray-400 text-center mt-0.5">Com itens e quantidades selecionadas</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManual(true)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                  isManual
                    ? 'border-seguranca-yellow bg-seguranca-yellow/20 text-white shadow-sm'
                    : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:bg-gray-800'
                }`}
              >
                <FileSpreadsheet className={`h-5 w-5 mb-1 ${isManual ? 'text-seguranca-yellow' : 'text-gray-400'}`} />
                <span>Ficha Manual</span>
                <span className="text-[10px] text-gray-400 text-center mt-0.5">Dados preenchidos + linhas em branco</span>
              </button>
            </div>
            {isManual && (
              <p className="text-[11px] text-seguranca-yellow flex items-center gap-1 bg-seguranca-yellow/10 p-2 rounded border border-seguranca-yellow/30">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Ideal para impressão e uso em prancheta no almoxarifado.
              </p>
            )}
          </div>

          {/* Seletor de Orientação: Paisagem vs Retrato */}
          <div className="bg-seguranca-black/30 border border-gray-700/80 rounded-xl p-4 space-y-3">
            <Label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-seguranca-yellow" />
              Orientação da Página (Modelo do PDF)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                  orientation === 'landscape'
                    ? 'border-blue-500 bg-blue-500/20 text-white shadow-sm'
                    : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:bg-gray-800'
                }`}
              >
                <div className="w-7 h-5 border-2 border-current rounded-sm mb-1"></div>
                <span>Paisagem</span>
                <span className="text-[10px] text-gray-400 text-center mt-0.5">Modelo Oficial com Ônibus</span>
              </button>

              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                  orientation === 'portrait'
                    ? 'border-blue-500 bg-blue-500/20 text-white shadow-sm'
                    : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:bg-gray-800'
                }`}
              >
                <div className="w-5 h-7 border-2 border-current rounded-sm mb-1"></div>
                <span>Retrato</span>
                <span className="text-[10px] text-gray-400 text-center mt-0.5">Papel Timbrado Vertical</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              {orientation === 'landscape' 
                ? 'Design moderno com foto rodoviária e caixas integradas.' 
                : 'Formato vertical contínuo com coluna de devolução.'}
            </p>
          </div>
        </div>

        {/* Inclusão de Itens (Apenas visível se for Preenchida) */}
        {!isManual && (
          <div className="bg-seguranca-black/30 border border-gray-700/80 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-seguranca-yellow" />
                Equipamentos de Proteção Individual (EPIs a Entregar)
              </Label>
              <Badge variant="outline" className="text-[11px] border-gray-600 text-gray-300">
                {epiList.length} item(ns) incluído(s)
              </Badge>
            </div>

            {/* Linha de Seleção / Adição */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
              {/* Seleção do Estoque ou Nome Manual */}
              <div className="md:col-span-5 space-y-1">
                <Label className="text-[11px] text-gray-400">Buscar no Estoque / Nome do EPI</Label>
                <div className="relative">
                  <Input
                    list="stock-epis-datalist"
                    value={customEpiName}
                    onChange={e => {
                      const val = e.target.value;
                      setCustomEpiName(val);
                      const match = stockItems.find(i => i.name.toLowerCase() === val.toLowerCase());
                      if (match) {
                        setSelectedStockItemId(match.id);
                        if (match.caNumber) setItemCa(match.caNumber);
                      }
                    }}
                    placeholder="Ex: Capacete, Protetor Auricular, Óculos..."
                    className="bg-seguranca-black border-gray-600 text-white text-xs h-9"
                  />
                  <datalist id="stock-epis-datalist">
                    {stockItems.map(item => (
                      <option key={item.id} value={item.name}>
                        {`Qtd Disp: ${item.currentQuantity} ${item.caNumber ? `| CA: ${item.caNumber}` : ''}`}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Número do CA */}
              <div className="md:col-span-2 space-y-1">
                <Label className="text-[11px] text-gray-400">Nº do C.A.</Label>
                <Input
                  value={itemCa}
                  onChange={e => setItemCa(e.target.value)}
                  placeholder="Ex: 31469"
                  className="bg-seguranca-black border-gray-600 text-white text-xs h-9"
                />
              </div>

              {/* Quantidade */}
              <div className="md:col-span-2 space-y-1">
                <Label className="text-[11px] text-gray-400">Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={e => setItemQuantity(parseInt(e.target.value) || 1)}
                  className="bg-seguranca-black border-gray-600 text-white text-xs h-9"
                />
              </div>

              {/* Data da Entrega */}
              <div className="md:col-span-2 space-y-1">
                <Label className="text-[11px] text-gray-400">Data de Entrega</Label>
                <Input
                  type="date"
                  value={itemDeliveryDate}
                  onChange={e => setItemDeliveryDate(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-white text-xs h-9"
                />
              </div>

              {/* Botão Adicionar */}
              <div className="md:col-span-1">
                <Button
                  type="button"
                  onClick={handleAddEpi}
                  className="w-full bg-seguranca-red hover:bg-seguranca-darkred text-white h-9 px-2 text-xs flex items-center justify-center"
                  title="Incluir EPI"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tabela de Itens Adicionados */}
            {epiList.length > 0 ? (
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-seguranca-black/60 text-gray-400 border-b border-gray-700">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center">Item</th>
                      <th className="py-2 px-3">Descrição do Equipamento</th>
                      <th className="py-2 px-3 w-24 text-center">C.A.</th>
                      <th className="py-2 px-3 w-20 text-center">Qtd</th>
                      <th className="py-2 px-3 w-28 text-center">Data Entrega</th>
                      <th className="py-2 px-3 w-12 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/60">
                    {epiList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-seguranca-black/40">
                        <td className="py-2 px-3 text-center text-gray-400 font-mono">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="py-2 px-3 font-medium text-white">{item.name}</td>
                        <td className="py-2 px-3 text-center text-gray-300 font-mono">{item.ca || 'N/A'}</td>
                        <td className="py-2 px-3 text-center font-bold text-seguranca-yellow">{item.quantity}</td>
                        <td className="py-2 px-3 text-center text-gray-300">{item.deliveryDate}</td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveEpi(idx)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Remover item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-gray-700 rounded-lg text-gray-400 text-xs">
                Nenhum EPI adicionado ainda. Selecione os itens acima para montar a ficha.
              </div>
            )}
          </div>
        )}

        {/* Opção de Assinatura Digital */}
        <div className="bg-seguranca-black/30 border border-gray-700/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-gray-200 flex items-center gap-1.5 cursor-pointer">
                <PenTool className="h-4 w-4 text-seguranca-yellow" />
                Assinatura Digital do Funcionário
              </Label>
              <p className="text-[11px] text-gray-400">
                Permita que o colaborador assine diretamente na tela (celular, tablet ou mouse).
              </p>
            </div>
            <Switch
              checked={enableDigitalSignature}
              onCheckedChange={setEnableDigitalSignature}
            />
          </div>

          {enableDigitalSignature && (
            <div className="pt-2 space-y-2">
              <div className="border border-gray-600 rounded-lg bg-white overflow-hidden p-1 shadow-inner relative">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={120}
                  className="w-full h-28 touch-none cursor-crosshair bg-white"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-400 text-xs italic">
                    Assine aqui com o dedo ou mouse
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[11px]">
                  {hasSignature ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Assinatura capturada com sucesso!
                    </span>
                  ) : (
                    'Aguardando rubrica/assinatura do funcionário'
                  )}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                  className="h-7 text-xs border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé e Botões de Ação */}
        <DialogFooter className="border-t border-gray-700/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-white"
          >
            Cancelar
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="text-xs border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow/10 h-9"
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-1.5" />
              )}
              Apenas Baixar PDF
            </Button>

            <Button
              type="button"
              onClick={handleSaveAndDownload}
              disabled={isSaving || isGeneratingPdf}
              className="text-xs bg-seguranca-red hover:bg-seguranca-darkred text-white h-9"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              Salvar & Gerar Ficha
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
