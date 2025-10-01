import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Camera, Type } from 'lucide-react';

interface QrCodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (qrCode: string) => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({
  open,
  onOpenChange,
  onScan
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scannerActive, setScannerActive] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  const startScanner = () => {
    // Aqui você implementaria a integração com uma biblioteca de QR Code
    // Por exemplo: react-qr-scanner, @zxing/library, etc.
    setScannerActive(true);
    
    // Simulação para demonstração
    setTimeout(() => {
      setScannerActive(false);
      // Simular leitura de QR Code
      onScan('STOCK-12345678');
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scanner QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scanner de Câmera */}
          <div className="text-center">
            <div className="mb-4">
              <div className="w-48 h-48 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
                {scannerActive ? (
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400 animate-pulse" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Escaneando...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <QrCode className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Clique para ativar a câmera
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              onClick={startScanner} 
              disabled={scannerActive}
              className="w-full bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <Camera className="h-4 w-4 mr-2" />
              {scannerActive ? 'Escaneando...' : 'Ativar Câmera'}
            </Button>
          </div>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">ou</span>
            </div>
          </div>

          {/* Entrada Manual */}
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manualCode" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Digite o código manualmente
              </Label>
              <Input
                id="manualCode"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ex: STOCK-12345678"
                className="font-mono"
              />
            </div>
            
            <Button 
              type="submit" 
              variant="outline" 
              className="w-full"
              disabled={!manualCode.trim()}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Buscar Item
            </Button>
          </form>

          {/* Instruções */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Posicione o QR Code dentro da área de escaneamento</p>
            <p>• Certifique-se de que há boa iluminação</p>
            <p>• Ou digite o código manualmente se preferir</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrCodeScanner;