import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  QrCodeScanner, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Bus, 
  Clock, 
  MapPin, 
  Navigation,
  Camera,
  RefreshCw
} from 'lucide-react';
import corporateShuttleService from '@/services/corporateShuttleService';
import { QRCodeData, BoardingConfirmation } from '@/services/corporateShuttleService';

interface QRCodeScannerProps {
  onConfirmationSuccess?: (confirmation: BoardingConfirmation) => void;
  onConfirmationError?: (error: string) => void;
  driverMode?: boolean; // Se true, modo motorista; se false, modo auto-leitura
}

export default function QRCodeScanner({ 
  onConfirmationSuccess, 
  onConfirmationError,
  driverMode = false 
}: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState<QRCodeData | null>(null);
  const [confirmation, setConfirmation] = useState<BoardingConfirmation | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      
      setIsScanning(true);
      setError('');
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      setError('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanResult = async (qrData: string) => {
    try {
      setLoading(true);
      setError('');
      
      // Validar QR Code
      const validation = await corporateShuttleService.validateQRCode(qrData);
      
      if (!validation) {
        setError('QR Code inválido ou expirado');
        if (onConfirmationError) {
          onConfirmationError('QR Code inválido ou expirado');
        }
        return;
      }

      setScannedData(validation);

      // Obter posição atual (em produção, usar GPS real)
      const currentPosition = await getCurrentPosition();

      // Confirmar embarque
      const confirmation = await corporateShuttleService.confirmBoarding(validation, currentPosition);
      
      setConfirmation(confirmation);
      stopCamera();
      
      if (onConfirmationSuccess) {
        onConfirmationSuccess(confirmation);
      }
    } catch (error) {
      console.error('Erro ao processar QR Code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar QR Code';
      setError(errorMessage);
      if (onConfirmationError) {
        onConfirmationError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPosition = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        // Fallback para posição mock
        resolve({ latitude: -23.5505, longitude: -46.6333 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Erro ao obter posição:', error);
          // Fallback para posição mock
          resolve({ latitude: -23.5505, longitude: -46.6333 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) {
      setError('Digite o código do QR Code');
      return;
    }

    await handleScanResult(manualInput.trim());
  };

  const handleReset = () => {
    setScannedData(null);
    setConfirmation(null);
    setError('');
    setManualInput('');
    stopCamera();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <QrCodeScanner className="h-5 w-5" />
          {driverMode ? 'Leitor de QR Code - Motorista' : 'Leitor de QR Code - Embarque'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {driverMode 
            ? 'Escaneie o QR Code do funcionário para confirmar o embarque'
            : 'Escaneie seu QR Code para confirmar o embarque'
          }
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Confirmation */}
      {confirmation && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <h4 className="font-bold text-green-800">Embarque Confirmado!</h4>
                <p className="text-sm text-green-600">
                  {confirmation.employeeName} confirmado na rota {confirmation.routeName}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-800">Funcionário:</span>
                  <div>{confirmation.employeeName}</div>
                </div>
                <div>
                  <span className="font-medium text-green-800">Rota:</span>
                  <div>{confirmation.routeName}</div>
                </div>
                <div>
                  <span className="font-medium text-green-800">Veículo:</span>
                  <div>{confirmation.vehiclePlate}</div>
                </div>
                <div>
                  <span className="font-medium text-green-800">Horário:</span>
                  <div>{formatDateTime(confirmation.confirmedAt)}</div>
                </div>
              </div>

              <Button onClick={handleReset} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Nova Leitura
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanner Interface */}
      {!confirmation && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Camera View */}
              <div className="relative">
                {isScanning ? (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 object-cover rounded-lg bg-black"
                    />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-white rounded-lg">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Camera className="h-12 w-12 mx-auto mb-4" />
                      <p>Câmera desativada</p>
                      <p className="text-sm">Clique em "Iniciar Câmera" para começar</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex justify-center space-x-2">
                {!isScanning ? (
                  <Button onClick={startCamera} disabled={loading}>
                    <Camera className="h-4 w-4 mr-2" />
                    Iniciar Câmera
                  </Button>
                ) : (
                  <Button onClick={stopCamera} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Parar Câmera
                  </Button>
                )}
              </div>

              {/* Manual Input */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Entrada Manual do Código</h4>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Digite o código do QR Code"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    disabled={loading}
                  />
                  <Button 
                    onClick={handleManualSubmit} 
                    disabled={loading || !manualInput.trim()}
                  >
                    Validar
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <QrCodeScanner className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <h4 className="font-medium mb-1">Como usar:</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• Posicione o QR Code dentro da área de leitura</li>
                      <li>• Aguarde a leitura automática do código</li>
                      <li>• Ou digite o código manualmente no campo acima</li>
                      <li>• O sistema validará e confirmará o embarque</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanned Data Preview */}
      {scannedData && !confirmation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Funcionário:</span>
                <span>{scannedData.employeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Rota:</span>
                <span>{scannedData.routeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Motorista:</span>
                <span>{scannedData.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Veículo:</span>
                <span>{scannedData.vehiclePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Sentido:</span>
                <Badge variant="outline">
                  {scannedData.direction === 'GOING' ? 'Ida' : 'Volta'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
