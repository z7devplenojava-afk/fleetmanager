import React from 'react';
import { Dialog, DialogContent, DialogOverlay, DialogDescription } from '@/components/ui/dialog';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
}) => {
  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/80" />
      <DialogContent className="max-w-4xl p-0 border-none bg-transparent shadow-none">
        <DialogDescription className="sr-only">Visualização ampliada da imagem do painel.</DialogDescription>
        <div className="flex justify-center items-center h-full w-full">
          <img
            src={imageUrl}
            alt="Visualização da Imagem"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
