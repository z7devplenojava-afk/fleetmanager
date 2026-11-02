import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bus, 
  MapPin, 
  Clock, 
  QrCode, 
  Camera, 
  History, 
  Image as ImageIcon, 
  Navigation, 
  CheckCircle2, 
  User, 
  ShieldCheck, 
  Wifi, 
  Wind, 
  Zap, 
  AlertCircle,
  Search,
  ExternalLink,
  Map as MapIcon,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PassengerLiveMap } from '@/components/passageiro/PassengerLiveMap';
import { PassengerQRCodeModal } from '@/components/passageiro/PassengerQRCodeModal';
import { generateQrCodeSvgUri, generateQrCodeDataPayload } from '@/utils/qrCodeHelper';
import fretamentoCheckinService, { FretamentoCheckinRecord, getCurrentGeoPosition, reverseGeocode } from '@/services/fretamentoCheckinService';

interface VehicleGalleryItem {
  id: string;
  prefix: string;
  plate: string;
  model: string;
  chassi: string;
  capacity: number;
  year: number;
  features: string[];
  photos: { url: string; title: string; category: string }[];
}

const DEMO_VEHICLE: VehicleGalleryItem = {
  id: 'veh-5422',
  prefix: '5422',
  plate: 'SHZ-3A40',
  model: 'Marcopolo Paradiso G8 1200 - Mercedes-Benz O-500R',
  chassi: 'MB O-500R BlueTec 6',
  capacity: 46,
  year: 2024,
  features: [
    'Ar-condicionado Climatizado com Filtro EPA',
    'Wi-Fi 5G a Bordo',
    'Poltronas Super Leito com Tomadas USB Individuais',
    'Geladeira Térmica e Água Mineral',
    'Elevador de Acessibilidade (DPM)',
    'Câmeras de Segurança e Telemetria em Tempo Real',
  ],
  photos: [
    {
      url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
      title: 'Vista Externa Frontal e Lateral',
      category: 'Externa',
    },
    {
      url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1200&q=80',
      title: 'Salão de Passageiros e Poltronas Executivas',
      category: 'Interna',
    },
    {
      url: 'https://images.unsplash.com/photo-1509749837427-ac94a2553d0e?auto=format&fit=crop&w=1200&q=80',
      title: 'Cabine do Motorista e Painel Digital',
      category: 'Cabine',
    },
    {
      url: 'https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?auto=format&fit=crop&w=1200&q=80',
      title: 'Conforto e Espaço Entre Fileiras',
      category: 'Conforto',
    },
  ],
};

