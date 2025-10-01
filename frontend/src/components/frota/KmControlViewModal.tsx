import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { KmControl } from '@/types/fleet';
import { ImageViewerModal } from '@/components/ImageViewerModal';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Fuel, 
  DollarSign, 
  Calculator,
  User,
  Car,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface KmControlViewModalProps {
  kmControl: KmControl | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (kmControl: KmControl) => void;
  onDelete: (kmControl: KmControl) => void;
}

const KmControlViewModal: React.FC<KmControlViewModalProps> = ({
  kmControl,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!kmControl) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '-';
    
    try {
      // Se já estiver no formato HH:mm, retorna como está
      if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
      }
      
      // Se for um timestamp ou outro formato, converte
      const date = new Date(`2000-01-01T${timeString}`);
      if (isNaN(date.getTime())) {
        return timeString; // Retorna original se não conseguir converter
      }
      
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.warn('Erro ao formatar horário:', timeString, error);
      return timeString;
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatKm = (km: number | null | undefined) => {
    console.log('🔍 formatKm chamado com:', km, 'tipo:', typeof km);
    if (km === null || km === undefined || km === 0) {
      console.log('  -> Retornando "Não informado"');
      return 'Não informado';
    }
    const formatted = km.toLocaleString('pt-BR') + ' km';
    console.log('  -> Retornando:', formatted);
    return formatted;
  };

  // Log para debug dos dados recebidos
  useEffect(() => {
    console.log('🔍 KmControlViewModal - Dados recebidos:');
    console.log('  KM Inicial:', kmControl.initialKm, 'tipo:', typeof kmControl.initialKm);
    console.log('  KM Final:', kmControl.finalKm, 'tipo:', typeof kmControl.finalKm);
    console.log('  KM Total:', kmControl.totalKm, 'tipo:', typeof kmControl.totalKm);
    console.log('  Justificativa Inicial:', kmControl.initialKmJustification);
    console.log('  Justificativa Final:', kmControl.finalKmJustification);
    console.log('  Dados completos:', kmControl);
  }, [kmControl]);

  const getFuelTypeLabel = (fuelType: string) => {
    const labels = {
      'GASOLINE': 'Gasolina',
      'ETHANOL': 'Etanol',
      'DIESEL': 'Diesel',
      'FLEX': 'Flex'
    };
    return labels[fuelType as keyof typeof labels] || fuelType;
  };

  const buildAbsoluteUrl = (raw: string | undefined | null): string | null => {
    if (!raw) return null;
    let href = raw.trim();
    if (!/^https?:\/\//.test(href)) {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      // Se vier apenas um identificador sem extensão ou barra, usar endpoint de download
      const isBareId = !href.includes('/') && !href.includes('.');
      if (isBareId) {
        href = `${apiBase}/api/frota/km-controls/${kmControl.id}/dashboard-photo`;
      } else {
        if (!href.startsWith('/')) {
          href = `/${href}`;
        }
        href = `${apiBase}${href}`;
      }
    }
    return href;
  };

  const gallery = useMemo(() => {
    const items: { src: string; alt: string }[] = [];
    const main = buildAbsoluteUrl(kmControl.dashboardPhotoUrl);
    if (main) items.push({ src: main, alt: kmControl.dashboardPhotoDescription || 'Foto do painel' });
    // Futuro: se backend suportar múltiplas fotos, adicionar aqui
    return items;
  }, [kmControl.dashboardPhotoUrl, kmControl.dashboardPhotoDescription]);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  const openViewer = (src: string) => {
    setViewerSrc(src);
    setViewerOpen(true);
  };

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8081';
  const buildCandidates = (raw: string): string[] => {
    const cands: string[] = [];
    if (/^https?:\/\//.test(raw)) return [raw];
    const bare = raw && !raw.includes('/') && !raw.includes('.');
    if (bare) {
      cands.push(`${apiBase}/api/frota/km-controls/${kmControl.id}/dashboard-photo`);
      cands.push(`${apiBase}/uploads/${raw}`);
      cands.push(`${apiBase}/uploads/${raw}.jpg`);
      cands.push(`${apiBase}/uploads/${raw}.png`);
      cands.push(`${apiBase}/files/${raw}`);
      cands.push(`${apiBase}/files/${raw}.jpg`);
      cands.push(`${apiBase}/files/${raw}.png`);
    } else {
      const rel = raw.startsWith('/') ? raw : `/${raw}`;
      cands.push(`${apiBase}${rel}`);
    }
    return cands;
  };

  const ImageWithFallback: React.FC<{ raw: string; alt: string; className?: string }> = ({ raw, alt, className }) => {
    const [index, setIndex] = useState(0);
    const candidates = useMemo(() => buildCandidates(raw), [raw]);
    const src = candidates[index];
    if (!src) return null;
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onClick={() => openViewer(src)}
        onError={() => setIndex((i) => (i + 1 < candidates.length ? i + 1 : i))}
      />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Detalhes do Controle de Quilometragem
          </DialogTitle>
          <DialogDescription className="sr-only">Visualização completa do registro de quilometragem, incluindo dados e foto do painel.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais */}
          <Card className="bg-seguranca-black border-gray-600">
            <CardHeader className="pb-4">
              <CardTitle className="text-seguranca-lightgray text-lg flex items-center gap-2">
                <div className="p-2 bg-seguranca-yellow/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-seguranca-yellow" />
                </div>
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4 p-3 bg-seguranca-graphite rounded-lg border border-gray-600">
                  <div className="p-2 bg-seguranca-yellow/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-seguranca-yellow" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-medium">Data</p>
                    <p className="text-seguranca-lightgray font-semibold text-lg">
                      {formatDate(kmControl.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-3 bg-seguranca-graphite rounded-lg border border-gray-600">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-medium">Supervisor</p>
                    <p className="text-seguranca-lightgray font-semibold text-lg">
                      {kmControl.supervisor}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-3 bg-seguranca-graphite rounded-lg border border-gray-600">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Car className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-medium">Veículo</p>
                    <p className="text-seguranca-lightgray font-semibold text-lg">
                      {kmControl.vehiclePlate || 'Não atribuído'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-3 bg-seguranca-graphite rounded-lg border border-gray-600">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Fuel className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 font-medium">Combustível</p>
                    <p className="text-seguranca-lightgray font-semibold text-lg">
                      {getFuelTypeLabel(kmControl.fuelType)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controle de Quilometragem */}
          <Card className="bg-seguranca-black border-gray-600">
            <CardHeader className="pb-4">
              <CardTitle className="text-seguranca-lightgray text-lg flex items-center gap-2">
                <div className="p-2 bg-seguranca-yellow/20 rounded-lg">
                  <Calculator className="h-5 w-5 text-seguranca-yellow" />
                </div>
                Controle de Quilometragem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-6 bg-seguranca-graphite rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-colors">
                  <div className="p-3 bg-blue-500/20 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-400 mb-2 font-medium">KM Inicial</p>
                  <p className="text-2xl font-bold text-seguranca-lightgray font-mono">
                    {formatKm(kmControl.initialKm)}
                  </p>
                  {kmControl.initialKmJustification && (
                    <div className="mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
                      <p className="text-xs text-yellow-400 font-medium">Justificativa:</p>
                      <p className="text-xs text-yellow-300">{kmControl.initialKmJustification}</p>
                    </div>
                  )}
                  {kmControl.initialKm === 0 && !kmControl.initialKmJustification && (
                    <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/30">
                      <p className="text-xs text-red-400 font-medium">⚠️ KM inicial = 0 sem justificativa</p>
                    </div>
                  )}
                </div>

                <div className="text-center p-6 bg-seguranca-graphite rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-colors">
                  <div className="p-3 bg-green-500/20 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-400 mb-2 font-medium">KM Final</p>
                  <p className="text-2xl font-bold text-seguranca-lightgray font-mono">
                    {formatKm(kmControl.finalKm)}
                  </p>
                  {kmControl.finalKmJustification && (
                    <div className="mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
                      <p className="text-xs text-yellow-400 font-medium">Justificativa:</p>
                      <p className="text-xs text-yellow-300">{kmControl.finalKmJustification}</p>
                    </div>
                  )}
                  {kmControl.finalKm === 0 && !kmControl.finalKmJustification && (
                    <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/30">
                      <p className="text-xs text-red-400 font-medium">⚠️ KM final = 0 sem justificativa</p>
                    </div>
                  )}
                </div>

                <div className="text-center p-6 bg-seguranca-yellow/20 rounded-lg border border-seguranca-yellow/50 hover:bg-seguranca-yellow/30 transition-colors">
                  <div className="p-3 bg-seguranca-yellow/30 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Calculator className="h-6 w-6 text-seguranca-yellow" />
                  </div>
                  <p className="text-sm text-seguranca-yellow mb-2 font-medium">KM Total do Dia</p>
                  <p className="text-2xl font-bold text-seguranca-yellow font-mono">
                    {formatKm(kmControl.totalKm)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horários e Valor */}
          <Card className="bg-seguranca-black border-gray-600">
            <CardHeader className="pb-4">
              <CardTitle className="text-seguranca-lightgray text-lg flex items-center gap-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                Horários e Valor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-seguranca-graphite rounded-lg border border-gray-600">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 font-medium">Início do Turno</p>
                      <p className="text-seguranca-lightgray font-semibold text-lg font-mono">
                        {formatTime(kmControl.shiftStart)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-seguranca-graphite rounded-lg border border-gray-600">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <Clock className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 font-medium">Fim do Turno</p>
                      <p className="text-seguranca-lightgray font-semibold text-lg font-mono">
                        {formatTime(kmControl.shiftEnd)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-seguranca-graphite rounded-lg border border-gray-600">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 font-medium">Valor</p>
                      <p className="text-seguranca-lightgray font-semibold text-2xl text-green-400">
                        {formatCurrency(kmControl.value)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-seguranca-graphite rounded-lg border border-gray-600">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <MapPin className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 font-medium">Posto de Trabalho</p>
                      <p className="text-seguranca-lightgray font-semibold text-lg">
                        {kmControl.workPost}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Descrições */}
          {(kmControl.problemDescription || kmControl.workPostPerformance || kmControl.observations) && (
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader className="pb-4">
                <CardTitle className="text-seguranca-lightgray text-lg flex items-center gap-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-blue-500" />
                  </div>
                  Observações e Rendimentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {kmControl.observations && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-400">Observações Gerais</p>
                    </div>
                    <div className="p-4 bg-seguranca-graphite rounded-lg border border-gray-600">
                      <p className="text-seguranca-lightgray leading-relaxed">
                        {kmControl.observations}
                      </p>
                    </div>
                  </div>
                )}

                {kmControl.problemDescription && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-400">Descrição de Problemas</p>
                    </div>
                    <div className="p-4 bg-seguranca-graphite rounded-lg border border-gray-600">
                      <p className="text-seguranca-lightgray leading-relaxed">
                        {kmControl.problemDescription}
                      </p>
                    </div>
                  </div>
                )}

                {kmControl.workPostPerformance && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-400">Rendimentos do Posto</p>
                    </div>
                    <div className="p-4 bg-seguranca-graphite rounded-lg border border-gray-600">
                      <p className="text-seguranca-lightgray leading-relaxed">
                        {kmControl.workPostPerformance}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Foto do Painel */}
          {gallery.length > 0 && (
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader className="pb-4">
                <CardTitle className="text-seguranca-lightgray text-lg flex items-center gap-2">
                  <div className="p-2 bg-seguranca-yellow/20 rounded-lg">
                    <Car className="h-5 w-5 text-seguranca-yellow" />
                  </div>
                  Foto do Painel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {gallery.map((img, idx) => (
                    <div
                      key={idx}
                      className="block w-full aspect-video bg-seguranca-graphite rounded border border-gray-600 overflow-hidden hover:ring-2 hover:ring-seguranca-yellow cursor-pointer"
                    >
                      <ImageWithFallback raw={kmControl.dashboardPhotoUrl || ''} alt={img.alt} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                {kmControl.dashboardPhotoDescription && (
                  <p className="text-sm text-gray-400">{kmControl.dashboardPhotoDescription}</p>
                )}
                <div className="flex gap-2 justify-end">
                  {(() => {
                    const href = gallery[0]?.src;
                    if (!href) return null;
                    return (
                      <>
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center px-3 py-2 text-sm rounded border border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          Abrir em nova guia
                        </a>
                        <a
                          href={href}
                          download
                          className="inline-flex items-center px-3 py-2 text-sm rounded border border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          Baixar
                        </a>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          <ImageViewerModal isOpen={viewerOpen} onClose={() => setViewerOpen(false)} imageUrl={viewerSrc} />

          {/* Informações de Sistema */}
          <Card className="bg-seguranca-black border-gray-600">
            <CardHeader className="pb-4">
              <CardTitle className="text-seguranca-lightgray text-lg flex items-center gap-2">
                <div className="p-2 bg-gray-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-gray-500" />
                </div>
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-seguranca-graphite rounded-lg border border-gray-600">
                  <p className="text-gray-400 text-sm font-medium mb-1">Criado em:</p>
                  <p className="text-seguranca-lightgray font-mono">
                    {new Date(kmControl.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-3 bg-seguranca-graphite rounded-lg border border-gray-600">
                  <p className="text-gray-400 text-sm font-medium mb-1">Atualizado em:</p>
                  <p className="text-seguranca-lightgray font-mono">
                    {new Date(kmControl.updatedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-600">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-400 hover:bg-gray-700 h-11 px-6"
            >
              Fechar
            </Button>
            <Button
              onClick={() => onEdit(kmControl)}
              className="bg-green-600 hover:bg-green-700 h-11 px-6"
            >
              Editar
            </Button>
            <Button
              onClick={() => onDelete(kmControl)}
              variant="destructive"
              className="h-11 px-6"
            >
              Excluir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KmControlViewModal;
