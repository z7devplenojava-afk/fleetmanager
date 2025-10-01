import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  Shield, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface GeolocationData {
  latitude: number;
  longitude: number;
}

const FacialLogin: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Estados da câmera
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Estados do processo
  const [currentStep, setCurrentStep] = useState<'idle' | 'camera' | 'capture' | 'processing' | 'success' | 'error'>('idle');
  const [captureProgress, setCaptureProgress] = useState(0);
  const [livenessProgress, setLivenessProgress] = useState(0);
  
  // Estados de geolocalização
  const [geolocation, setGeolocation] = useState<GeolocationData | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  
  // Estados de validação
  const [showLivenessChallenge, setShowLivenessChallenge] = useState(false);
  const [livenessStep, setLivenessStep] = useState<'blink' | 'turn' | 'smile' | 'complete'>('blink');
  
  // Referências
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    // Obter geolocalização ao carregar a página
    getGeolocation();
    
    return () => {
      // Limpar câmera ao desmontar
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const getGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setGeolocationError(null);
        },
        (error) => {
          console.error('Erro ao obter geolocalização:', error);
          setGeolocationError('Não foi possível obter sua localização');
        }
      );
    } else {
      setGeolocationError('Geolocalização não é suportada neste navegador');
    }
  };
  
  const startCamera = async () => {
    try {
      setCurrentStep('camera');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsCameraActive(true);
      
      // Iniciar verificação de liveness após 2 segundos
      setTimeout(() => {
        startLivenessCheck();
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      toast.error('Não foi possível acessar a câmera. Verifique as permissões.');
      setCurrentStep('error');
    }
  };
  
  const startLivenessCheck = () => {
    setShowLivenessChallenge(true);
    setLivenessStep('blink');
    
    // Simular verificação de liveness
    const livenessSteps = ['blink', 'turn', 'smile', 'complete'];
    let currentStepIndex = 0;
    
    const livenessInterval = setInterval(() => {
      if (currentStepIndex < livenessSteps.length) {
        setLivenessStep(livenessSteps[currentStepIndex] as any);
        setLivenessProgress((currentStepIndex + 1) * 25);
        currentStepIndex++;
      } else {
        clearInterval(livenessInterval);
        setShowLivenessChallenge(false);
        setLivenessProgress(100);
      }
    }, 1500);
  };
  
  const captureImage = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    setCurrentStep('capture');
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      // Configurar canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Desenhar frame da câmera no canvas
      context.drawImage(video, 0, 0);
      
      // Converter para base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      
      // Simular processamento
      processFacialRecognition(imageData);
    }
  };
  
  const processFacialRecognition = async (imageData: string) => {
    setCurrentStep('processing');
    setCaptureProgress(0);
    
    // Simular processamento com progresso
    const progressInterval = setInterval(() => {
      setCaptureProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    
    try {
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simular sucesso (em produção, aqui seria feita a chamada para a API)
      setCurrentStep('success');
      toast.success('Reconhecimento facial realizado com sucesso!');
      
      // Simular login automático
      setTimeout(() => {
        navigate('/supervisao');
      }, 2000);
      
    } catch (error) {
      console.error('Erro no reconhecimento facial:', error);
      setCurrentStep('error');
      toast.error('Falha no reconhecimento facial. Tente novamente.');
    }
  };
  
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setCurrentStep('idle');
    setCapturedImage(null);
    setShowLivenessChallenge(false);
    setLivenessProgress(0);
    setCaptureProgress(0);
  };
  
  const retryCapture = () => {
    setCurrentStep('camera');
    setCapturedImage(null);
    setShowLivenessChallenge(false);
    setLivenessProgress(0);
    setCaptureProgress(0);
  };
  
  const getLivenessInstruction = () => {
    switch (livenessStep) {
      case 'blink': return 'Pisque os olhos';
      case 'turn': return 'Vire a cabeça para a esquerda e direita';
      case 'smile': return 'Sorria para a câmera';
      case 'complete': return 'Verificação completa!';
      default: return '';
    }
  };
  
  const getLivenessIcon = () => {
    switch (livenessStep) {
      case 'blink': return <Eye className="w-6 h-6" />;
      case 'turn': return <AlertTriangle className="w-6 h-6" />;
      case 'smile': return <CheckCircle className="w-6 h-6" />;
      case 'complete': return <CheckCircle className="w-6 h-6 text-green-500" />;
      default: return <Camera className="w-6 h-6" />;
    }
  };
  
  return (
    <div className="min-h-screen bg-seguranca-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-seguranca-yellow" />
            <h1 className="text-4xl font-bold text-seguranca-lightgray">
              Login Facial
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Sistema de autenticação por reconhecimento facial para supervisores
          </p>
        </div>
        
        {/* Card Principal */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
              <Camera className="w-6 h-6 text-seguranca-yellow" />
              Autenticação Biométrica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Status da Geolocalização */}
            {geolocation && (
              <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-600 rounded-lg">
                <MapPin className="w-5 h-5 text-green-500" />
                <span className="text-green-400 text-sm">
                  Localização obtida: {geolocation.latitude.toFixed(6)}, {geolocation.longitude.toFixed(6)}
                </span>
              </div>
            )}
            
            {geolocationError && (
              <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-600 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span className="text-red-400 text-sm">{geolocationError}</span>
                <Button 
                  onClick={getGeolocation}
                  size="sm"
                  variant="outline"
                  className="ml-auto border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  Tentar Novamente
                </Button>
              </div>
            )}
            
            {/* Câmera */}
            {currentStep === 'camera' && (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 bg-black rounded-lg"
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                    width="640"
                    height="480"
                  />
                  
                  {/* Overlay de Liveness */}
                  {showLivenessChallenge && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="mb-4">
                          {getLivenessIcon()}
                        </div>
                        <h3 className="text-lg font-medium mb-2">
                          {getLivenessInstruction()}
                        </h3>
                        <Progress value={livenessProgress} className="w-48" />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={captureImage}
                    className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-600"
                    disabled={!isCameraActive || showLivenessChallenge}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Capturar Imagem
                  </Button>
                  
                  <Button 
                    onClick={stopCamera}
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                  >
                    Parar Câmera
                  </Button>
                </div>
              </div>
            )}
            
            {/* Captura */}
            {currentStep === 'capture' && capturedImage && (
              <div className="space-y-4">
                <div className="text-center">
                  <img 
                    src={capturedImage} 
                    alt="Imagem capturada" 
                    className="w-64 h-48 object-cover mx-auto rounded-lg border-2 border-seguranca-yellow"
                  />
                  <p className="text-seguranca-lightgray mt-2">
                    Imagem capturada com sucesso
                  </p>
                </div>
              </div>
            )}
            
            {/* Processamento */}
            {currentStep === 'processing' && (
              <div className="space-y-4 text-center">
                <Loader2 className="w-12 h-12 text-seguranca-yellow mx-auto animate-spin" />
                <h3 className="text-lg font-medium text-seguranca-lightgray">
                  Processando reconhecimento facial...
                </h3>
                <Progress value={captureProgress} className="w-full" />
                <p className="text-gray-400 text-sm">
                  {captureProgress}% concluído
                </p>
              </div>
            )}
            
            {/* Sucesso */}
            {currentStep === 'success' && (
              <div className="space-y-4 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-medium text-green-400">
                  Autenticação Realizada com Sucesso!
                </h3>
                <p className="text-gray-400">
                  Redirecionando para o sistema...
                </p>
                <Badge className="bg-green-600 text-white">
                  Supervisor Autenticado
                </Badge>
              </div>
            )}
            
            {/* Erro */}
            {currentStep === 'error' && (
              <div className="space-y-4 text-center">
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                <h3 className="text-xl font-medium text-red-400">
                  Falha na Autenticação
                </h3>
                <p className="text-gray-400">
                  Não foi possível realizar o reconhecimento facial.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={retryCapture}
                    className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-600"
                  >
                    Tentar Novamente
                  </Button>
                  <Button 
                    onClick={() => navigate('/login')}
                    variant="outline"
                    className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white"
                  >
                    Usar Login Tradicional
                  </Button>
                </div>
              </div>
            )}
            
            {/* Inicial */}
            {currentStep === 'idle' && (
              <div className="space-y-6 text-center">
                <div className="w-32 h-32 bg-seguranca-graphite border-2 border-dashed border-seguranca-yellow rounded-full mx-auto flex items-center justify-center">
                  <Camera className="w-16 h-16 text-seguranca-yellow" />
                </div>
                
                <div>
                  <h3 className="text-xl font-medium text-seguranca-lightgray mb-2">
                    Iniciar Autenticação Facial
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Posicione-se em frente à câmera e clique em "Iniciar Câmera"
                  </p>
                  
                  <Button 
                    onClick={startCamera}
                    className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-600 px-8 py-3 text-lg"
                    disabled={!geolocation}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Iniciar Câmera
                  </Button>
                </div>
                
                {!geolocation && (
                  <div className="text-yellow-400 text-sm">
                    ⚠️ É necessário permitir o acesso à localização para continuar
                  </div>
                )}
              </div>
            )}
            
            {/* Fallback */}
            <div className="text-center pt-4 border-t border-gray-600">
              <Button 
                onClick={() => navigate('/login')}
                variant="ghost"
                className="text-seguranca-yellow hover:text-yellow-400"
              >
                Usar login tradicional
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacialLogin;