export const ClientPassengerPortalContent: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'map' | 'vehicle' | 'my-qr' | 'scan' | 'manual' | 'history'>('map');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Estados de Check-in Manual
  const [manualMatricula, setManualMatricula] = useState('');
  const [manualCpf, setManualCpf] = useState('');
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);

  // Histórico de Check-ins
  const [checkins, setCheckins] = useState<FretamentoCheckinRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Dados do passageiro
  const passengerName = user?.name || 'Colaborador Cliente';
  const passengerCpf = (user as any)?.cpf || '123.456.789-00';
  const passengerMatricula = (user as any)?.registrationNumber || (user as any)?.matricula || 'MAT-5021';
  const companyName = user?.company?.name || user?.companyName || 'Empresa Cliente Parceira';
  const currentLine = 'Linha Rosa - Serra Verde (Fretado)';

  // Carregar histórico
  useEffect(() => {
    loadCheckinHistory();
  }, []);

  const loadCheckinHistory = () => {
    const list = fretamentoCheckinService.getHistory(passengerCpf);
    setCheckins(list);
  };

  // QR Code Payload do Passageiro
  const qrPassengerPayload = generateQrCodeDataPayload('PASSENGER', {
    passengerId: user?.id || 'client-pass-01',
    name: passengerName,
    cpf: passengerCpf,
    matricula: passengerMatricula,
    company: companyName,
    line: currentLine,
  });
  const passengerQrSvgUri = generateQrCodeSvgUri(qrPassengerPayload, 280);

  // Executa Check-in com captura de geolocalização e endereço reverso
  const handlePerformCheckin = async (
    type: 'QR_SCAN_BY_PASSENGER' | 'MANUAL_CPF' | 'MANUAL_MATRICULA',
    extraInfo?: string
  ) => {
    setIsSubmittingCheckin(true);
    toast({
      title: '📍 Capturando Localização...',
      description: 'Obtendo geolocalização e endereço de embarque.',
    });

    try {
      const geo = await getCurrentGeoPosition();
      const address = await reverseGeocode(geo.latitude, geo.longitude);

      const record = await fretamentoCheckinService.registerCheckin({
        passengerId: user?.id || 'client-pass-01',
        passengerName,
        cpf: passengerCpf,
        matricula: passengerMatricula,
        companyName,
        lineName: currentLine,
        vehiclePlate: DEMO_VEHICLE.plate,
        driverName: 'Marcos Oliveira (VSS)',
        checkinType: type,
        latitude: geo.latitude,
        longitude: geo.longitude,
        address,
      });

      toast({
        title: '✅ Check-in Confirmado!',
        description: `Embarque registrado em: ${address}`,
      });

      loadCheckinHistory();
      setActiveTab('history');
      setManualMatricula('');
      setManualCpf('');
    } catch (error) {
      console.error('Erro ao realizar check-in:', error);
      toast({
        title: 'Erro no Check-in',
        description: 'Não foi possível concluir a validação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingCheckin(false);
    }
  };

  const filteredCheckins = checkins.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.lineName.toLowerCase().includes(term) ||
      c.address.toLowerCase().includes(term) ||
      c.vehiclePlate.toLowerCase().includes(term) ||
      c.checkinType.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Banner Informativo do Fretamento Corporativo */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-600 text-white font-bold text-xs uppercase px-2.5 py-0.5">
              Fretamento Corporativo
            </Badge>
            <Badge variant="outline" className="border-blue-400 text-blue-300 text-xs">
              {companyName}
            </Badge>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Bus className="h-5 w-5 text-blue-400" />
            {currentLine}
          </h2>
          <p className="text-xs text-slate-300">
            Operado por <span className="font-bold text-white">Viação São Silvestre</span> &bull; Veículo:{' '}
            <span className="font-mono font-bold text-amber-300">{DEMO_VEHICLE.plate}</span> (Prefixo{' '}
            {DEMO_VEHICLE.prefix})
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setActiveTab('my-qr')}
            className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs gap-1.5 rounded-xl shadow-lg shadow-pink-600/30"
          >
            <QrCode className="h-4 w-4" />
            Meu QR Code
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveTab('scan')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 rounded-xl shadow-lg shadow-emerald-600/30"
          >
            <Camera className="h-4 w-4" />
            Escanear Ônibus
          </Button>
        </div>
      </div>

      {/* Navegação por Abas das Funcionalidades do Passageiro de Cliente */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 bg-slate-900 border border-slate-800 p-1 rounded-2xl h-auto">
          <TabsTrigger value="map" className="py-2.5 text-xs font-bold gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl">
            <Navigation className="h-4 w-4" />
            Rota & Ônibus
          </TabsTrigger>
          <TabsTrigger value="vehicle" className="py-2.5 text-xs font-bold gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-xl">
            <ImageIcon className="h-4 w-4" />
            Fotos do Veículo
          </TabsTrigger>
          <TabsTrigger value="my-qr" className="py-2.5 text-xs font-bold gap-1.5 data-[state=active]:bg-pink-600 data-[state=active]:text-white rounded-xl">
            <QrCode className="h-4 w-4" />
            Exibir Meu QR
          </TabsTrigger>
          <TabsTrigger value="scan" className="py-2.5 text-xs font-bold gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-xl">
            <Camera className="h-4 w-4" />
            Ler QR Motorista
          </TabsTrigger>
          <TabsTrigger value="manual" className="py-2.5 text-xs font-bold gap-1.5 data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-xl">
            <User className="h-4 w-4" />
            Matrícula / CPF
          </TabsTrigger>
          <TabsTrigger value="history" className="py-2.5 text-xs font-bold gap-1.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-xl">
            <History className="h-4 w-4" />
            Histórico ({checkins.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. ABA: MAPA EM TEMPO REAL E ROTA */}
        <TabsContent value="map" className="space-y-4 pt-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <PassengerLiveMap
                lineName={currentLine}
                lineColor="#ec4899"
                onOpenBoardingQr={() => setActiveTab('my-qr')}
              />
            </div>

            <div className="space-y-4">
              <Card className="bg-card border-border shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Próxima Partida
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Horário Previsto:</span>
                    <span className="font-bold text-foreground">06:40 &bull; Em 12 min</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Seu Ponto:</span>
                    <span className="font-bold text-foreground">Av. Cristiano Machado, 1200</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Status do Ônibus:</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                      Em deslocamento normal
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-muted-foreground">Velocidade Atual:</span>
                    <span className="font-mono font-bold text-foreground">42 km/h</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Confirmação de Embarque
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Você pode apresentar seu QR Code ao motorista ou ler o QR Code fixado no painel do ônibus para confirmar sua presença.
                  </p>
                  <Button
                    onClick={() => setActiveTab('my-qr')}
                    className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs"
                  >
                    <QrCode className="h-4 w-4 mr-2" /> Gerar QR Code de Embarque
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 2. ABA: FOTOS E FICHA DO VEÍCULO */}
        <TabsContent value="vehicle" className="space-y-4 pt-3">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bus className="h-5 w-5 text-primary" /> Ficha Técnica & Galeria do Veículo
                  </CardTitle>
                  <CardDescription>
                    Ônibus alocado para a sua linha de fretamento na Viação São Silvestre
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Placa: {DEMO_VEHICLE.plate}
                  </Badge>
                  <Badge className="bg-blue-600 text-white font-bold text-xs">
                    Prefixo: {DEMO_VEHICLE.prefix}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Foto Principal em Destaque */}
              <div className="relative w-full h-80 rounded-2xl overflow-hidden shadow-2xl border border-border bg-black">
                <img
                  src={DEMO_VEHICLE.photos[selectedPhotoIndex].url}
                  alt={DEMO_VEHICLE.photos[selectedPhotoIndex].title}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5">
                  <Badge className="bg-blue-600 text-white font-bold text-[10px] w-fit mb-1">
                    {DEMO_VEHICLE.photos[selectedPhotoIndex].category}
                  </Badge>
                  <h3 className="text-lg font-black text-white">
                    {DEMO_VEHICLE.photos[selectedPhotoIndex].title}
                  </h3>
                  <p className="text-xs text-slate-300">{DEMO_VEHICLE.model}</p>
                </div>
              </div>

              {/* Miniaturas de Fotos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DEMO_VEHICLE.photos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`relative rounded-xl overflow-hidden h-24 border-2 transition-all ${
                      selectedPhotoIndex === idx
                        ? 'border-blue-500 scale-105 shadow-lg shadow-blue-500/30'
                        : 'border-border/60 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white p-1 truncate text-center font-bold">
                      {photo.category}
                    </div>
                  </button>
                ))}
              </div>

              {/* Detalhes do Veículo e Itens de Conforto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="space-y-3 p-4 rounded-xl bg-muted/40 border border-border">
                  <h4 className="text-sm font-bold text-foreground">Especificações do Ônibus</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Modelo Carroceria:</span>
                      <span className="font-bold text-foreground">{DEMO_VEHICLE.model}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Chassi:</span>
                      <span className="font-bold text-foreground">{DEMO_VEHICLE.chassi}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-muted-foreground">Capacidade Sentados:</span>
                      <span className="font-bold text-foreground">{DEMO_VEHICLE.capacity} passageiros</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Ano de Fabricação:</span>
                      <span className="font-bold text-foreground">{DEMO_VEHICLE.year} (Frota Nova)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-xl bg-muted/40 border border-border">
                  <h4 className="text-sm font-bold text-foreground">Conforto e Segurança a Bordo</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {DEMO_VEHICLE.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. ABA: MEU QR CODE PARA O MOTORISTA BIPAR */}
        <TabsContent value="my-qr" className="space-y-4 pt-3 max-w-md mx-auto">
          <Card className="bg-card border-border shadow-2xl text-center">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-center gap-2">
                <QrCode className="h-5 w-5 text-pink-500" /> Meu QR Code de Embarque
              </CardTitle>
              <CardDescription>
                Apresente a tela do seu celular para a câmera do motorista escanear ao subir no ônibus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-white p-5 rounded-3xl mx-auto w-64 h-64 flex items-center justify-center shadow-xl border-4 border-slate-700">
                <img
                  src={passengerQrSvgUri}
                  alt="QR Code do Funcionário"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border border-border text-left space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Colaborador:</span>
                  <span className="font-bold text-foreground">{passengerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPF:</span>
                  <span className="font-mono font-bold text-foreground">{passengerCpf}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Matrícula:</span>
                  <span className="font-mono font-bold text-foreground">{passengerMatricula}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empresa Contratante:</span>
                  <span className="font-bold text-blue-400">{companyName}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Válido para todas as viagens do fretamento diário
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. ABA: LER O QR CODE DO MOTORISTA COM A CÂMERA */}
        <TabsContent value="scan" className="space-y-4 pt-3 max-w-md mx-auto">
          <Card className="bg-card border-border shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-emerald-500" /> Ler QR Code do Motorista
              </CardTitle>
              <CardDescription>
                Aponte a câmera para o QR Code exibido pelo motorista ou fixado no ônibus. A geolocalização e o endereço de embarque serão gravados automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/30 border border-border rounded-2xl text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                  <Camera className="h-7 w-7" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ao confirmar a leitura, capturamos suas coordenadas GPS e o endereço reverso onde o embarque ocorreu.
                </p>
                <Button
                  onClick={() => handlePerformCheckin('QR_SCAN_BY_PASSENGER')}
                  disabled={isSubmittingCheckin}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm h-11 rounded-xl shadow-lg shadow-emerald-600/30 gap-2"
                >
                  {isSubmittingCheckin ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  {isSubmittingCheckin ? 'Validando & Obtendo Endereço...' : 'Confirmar Leitura do QR Code'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. ABA: CHECK-IN MANUAL POR MATRÍCULA OU CPF */}
        <TabsContent value="manual" className="space-y-4 pt-3 max-w-md mx-auto">
          <Card className="bg-card border-border shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-amber-500" /> Check-in por Matrícula ou CPF
              </CardTitle>
              <CardDescription>
                Caso não consiga escanear o QR Code, confirme seu embarque digitando sua matrícula funcional ou CPF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inputMatricula" className="text-xs font-bold">
                  Matrícula do Funcionário
                </Label>
                <Input
                  id="inputMatricula"
                  placeholder="Ex: FUN-1002"
                  value={manualMatricula || passengerMatricula}
                  onChange={(e) => setManualMatricula(e.target.value)}
                  className="bg-background font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inputCpf" className="text-xs font-bold">
                  CPF do Funcionário
                </Label>
                <Input
                  id="inputCpf"
                  placeholder="000.000.000-00"
                  value={manualCpf || passengerCpf}
                  onChange={(e) => setManualCpf(e.target.value)}
                  className="bg-background font-mono text-sm"
                />
              </div>

              <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs text-muted-foreground flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  O sistema registrará automaticamente a geolocalização exata e o logradouro no momento em que você clicar em Confirmar.
                </span>
              </div>

              <Button
                onClick={() =>
                  handlePerformCheckin(
                    manualMatricula ? 'MANUAL_MATRICULA' : 'MANUAL_CPF',
                    manualMatricula || manualCpf
                  )
                }
                disabled={isSubmittingCheckin}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm h-11 rounded-xl shadow-lg shadow-amber-600/30 gap-2"
              >
                {isSubmittingCheckin ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {isSubmittingCheckin ? 'Registrando com GPS...' : 'Confirmar Check-in Manual'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. ABA: HISTÓRICO DE UTILIZAÇÃO DO FRETADO */}
        <TabsContent value="history" className="space-y-4 pt-3">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5 text-purple-500" /> Histórico de Embarques & Check-ins
                  </CardTitle>
                  <CardDescription>
                    Extrato de utilização com data, hora, veículo e localização precisa de cada embarque
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar por endereço, linha..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-xs bg-background"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCheckins.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                  <History className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum check-in registrado até o momento.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCheckins.map((chk) => (
                    <div
                      key={chk.id}
                      className="p-4 rounded-xl border border-border bg-card/60 hover:bg-muted/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground">{chk.lineName}</span>
                          <Badge variant="outline" className="text-[11px] font-mono">
                            {chk.vehiclePlate}
                          </Badge>
                          <Badge
                            className={`text-[10px] font-bold ${
                              chk.checkinType.includes('QR')
                                ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30'
                                : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {chk.checkinType === 'QR_SCAN_BY_PASSENGER'
                              ? '📱 QR Code pelo Passageiro'
                              : chk.checkinType === 'QR_SCAN_BY_DRIVER'
                              ? '🚍 QR Code Bipado pelo Motorista'
                              : chk.checkinType === 'MANUAL_MATRICULA'
                              ? '🔢 Validação por Matrícula'
                              : '📝 Validação por CPF'}
                          </Badge>
                          {chk.synced && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                              Sincronizado
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="font-medium text-foreground">{chk.address}</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span>
                            Data/Hora: {new Date(chk.timestamp).toLocaleString('pt-BR')}
                          </span>
                          <span>
                            Motorista: {chk.driverName || 'Viação São Silvestre'}
                          </span>
                          <span className="font-mono text-[11px]">
                            GPS: {chk.latitude.toFixed(4)}, {chk.longitude.toFixed(4)}
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${chk.latitude},${chk.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold bg-blue-950/40 border border-blue-800 px-3 py-1.5 rounded-lg"
                        >
                          <MapIcon className="h-3.5 w-3.5" /> Ver no Mapa
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientPassengerPortalContent;
