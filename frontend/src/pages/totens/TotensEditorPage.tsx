import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Send, 
  Plus, 
  Film, 
  Image as ImageIcon, 
  Type, 
  MousePointer, 
  QrCode, 
  FileText,
  Smartphone,
  Monitor,
  RotateCw,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Layers,
  Settings,
  Eye,
  Check,
  X,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Move
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { kioskService } from '@/services/kioskService';
import { 
  KioskPresentation, 
  KioskSlide, 
  KioskSlideElement, 
  SlideElementType,
  KioskMediaAsset 
} from '@/types/kiosk';

export const TotensEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const presentationId = paramId || searchParams.get('id') || '';
  const { toast } = useToast();

  // Estados principais
  const [presentation, setPresentation] = useState<KioskPresentation | null>(null);
  const [slides, setSlides] = useState<KioskSlide[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<'LANDSCAPE' | 'PORTRAIT'>('LANDSCAPE');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Mídias para seleção
  const [mediaList, setMediaList] = useState<KioskMediaAsset[]>([]);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerMode, setMediaPickerMode] = useState<'BACKGROUND' | 'ELEMENT'>('BACKGROUND');

  // Preview Interativo Fullscreen
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);

  // Carregar Apresentação e Mídias
  useEffect(() => {
    if (!presentationId || presentationId === 'novo') {
      toast({
        title: 'ID de apresentação inválido',
        description: 'Selecione uma apresentação para editar.',
        variant: 'destructive',
      });
      navigate('/totens/apresentacoes');
      return;
    }

    const loadEditorData = async () => {
      setLoading(true);
      try {
        const [presData, mediaData] = await Promise.all([
          kioskService.getPresentationById(presentationId),
          kioskService.getMediaAssets().catch(() => [] as KioskMediaAsset[]),
        ]);

        setPresentation(presData);
        setMediaList(mediaData || []);

        const loadedSlides = (presData as any).slides || [];
        if (loadedSlides.length === 0) {
          // Slide inicial padrão se vier vazio
          const initialSlide: KioskSlide = {
            id: 'slide-1',
            presentationId,
            name: 'Slide 1 - Boas-Vindas',
            position: 0,
            durationMs: 10000,
            transitionType: 'FADE',
            interactionMode: 'AUTOMATIC',
            backgroundType: 'COLOR',
            elements: [],
          };
          setSlides([initialSlide]);
        } else {
          setSlides(loadedSlides);
        }
      } catch (err: any) {
        toast({
          title: 'Erro ao carregar editor',
          description: err?.response?.data?.message || 'Falha ao buscar detalhes da apresentação.',
          variant: 'destructive',
        });
        navigate('/totens/apresentacoes');
      } finally {
        setLoading(false);
      }
    };

    loadEditorData();
  }, [presentationId]);

  // Slide atual ativo
  const currentSlide: KioskSlide | undefined = slides[activeSlideIndex] || slides[0];

  // Elemento selecionado
  const selectedElement: KioskSlideElement | undefined = currentSlide?.elements.find(
    (el) => el.id === selectedElementId
  );

  // Salvar Apresentação completa
  const handleSavePresentation = async () => {
    if (!presentation) return;
    setSaving(true);
    try {
      // 1. Salva metadados da apresentação
      await kioskService.updatePresentation(presentation.id, {
        name: presentation.name,
        description: presentation.description,
        idleTimeoutSeconds: presentation.idleTimeoutSeconds,
      });

      // 2. Salva cada slide
      for (const slide of slides) {
        await kioskService.saveSlide(presentation.id, {
          id: slide.id.startsWith('slide-') ? undefined : slide.id,
          name: slide.name,
          position: slide.position,
          durationMs: slide.durationMs,
          transitionType: slide.transitionType,
          interactionMode: slide.interactionMode,
          backgroundType: slide.backgroundType,
          backgroundMediaId: slide.backgroundMediaId,
          elements: slide.elements.map((el) => ({
            id: el.id.startsWith('el-') ? undefined : el.id,
            elementType: el.elementType,
            content: el.content,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
            zIndex: el.zIndex,
            style: el.style,
            action: el.action,
          })),
        });
      }

      toast({
        title: 'Apresentação salva!',
        description: 'Todos os slides e elementos foram salvos com sucesso.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.response?.data?.message || 'Falha ao persistir alterações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Manipulação de Slides
  const handleAddSlide = () => {
    const newSlide: KioskSlide = {
      id: `slide-${Date.now()}`,
      presentationId,
      name: `Slide ${slides.length + 1}`,
      position: slides.length,
      durationMs: 10000,
      transitionType: 'FADE',
      interactionMode: 'AUTOMATIC',
      backgroundType: 'COLOR',
      elements: [],
    };
    const updated = [...slides, newSlide];
    setSlides(updated);
    setActiveSlideIndex(updated.length - 1);
    setSelectedElementId(null);
  };

  const handleDuplicateSlide = (index: number) => {
    const target = slides[index];
    const duplicated: KioskSlide = {
      ...target,
      id: `slide-${Date.now()}`,
      name: `${target.name} (Cópia)`,
      position: slides.length,
      elements: target.elements.map((el) => ({
        ...el,
        id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })),
    };
    const updated = [...slides, duplicated];
    setSlides(updated);
    setActiveSlideIndex(updated.length - 1);
  };

  const handleDeleteSlide = (index: number) => {
    if (slides.length <= 1) {
      toast({
        title: 'Slide obrigatório',
        description: 'A apresentação deve ter ao menos um slide.',
        variant: 'destructive',
      });
      return;
    }
    const updated = slides.filter((_, i) => i !== index).map((s, idx) => ({ ...s, position: idx }));
    setSlides(updated);
    setActiveSlideIndex(Math.max(0, index - 1));
    setSelectedElementId(null);
  };

  const handleMoveSlide = (index: number, direction: 'UP' | 'DOWN') => {
    if ((direction === 'UP' && index === 0) || (direction === 'DOWN' && index === slides.length - 1)) return;
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;
    // Reajusta positions
    const reordered = newSlides.map((s, idx) => ({ ...s, position: idx }));
    setSlides(reordered);
    setActiveSlideIndex(targetIndex);
  };

  // Atualizar Slide Atual
  const updateCurrentSlide = (patch: Partial<KioskSlide>) => {
    if (!currentSlide) return;
    const updatedSlides = [...slides];
    updatedSlides[activeSlideIndex] = { ...currentSlide, ...patch };
    setSlides(updatedSlides);
  };

  // Manipulação de Elementos
  const handleAddElement = (type: SlideElementType) => {
    if (!currentSlide) return;

    let defaultContent: Record<string, any> = {};
    let defaultWidth = 40;
    let defaultHeight = 20;

    switch (type) {
      case 'TEXT':
        defaultContent = { text: 'Título em Destaque', fontSize: 32, color: '#ffffff', fontWeight: 'bold' };
        defaultWidth = 60;
        defaultHeight = 15;
        break;
      case 'BUTTON':
        defaultContent = { label: 'Toque para Saber Mais', bgColor: '#3b82f6', textColor: '#ffffff' };
        defaultWidth = 30;
        defaultHeight = 10;
        break;
      case 'IMAGE':
        defaultContent = { mediaId: null, url: '', fit: 'cover' };
        defaultWidth = 40;
        defaultHeight = 40;
        break;
      case 'VIDEO':
        defaultContent = { mediaId: null, url: '', autoPlay: true, loop: true, muted: true };
        defaultWidth = 50;
        defaultHeight = 50;
        break;
      case 'CARD':
        defaultContent = { title: 'Horário de Linhas', description: 'Confira as próximas partidas dos ônibus corporativos', icon: 'bus' };
        defaultWidth = 45;
        defaultHeight = 25;
        break;
      case 'QR_CODE':
        defaultContent = { qrUrl: 'https://fluxbus.com.br/portal', label: 'Escaneie no seu celular' };
        defaultWidth = 25;
        defaultHeight = 35;
        break;
      case 'FORM':
        defaultContent = { 
          formTitle: 'Cadastro Rápido de Passageiro',
          fields: ['Nome', 'CPF', 'Telefone'],
          lgpdNotice: 'Seus dados serão processados exclusivamente para fins de transporte.'
        };
        defaultWidth = 50;
        defaultHeight = 60;
        break;
      case 'WEB_CONTENT':
        defaultContent = { src: 'https://fluxbus.com.br', allowedDomain: 'fluxbus.com.br' };
        defaultWidth = 60;
        defaultHeight = 50;
        break;
      default:
        defaultContent = {};
    }

    const newElement: KioskSlideElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      slideId: currentSlide.id,
      elementType: type,
      content: defaultContent,
      x: 20,
      y: 20,
      width: defaultWidth,
      height: defaultHeight,
      zIndex: (currentSlide.elements?.length || 0) + 1,
      style: {},
      action: { type: 'NONE' },
    };

    const updatedElements = [...(currentSlide.elements || []), newElement];
    updateCurrentSlide({ elements: updatedElements });
    setSelectedElementId(newElement.id);
  };

  // Atualizar Elemento Selecionado
  const updateSelectedElement = (patch: Partial<KioskSlideElement>) => {
    if (!currentSlide || !selectedElement) return;
    const updatedElements = currentSlide.elements.map((el) => {
      if (el.id === selectedElement.id) {
        return { ...el, ...patch };
      }
      return el;
    });
    updateCurrentSlide({ elements: updatedElements });
  };

  const handleDeleteElement = (elId: string) => {
    if (!currentSlide) return;
    const updatedElements = currentSlide.elements.filter((el) => el.id !== elId);
    updateCurrentSlide({ elements: updatedElements });
    setSelectedElementId(null);
  };

  // Abrir Media Picker
  const handleOpenMediaPicker = (mode: 'BACKGROUND' | 'ELEMENT') => {
    setMediaPickerMode(mode);
    setIsMediaPickerOpen(true);
  };

  // Selecionar Mídia no Picker
  const handleSelectMedia = (asset: KioskMediaAsset) => {
    if (mediaPickerMode === 'BACKGROUND') {
      updateCurrentSlide({
        backgroundType: asset.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        backgroundMediaId: asset.id,
      });
    } else if (mediaPickerMode === 'ELEMENT' && selectedElement) {
      updateSelectedElement({
        content: {
          ...selectedElement.content,
          mediaId: asset.id,
          url: `/api/kiosk-media/${asset.id}/content`,
          mediaType: asset.mediaType,
        },
      });
    }
    setIsMediaPickerOpen(false);
  };

  // Executar Ação no Preview Interativo
  const handlePreviewElementAction = (action?: Record<string, any>) => {
    if (!action || !action.type || action.type === 'NONE') return;

    if (action.type === 'GO_TO_SLIDE' && action.targetSlideIndex !== undefined) {
      const idx = Number(action.targetSlideIndex);
      if (idx >= 0 && idx < slides.length) {
        setPreviewSlideIndex(idx);
      }
    } else if (action.type === 'OPEN_URL' && action.url) {
      window.open(action.url, '_blank');
    }
  };

  // Timer de Auto-avanço no Preview
  useEffect(() => {
    if (!isPreviewOpen) return;
    const current = slides[previewSlideIndex];
    if (!current || !current.durationMs || current.interactionMode === 'INTERACTIVE') return;

    const timer = setTimeout(() => {
      setPreviewSlideIndex((prev) => (prev + 1) % slides.length);
    }, current.durationMs);

    return () => clearTimeout(timer);
  }, [isPreviewOpen, previewSlideIndex, slides]);

  return (
    <StandardLayout
      title={`Editor: ${presentation?.name || 'Apresentação'}`}
      subtitle="Construtor visual de telas, vídeos, botões de toque e fluxos interativos"
    >
      <div className="flex flex-col h-[calc(100vh-140px)] space-y-3 overflow-hidden">
        {/* Barra Superior do Editor */}
        <div className="flex items-center justify-between bg-card/90 border border-border px-4 py-2.5 rounded-2xl shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/totens/apresentacoes')}
              className="rounded-xl gap-1 text-muted-foreground hover:text-foreground h-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Apresentações
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {presentation?.name}
              </span>
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">
                {presentation?.status || 'Rascunho'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor Paisagem / Retrato */}
            <div className="flex items-center bg-muted/60 border border-border rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setOrientation('LANDSCAPE')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  orientation === 'LANDSCAPE' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Modo Paisagem (Horizontal 16:9)"
              >
                <Monitor className="h-3.5 w-3.5" />
                Paisagem
              </button>
              <button
                type="button"
                onClick={() => setOrientation('PORTRAIT')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  orientation === 'PORTRAIT' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Modo Retrato (Vertical 9:16)"
              >
                <Smartphone className="h-3.5 w-3.5" />
                Retrato
              </button>
            </div>

            {/* Botão de Preview */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPreviewSlideIndex(activeSlideIndex);
                setIsPreviewOpen(true);
              }}
              className="gap-1.5 rounded-xl border-border hover:bg-card h-8 text-xs font-medium"
            >
              <Play className="h-3.5 w-3.5 text-emerald-400" />
              Simular Totem
            </Button>

            {/* Salvar */}
            <Button
              size="sm"
              onClick={handleSavePresentation}
              disabled={saving}
              className="gap-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md h-8 text-xs font-semibold"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* Barra de Adicionar Elementos */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card/60 border border-border/80 rounded-xl overflow-x-auto shrink-0">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
            Adicionar:
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAddElement('TEXT')}
            className="h-7 text-xs gap-1.5 px-2.5 rounded-lg hover:bg-primary/10 hover:text-primary"
          >
            <Type className="h-3.5 w-3.5" />
            Texto
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAddElement('BUTTON')}
            className="h-7 text-xs gap-1.5 px-2.5 rounded-lg hover:bg-primary/10 hover:text-primary"
          >
            <MousePointer className="h-3.5 w-3.5" />
            Botão de Toque
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAddElement('IMAGE')}
            className="h-7 text-xs gap-1.5 px-2.5 rounded-lg hover:bg-primary/10 hover:text-primary"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Imagem
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAddElement('VIDEO')}
            className="h-7 text-xs gap-1.5 px-2.5 rounded-lg hover:bg-primary/10 hover:text-primary"
          >
            <Film className="h-3.5 w-3.5" />
            Vídeo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAddElement('CARD')}
            className="h-7 text-xs gap-1.5 px-2.5 rounded-lg hover:bg-primary/10 hover:text-primary"
          >
            <Layers className="h-3.5 w-3.5" />
            Card
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAddElement('QR_CODE')}
            className="h-7 text-xs gap-1.5 px-2.5 rounded-lg hover:bg-primary/10 hover:text-primary"
          >
            <QrCode className="h-3.5 w-3.5" />
            QR Code
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAddElement('FORM')}
            className="h-7 text-xs gap-1.5 px-2.5 rounded-lg hover:bg-primary/10 hover:text-primary"
          >
            <FileText className="h-3.5 w-3.5" />
            Formulário LGPD
          </Button>
        </div>

        {/* Área Central: Timeline Esquerda + Canvas Central + Painel de Propriedades Direita */}
        <div className="flex-1 flex gap-3 overflow-hidden">
          {/* Lado Esquerdo: Slides Timeline */}
          <div className="w-56 bg-card border border-border rounded-2xl p-3 flex flex-col justify-between shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-bold text-foreground">Slides ({slides.length})</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddSlide}
                className="h-6 w-6 p-0 text-primary hover:bg-primary/10 rounded-md"
                title="Novo Slide"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
              {slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  onClick={() => {
                    setActiveSlideIndex(idx);
                    setSelectedElementId(null);
                  }}
                  className={`group p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    idx === activeSlideIndex
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border/60 bg-muted/20 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground truncate max-w-[130px]">
                      {idx + 1}. {slide.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {slide.durationMs ? `${slide.durationMs / 1000}s` : 'Toque'}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {slide.elements?.length || 0} elemento(s)
                    </span>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleMoveSlide(idx, 'UP'); }}
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                        title="Subir"
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleMoveSlide(idx, 'DOWN'); }}
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                        title="Descer"
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDuplicateSlide(idx); }}
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                        title="Duplicar"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDeleteSlide(idx); }}
                        className="h-5 w-5 p-0 text-red-500 hover:text-red-600"
                        title="Excluir Slide"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddSlide}
              className="w-full gap-1.5 rounded-xl border-dashed border-border text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar Slide
            </Button>
          </div>

          {/* Centro: Stage / Canvas do Slide */}
          <div className="flex-1 bg-zinc-950/60 border border-border/80 rounded-2xl flex items-center justify-center p-4 overflow-hidden relative">
            <div 
              className={`relative overflow-hidden shadow-2xl transition-all duration-300 border border-zinc-800 bg-slate-900 ${
                orientation === 'LANDSCAPE' 
                  ? 'w-full max-w-[850px] aspect-video rounded-xl' 
                  : 'h-full max-h-[580px] aspect-[9/16] rounded-2xl'
              }`}
              onClick={() => setSelectedElementId(null)}
            >
              {/* Plano de Fundo do Slide */}
              {currentSlide?.backgroundType === 'IMAGE' && currentSlide.backgroundMediaId && (
                <img 
                  src={`/api/kiosk-media/${currentSlide.backgroundMediaId}/content`} 
                  alt="Background" 
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              )}
              {currentSlide?.backgroundType === 'VIDEO' && currentSlide.backgroundMediaId && (
                <video 
                  src={`/api/kiosk-media/${currentSlide.backgroundMediaId}/content`} 
                  autoPlay 
                  loop 
                  muted 
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
              )}

              {/* Elementos na Tela */}
              {currentSlide?.elements?.map((el) => {
                const isSelected = el.id === selectedElementId;
                return (
                  <div
                    key={el.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElementId(el.id);
                    }}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.width}%`,
                      height: `${el.height}%`,
                      zIndex: el.zIndex,
                    }}
                    className={`absolute flex items-center justify-center p-2 cursor-pointer transition-all select-none ${
                      isSelected 
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-black rounded-lg shadow-lg' 
                        : 'hover:ring-1 hover:ring-white/40 rounded-lg'
                    }`}
                  >
                    {/* Renderização pelo Tipo */}
                    {el.elementType === 'TEXT' && (
                      <div 
                        style={{
                          fontSize: `${el.content?.fontSize || 24}px`,
                          color: el.content?.color || '#ffffff',
                          fontWeight: el.content?.fontWeight || 'bold',
                        }}
                        className="text-center w-full leading-tight drop-shadow"
                      >
                        {el.content?.text || 'Texto'}
                      </div>
                    )}

                    {el.elementType === 'BUTTON' && (
                      <button
                        type="button"
                        style={{
                          backgroundColor: el.content?.bgColor || '#3b82f6',
                          color: el.content?.textColor || '#ffffff',
                        }}
                        className="w-full h-full px-4 py-2 font-bold rounded-xl shadow-md flex items-center justify-center text-sm pointer-events-none"
                      >
                        {el.content?.label || 'Botão'}
                      </button>
                    )}

                    {el.elementType === 'IMAGE' && (
                      el.content?.mediaId ? (
                        <img 
                          src={`/api/kiosk-media/${el.content.mediaId}/content`} 
                          alt="Elemento" 
                          className="w-full h-full object-contain pointer-events-none"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-800/80 border border-zinc-700 flex flex-col items-center justify-center text-zinc-400 rounded-xl">
                          <ImageIcon className="h-6 w-6 mb-1" />
                          <span className="text-[10px]">Escolher Imagem</span>
                        </div>
                      )
                    )}

                    {el.elementType === 'VIDEO' && (
                      el.content?.mediaId ? (
                        <video 
                          src={`/api/kiosk-media/${el.content.mediaId}/content`} 
                          autoPlay 
                          loop 
                          muted 
                          className="w-full h-full object-cover rounded-xl pointer-events-none"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-800/80 border border-zinc-700 flex flex-col items-center justify-center text-zinc-400 rounded-xl">
                          <Film className="h-6 w-6 mb-1" />
                          <span className="text-[10px]">Escolher Vídeo</span>
                        </div>
                      )
                    )}

                    {el.elementType === 'CARD' && (
                      <div className="w-full h-full bg-slate-900/90 border border-slate-700/80 p-3 rounded-2xl flex flex-col justify-center text-left text-white shadow-lg">
                        <p className="text-xs font-bold">{el.content?.title || 'Título do Card'}</p>
                        <p className="text-[10px] text-zinc-300 mt-0.5 line-clamp-2">
                          {el.content?.description || 'Descrição do card'}
                        </p>
                      </div>
                    )}

                    {el.elementType === 'QR_CODE' && (
                      <div className="w-full h-full bg-white p-2 rounded-2xl flex flex-col items-center justify-center text-slate-950 shadow-md">
                        <QrCode className="w-16 h-16 text-slate-950" />
                        <span className="text-[9px] font-bold mt-1 text-center">
                          {el.content?.label || 'Escaneie'}
                        </span>
                      </div>
                    )}

                    {el.elementType === 'FORM' && (
                      <div className="w-full h-full bg-slate-900/95 border border-slate-700 p-3 rounded-2xl flex flex-col justify-between text-white text-xs">
                        <p className="font-bold text-center text-primary">{el.content?.formTitle || 'Formulário'}</p>
                        <div className="space-y-1.5 my-1">
                          <div className="h-5 bg-slate-800 rounded px-2 text-[9px] flex items-center text-zinc-400">Nome Completo</div>
                          <div className="h-5 bg-slate-800 rounded px-2 text-[9px] flex items-center text-zinc-400">CPF / Matrícula</div>
                        </div>
                        <p className="text-[8px] text-zinc-400 text-center">🔒 Em conformidade com a LGPD</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lado Direito: Inspetor de Propriedades */}
          <div className="w-72 bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
            {selectedElement ? (
              /* Propriedades do Elemento Selecionado */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MousePointer className="h-3.5 w-3.5 text-primary" />
                    Propriedades do Elemento
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteElement(selectedElement.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-600 rounded-md"
                    title="Remover Elemento"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground">Tipo de Elemento</label>
                    <p className="font-bold text-foreground mt-0.5">{selectedElement.elementType}</p>
                  </div>

                  {/* Configurações específicas por tipo */}
                  {selectedElement.elementType === 'TEXT' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Texto</label>
                        <Input
                          value={selectedElement.content?.text || ''}
                          onChange={(e) => updateSelectedElement({
                            content: { ...selectedElement.content, text: e.target.value }
                          })}
                          className="h-8 text-xs bg-background"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">Tamanho (px)</label>
                          <Input
                            type="number"
                            value={selectedElement.content?.fontSize || 24}
                            onChange={(e) => updateSelectedElement({
                              content: { ...selectedElement.content, fontSize: parseInt(e.target.value) || 24 }
                            })}
                            className="h-8 text-xs bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">Cor</label>
                          <Input
                            type="color"
                            value={selectedElement.content?.color || '#ffffff'}
                            onChange={(e) => updateSelectedElement({
                              content: { ...selectedElement.content, color: e.target.value }
                            })}
                            className="h-8 p-1 bg-background"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedElement.elementType === 'BUTTON' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Texto do Botão</label>
                        <Input
                          value={selectedElement.content?.label || ''}
                          onChange={(e) => updateSelectedElement({
                            content: { ...selectedElement.content, label: e.target.value }
                          })}
                          className="h-8 text-xs bg-background"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">Cor de Fundo</label>
                          <Input
                            type="color"
                            value={selectedElement.content?.bgColor || '#3b82f6'}
                            onChange={(e) => updateSelectedElement({
                              content: { ...selectedElement.content, bgColor: e.target.value }
                            })}
                            className="h-8 p-1 bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">Cor do Texto</label>
                          <Input
                            type="color"
                            value={selectedElement.content?.textColor || '#ffffff'}
                            onChange={(e) => updateSelectedElement({
                              content: { ...selectedElement.content, textColor: e.target.value }
                            })}
                            className="h-8 p-1 bg-background"
                          />
                        </div>
                      </div>

                      {/* Ação ao tocar no botão */}
                      <div className="space-y-1 pt-2 border-t border-border/60">
                        <label className="text-[11px] font-semibold text-foreground">Ação ao Tocar na Tela</label>
                        <select
                          aria-label="Ação ao tocar"
                          value={selectedElement.action?.type || 'NONE'}
                          onChange={(e) => updateSelectedElement({
                            action: { ...selectedElement.action, type: e.target.value }
                          })}
                          className="w-full px-2 py-1.5 text-xs rounded-lg bg-background border border-border"
                        >
                          <option value="NONE">Nenhuma ação</option>
                          <option value="GO_TO_SLIDE">Ir para Outro Slide</option>
                          <option value="OPEN_URL">Abrir Link Externo</option>
                        </select>
                      </div>

                      {selectedElement.action?.type === 'GO_TO_SLIDE' && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground">Slide de Destino</label>
                          <select
                            aria-label="Slide de destino"
                            value={selectedElement.action?.targetSlideIndex ?? 0}
                            onChange={(e) => updateSelectedElement({
                              action: { ...selectedElement.action, targetSlideIndex: parseInt(e.target.value) }
                            })}
                            className="w-full px-2 py-1.5 text-xs rounded-lg bg-background border border-border"
                          >
                            {slides.map((s, i) => (
                              <option key={s.id} value={i}>
                                {i + 1}. {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}

                  {(selectedElement.elementType === 'IMAGE' || selectedElement.elementType === 'VIDEO') && (
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenMediaPicker('ELEMENT')}
                        className="w-full text-xs gap-1.5 rounded-xl border-border"
                      >
                        <Film className="h-3.5 w-3.5" />
                        Escolher da Biblioteca
                      </Button>
                    </div>
                  )}

                  {/* Posição e Dimensões (X, Y, W, H em %) */}
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <label className="text-[11px] font-semibold text-muted-foreground">Posicionamento (%)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground">Posição X:</span>
                        <Input
                          type="number"
                          value={Math.round(selectedElement.x)}
                          onChange={(e) => updateSelectedElement({ x: parseFloat(e.target.value) || 0 })}
                          className="h-7 text-xs bg-background"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">Posição Y:</span>
                        <Input
                          type="number"
                          value={Math.round(selectedElement.y)}
                          onChange={(e) => updateSelectedElement({ y: parseFloat(e.target.value) || 0 })}
                          className="h-7 text-xs bg-background"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">Largura:</span>
                        <Input
                          type="number"
                          value={Math.round(selectedElement.width)}
                          onChange={(e) => updateSelectedElement({ width: parseFloat(e.target.value) || 20 })}
                          className="h-7 text-xs bg-background"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">Altura:</span>
                        <Input
                          type="number"
                          value={Math.round(selectedElement.height)}
                          onChange={(e) => updateSelectedElement({ height: parseFloat(e.target.value) || 10 })}
                          className="h-7 text-xs bg-background"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Propriedades do Slide Atual */
              <div className="space-y-4">
                <div className="pb-2 border-b border-border/60">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Settings className="h-3.5 w-3.5 text-primary" />
                    Propriedades do Slide
                  </span>
                </div>

                {currentSlide && (
                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Nome do Slide</label>
                      <Input
                        value={currentSlide.name}
                        onChange={(e) => updateCurrentSlide({ name: e.target.value })}
                        className="h-8 text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                        <span>Tempo de Exibição (s)</span>
                        <span className="text-[10px] text-muted-foreground">0 = Apenas por toque</span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="300"
                        value={currentSlide.durationMs ? currentSlide.durationMs / 1000 : 0}
                        onChange={(e) => updateCurrentSlide({
                          durationMs: (parseInt(e.target.value) || 0) * 1000
                        })}
                        className="h-8 text-xs bg-background"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Transição</label>
                      <select
                        aria-label="Tipo de transição"
                        value={currentSlide.transitionType}
                        onChange={(e) => updateCurrentSlide({ transitionType: e.target.value as any })}
                        className="w-full px-2 py-1.5 text-xs rounded-lg bg-background border border-border"
                      >
                        <option value="FADE">Fade (Dissolver)</option>
                        <option value="SLIDE_LEFT">Deslizar para Esquerda</option>
                        <option value="SLIDE_RIGHT">Deslizar para Direita</option>
                        <option value="ZOOM">Zoom</option>
                        <option value="NONE">Nenhuma (Corte Seco)</option>
                      </select>
                    </div>

                    {/* Plano de Fundo */}
                    <div className="space-y-1.5 pt-2 border-t border-border/60">
                      <label className="text-[11px] font-semibold text-foreground">Plano de Fundo</label>
                      <select
                        aria-label="Tipo de plano de fundo"
                        value={currentSlide.backgroundType}
                        onChange={(e) => updateCurrentSlide({ backgroundType: e.target.value as any })}
                        className="w-full px-2 py-1.5 text-xs rounded-lg bg-background border border-border mb-2"
                      >
                        <option value="COLOR">Cor Padrão</option>
                        <option value="IMAGE">Imagem da Biblioteca</option>
                        <option value="VIDEO">Vídeo em Loop</option>
                      </select>

                      {currentSlide.backgroundType !== 'COLOR' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenMediaPicker('BACKGROUND')}
                          className="w-full text-xs gap-1.5 rounded-xl border-border"
                        >
                          <Film className="h-3.5 w-3.5" />
                          {currentSlide.backgroundMediaId ? 'Trocar Mídia de Fundo' : 'Selecionar Mídia'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Seletor de Mídias da Biblioteca */}
      <Dialog open={isMediaPickerOpen} onOpenChange={setIsMediaPickerOpen}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="h-5 w-5 text-primary" />
              Biblioteca de Mídias
            </DialogTitle>
            <DialogDescription>
              Selecione o arquivo que deseja inserir neste elemento ou no fundo do slide.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
            {mediaList.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-xs text-muted-foreground">
                Nenhum arquivo na biblioteca. Envie mídias na aba "Biblioteca de Mídias".
              </div>
            ) : (
              mediaList.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => handleSelectMedia(asset)}
                  className="group relative aspect-video bg-muted/60 border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary transition-all flex flex-col justify-between"
                >
                  {asset.mediaType === 'IMAGE' ? (
                    <img 
                      src={`/api/kiosk-media/${asset.id}/thumbnail`} 
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-cyan-400">
                      <Film className="h-8 w-8" />
                      <span className="text-[10px] text-zinc-300 mt-1">Vídeo</span>
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1.5 text-[10px] text-white truncate">
                    {asset.name}
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMediaPickerOpen(false)} className="rounded-xl">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Simulador Interativo do Totem (Fullscreen Player Preview) */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl h-[85vh] bg-black border-zinc-800 p-0 flex flex-col overflow-hidden">
          {/* Header do Player */}
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-950/90 border-b border-zinc-800 text-white z-50">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold">Simulação em Tempo Real do Totem</span>
              <span className="text-[11px] text-zinc-400">
                • Slide {previewSlideIndex + 1} de {slides.length} ({slides[previewSlideIndex]?.name})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewOpen(false)}
              className="h-7 w-7 p-0 text-zinc-400 hover:text-white rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Canvas do Player Preview */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black select-none">
            {slides[previewSlideIndex] && (
              <div 
                className={`relative overflow-hidden w-full h-full flex items-center justify-center ${
                  orientation === 'LANDSCAPE' ? 'aspect-video' : 'aspect-[9/16]'
                }`}
              >
                {/* Background */}
                {slides[previewSlideIndex].backgroundType === 'IMAGE' && slides[previewSlideIndex].backgroundMediaId && (
                  <img 
                    src={`/api/kiosk-media/${slides[previewSlideIndex].backgroundMediaId}/content`} 
                    alt="Background" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                {slides[previewSlideIndex].backgroundType === 'VIDEO' && slides[previewSlideIndex].backgroundMediaId && (
                  <video 
                    src={`/api/kiosk-media/${slides[previewSlideIndex].backgroundMediaId}/content`} 
                    autoPlay 
                    loop 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {/* Elementos Interativos */}
                {slides[previewSlideIndex].elements?.map((el) => (
                  <div
                    key={el.id}
                    onClick={() => handlePreviewElementAction(el.action)}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.width}%`,
                      height: `${el.height}%`,
                      zIndex: el.zIndex,
                    }}
                    className={`absolute flex items-center justify-center p-2 ${
                      el.action?.type && el.action.type !== 'NONE' ? 'cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform' : ''
                    }`}
                  >
                    {el.elementType === 'TEXT' && (
                      <div 
                        style={{
                          fontSize: `${el.content?.fontSize || 24}px`,
                          color: el.content?.color || '#ffffff',
                          fontWeight: el.content?.fontWeight || 'bold',
                        }}
                        className="text-center w-full leading-tight drop-shadow"
                      >
                        {el.content?.text}
                      </div>
                    )}

                    {el.elementType === 'BUTTON' && (
                      <button
                        type="button"
                        style={{
                          backgroundColor: el.content?.bgColor || '#3b82f6',
                          color: el.content?.textColor || '#ffffff',
                        }}
                        className="w-full h-full px-4 py-2 font-bold rounded-xl shadow-lg flex items-center justify-center text-sm"
                      >
                        {el.content?.label}
                      </button>
                    )}

                    {el.elementType === 'IMAGE' && el.content?.mediaId && (
                      <img 
                        src={`/api/kiosk-media/${el.content.mediaId}/content`} 
                        alt="Elemento" 
                        className="w-full h-full object-contain"
                      />
                    )}

                    {el.elementType === 'VIDEO' && el.content?.mediaId && (
                      <video 
                        src={`/api/kiosk-media/${el.content.mediaId}/content`} 
                        autoPlay 
                        loop 
                        muted 
                        className="w-full h-full object-cover rounded-xl"
                      />
                    )}

                    {el.elementType === 'CARD' && (
                      <div className="w-full h-full bg-slate-900/90 border border-slate-700/80 p-3 rounded-2xl flex flex-col justify-center text-left text-white shadow-lg">
                        <p className="text-xs font-bold">{el.content?.title}</p>
                        <p className="text-[10px] text-zinc-300 mt-0.5 line-clamp-2">
                          {el.content?.description}
                        </p>
                      </div>
                    )}

                    {el.elementType === 'QR_CODE' && (
                      <div className="w-full h-full bg-white p-2 rounded-2xl flex flex-col items-center justify-center text-slate-950 shadow-md">
                        <QrCode className="w-16 h-16 text-slate-950" />
                        <span className="text-[9px] font-bold mt-1 text-center">
                          {el.content?.label}
                        </span>
                      </div>
                    )}

                    {el.elementType === 'FORM' && (
                      <div className="w-full h-full bg-slate-900/95 border border-slate-700 p-4 rounded-2xl flex flex-col justify-between text-white text-xs">
                        <p className="font-bold text-center text-primary text-sm">{el.content?.formTitle}</p>
                        <div className="space-y-2 my-2">
                          <input type="text" placeholder="Nome Completo" className="w-full bg-slate-800 rounded px-2.5 py-1 text-xs text-white border border-slate-700" />
                          <input type="text" placeholder="CPF / Matrícula" className="w-full bg-slate-800 rounded px-2.5 py-1 text-xs text-white border border-slate-700" />
                        </div>
                        <p className="text-[9px] text-zinc-400 text-center">🔒 Em conformidade com a LGPD</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </StandardLayout>
  );
};

export default TotensEditorPage;
