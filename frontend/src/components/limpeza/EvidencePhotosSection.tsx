import React, { useState } from 'react';
import { Camera, Image as ImageIcon, CheckCircle2, Loader2, X, ZoomIn } from 'lucide-react';
import { VehicleCleaningOrder, vehicleCleaningService } from '@/services/vehicleCleaningService';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface EvidencePhotosSectionProps {
  order: VehicleCleaningOrder;
  onOrderUpdated: (updatedOrder: VehicleCleaningOrder) => void;
}

interface PhotoSlot {
  key: string;
  category: string;
  title: string;
  typeLabel: string;
  timingLabel: string;
  url?: string;
  iconColor: string;
  borderColor: string;
}

export const EvidencePhotosSection: React.FC<EvidencePhotosSectionProps> = ({
  order,
  onOrderUpdated,
}) => {
  const { toast } = useToast();
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  const slots: PhotoSlot[] = [
    {
      key: 'before_internal',
      category: 'before_internal',
      title: 'Antes — Limpeza Interna',
      typeLabel: 'Interno',
      timingLabel: 'Antes',
      url: order.photoBeforeInternal,
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/30',
    },
    {
      key: 'before_external',
      category: 'before_external',
      title: 'Antes — Lavagem Externa',
      typeLabel: 'Externo',
      timingLabel: 'Antes',
      url: order.photoBeforeExternal,
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/30',
    },
    {
      key: 'after_internal',
      category: 'after_internal',
      title: 'Depois — Limpeza Interna',
      typeLabel: 'Interno',
      timingLabel: 'Depois',
      url: order.photoAfterInternal,
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
    },
    {
      key: 'after_external',
      category: 'after_external',
      title: 'Depois — Lavagem Externa',
      typeLabel: 'Externo',
      timingLabel: 'Depois',
      url: order.photoAfterExternal,
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
    },
  ];

  const handleUpload = async (category: string, file: File) => {
    setUploadingCategory(category);
    try {
      const updated = await vehicleCleaningService.uploadEvidencePhoto(order.id, category, file);
      onOrderUpdated(updated);
      toast({ title: 'Foto Registrada', description: `Evidência ${category} salva com sucesso!` });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível enviar a foto de evidência.', variant: 'destructive' });
    } finally {
      setUploadingCategory(null);
    }
  };

  return (
    <div className="space-y-3 bg-seguranca-black/30 p-4 rounded-xl border border-gray-700/60">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-seguranca-yellow uppercase tracking-wide flex items-center gap-2">
          <Camera size={16} /> Fotos de Evidência (Antes e Depois — Interno & Externo)
        </h4>
        <span className="text-xs text-gray-400">
          {slots.filter(s => !!s.url).length}/4 Fotos Registradas
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {slots.map(slot => {
          const isUploading = uploadingCategory === slot.category;
          return (
            <div
              key={slot.key}
              className={`bg-seguranca-black/60 rounded-lg p-2.5 border ${slot.borderColor} flex flex-col justify-between relative overflow-hidden group`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-bold ${slot.iconColor} uppercase flex items-center gap-1`}>
                  {slot.timingLabel === 'Antes' ? '📸' : '✨'} {slot.title}
                </span>
                {slot.url && <CheckCircle2 size={13} className="text-emerald-400" />}
              </div>

              <div className="relative aspect-video w-full bg-seguranca-black rounded-md overflow-hidden border border-gray-800 flex items-center justify-center">
                {slot.url ? (
                  <>
                    <img
                      src={slot.url}
                      alt={slot.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage({ url: slot.url!, title: slot.title })}
                        className="p-1.5 bg-black/70 text-white rounded-full hover:bg-black transition-colors"
                        title="Visualizar Foto Ampliada"
                      >
                        <ZoomIn size={14} />
                      </button>
                      <label
                        className="p-1.5 bg-sky-600/80 text-white rounded-full hover:bg-sky-600 transition-colors cursor-pointer"
                        title="Substituir Foto"
                      >
                        <Camera size={14} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploading}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(slot.category, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-2 text-center text-gray-500 hover:text-seguranca-yellow hover:bg-gray-800/40 transition-colors">
                    {isUploading ? (
                      <Loader2 size={20} className="animate-spin text-seguranca-yellow mb-1" />
                    ) : (
                      <Camera size={20} className="mb-1 opacity-70" />
                    )}
                    <span className="text-[10px] font-medium">
                      {isUploading ? 'Enviando...' : 'Clique para Anexar'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(slot.category, file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Zoom Preview */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-w-3xl p-3 flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-2 border-b border-gray-800">
            <span className="text-sm font-bold text-white">{previewImage?.title}</span>
            <button
              onClick={() => setPreviewImage(null)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X size={16} />
            </button>
          </div>
          {previewImage && (
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[75vh] w-auto object-contain rounded-lg mt-2 border border-gray-800 shadow-2xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
