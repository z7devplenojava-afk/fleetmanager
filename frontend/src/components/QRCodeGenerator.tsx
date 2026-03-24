import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Download, Loader2 } from 'lucide-react';
import qrCodeService from '@/services/qrCodeService';
import { useAuth } from '@/contexts/AuthContext';

interface QRCodeGeneratorProps {
  workPosts?: any[];
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ workPosts = [] }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    workPostId: '',
    description: '',
    latitude: '',
    longitude: '',
    radiusMeters: '100'
  });
  const [generatedQRCode, setGeneratedQRCode] = useState<{ id: string; imageUrl: string } | null>(null);

  const handleGenerate = async () => {
    if (!formData.workPostId || !user?.id) {
      toast({
        title: "❌ Erro",
        description: "Selecione um posto de trabalho",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const response = await qrCodeService.generateQRCode(
        formData.workPostId,
        formData.description || 'QR Code de Ponto',
        user.id,
        formData.latitude ? parseFloat(formData.latitude) : undefined,
        formData.longitude ? parseFloat(formData.longitude) : undefined,
        parseInt(formData.radiusMeters)
      );

      if (response.success) {
        const imageUrl = await qrCodeService.getQRCodeImage(response.data.id);
        setGeneratedQRCode({
          id: response.data.id,
          imageUrl
        });

        toast({
          title: "✅ QR Code Gerado",
          description: "QR Code criado com sucesso!",
        });
      }
    } catch (error: any) {
      console.error('Erro ao gerar QR Code:', error);
      toast({
        title: "❌ Erro",
        description: error.response?.data?.error || "Erro ao gerar QR Code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedQRCode) return;

    const link = document.createElement('a');
    link.href = generatedQRCode.imageUrl;
    link.download = `qrcode-${generatedQRCode.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "✅ Download Iniciado",
      description: "QR Code baixado com sucesso!",
    });
  };

  return (
    <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
      <CardHeader>
        <CardTitle className="text-seguranca-lightgray flex items-center">
          <QrCode className="mr-2 h-5 w-5 text-seguranca-yellow" />
          Gerar QR Code
        </CardTitle>
        <CardDescription>
          Crie QR Codes para registros de ponto em postos de trabalho
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="workPost">Posto de Trabalho *</Label>
          <Select
            value={formData.workPostId}
            onValueChange={(value) => setFormData({ ...formData, workPostId: value })}
          >
            <SelectTrigger className="bg-seguranca-black border-seguranca-gray/30">
              <SelectValue placeholder="Selecione um posto" />
            </SelectTrigger>
            <SelectContent>
              {workPosts.map((post) => (
                <SelectItem key={post.id} value={post.id}>
                  {post.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            placeholder="Ex: QR Code Portaria Principal"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="bg-seguranca-black border-seguranca-gray/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude (opcional)</Label>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              placeholder="-23.5505199"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="bg-seguranca-black border-seguranca-gray/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude (opcional)</Label>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              placeholder="-46.6333094"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="bg-seguranca-black border-seguranca-gray/30"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="radius">Raio de Validação (metros)</Label>
          <Input
            id="radius"
            type="number"
            placeholder="100"
            value={formData.radiusMeters}
            onChange={(e) => setFormData({ ...formData, radiusMeters: e.target.value })}
            className="bg-seguranca-black border-seguranca-gray/30"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-seguranca-yellow hover:bg-seguranca-yellow/80 text-seguranca-black font-bold"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <QrCode className="mr-2 h-4 w-4" />
              Gerar QR Code
            </>
          )}
        </Button>

        {generatedQRCode && (
          <div className="p-4 border border-seguranca-yellow/30 rounded-lg bg-seguranca-yellow/5 space-y-4">
            <div className="flex justify-center">
              <img
                src={generatedQRCode.imageUrl}
                alt="QR Code Gerado"
                className="w-64 h-64 border-4 border-seguranca-yellow/50 rounded-lg"
              />
            </div>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full border-seguranca-yellow/50 hover:bg-seguranca-yellow/10"
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar QR Code
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;

