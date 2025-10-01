import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, Save, Eye, Download, Loader2 } from 'lucide-react';
import { companyConfigService, CompanyConfig } from '@/services/companyConfigService';

interface CompanySettingsProps {
  open: boolean;
  onSave: (config: CompanyConfig) => void;
}

export const CompanySettings: React.FC<CompanySettingsProps> = ({ open, onSave }) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<CompanyConfig>({
    name: '',
    cnpj: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    website: '',
    logoUrl: '',
    headerText: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE SEGURANÇA',
    footerText: 'Este contrato é regido pelas leis brasileiras e foro da cidade de São Paulo/SP.',
    contractTerms: ''
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadCompanyConfig();
    }
  }, [open]);

  const loadCompanyConfig = async () => {
    setLoading(true);
    try {
      const activeConfig = await companyConfigService.getActiveConfig();
      if (activeConfig) {
        setConfig(activeConfig);
        if (activeConfig.logoUrl) {
          setLogoPreview(activeConfig.logoUrl);
        }
      } else {
        // Se não existe configuração, usar valores padrão
        setConfig({
          name: 'Secure Guard Segurança Ltda',
          cnpj: '12.345.678/0001-90',
          address: 'Rua da Segurança, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          phone: '(11) 9999-9999',
          email: 'contato@secureguard.com.br',
          website: 'www.secureguard.com.br',
          logoUrl: '',
          headerText: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE SEGURANÇA',
          footerText: 'Este contrato é regido pelas leis brasileiras e foro da cidade de São Paulo/SP.',
          contractTerms: `CLÁUSULAS E CONDIÇÕES:

1. DO OBJETO: A CONTRATADA prestará serviços de segurança patrimonial conforme especificado neste contrato.

2. DAS OBRIGAÇÕES DA CONTRATADA:
   - Fornecer pessoal qualificado e treinado
   - Manter equipamentos em perfeito estado
   - Cumprir horários estabelecidos
   - Reportar ocorrências imediatamente

3. DAS OBRIGAÇÕES DA CONTRATANTE:
   - Efetuar pagamentos conforme prazo estabelecido
   - Fornecer acesso às dependências necessárias
   - Comunicar alterações com antecedência

4. DO VALOR E PAGAMENTO:
   - O valor será pago mensalmente até o dia 10
   - Reajustes conforme índices oficiais
   - Multa de 2% em caso de atraso

5. DA VIGÊNCIA:
   - Conforme período estabelecido no contrato
   - Renovação automática salvo manifestação contrária

6. DA RESCISÃO:
   - Comunicação prévia de 30 dias
   - Pagamento proporcional dos serviços prestados

7. DO FORO:
   - Foro da comarca de São Paulo/SP para questões judiciais`
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações da empresa.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setConfig(prev => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validações básicas
      if (!config.name || !config.cnpj || !config.address || !config.city || 
          !config.state || !config.zipCode || !config.phone || !config.email) {
        toast({
          title: "Dados Incompletos",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive"
        });
        return;
      }

      const savedConfig = await companyConfigService.saveConfig(config);
      onSave(savedConfig);
      
      toast({
        title: "Configurações Salvas",
        description: "As configurações da empresa foram salvas com sucesso no banco de dados.",
      });
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro ao Salvar",
        description: error.message || "Não foi possível salvar as configurações da empresa.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // Abrir preview do template
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(generateContractPreview());
    }
  };

  const generateContractPreview = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Preview - Contrato</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { max-height: 80px; margin-bottom: 10px; }
          .company-info { font-size: 12px; margin-bottom: 10px; }
          .contract-title { font-size: 18px; font-weight: bold; margin: 20px 0; }
          .content { line-height: 1.6; text-align: justify; }
          .footer { border-top: 1px solid #000; padding-top: 20px; margin-top: 40px; font-size: 10px; text-align: center; }
          .signature-section { margin-top: 50px; }
          .signature-box { border: 1px solid #000; height: 80px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          ${config.logoUrl ? `<img src="${config.logoUrl}" alt="Logo" class="logo" />` : ''}
          <div class="company-info">
            <strong>${config.name}</strong><br>
            CNPJ: ${config.cnpj}<br>
            ${config.address}, ${config.city}/${config.state} - CEP: ${config.zipCode}<br>
            Tel: ${config.phone} | Email: ${config.email}
            ${config.website ? ` | ${config.website}` : ''}
          </div>
          <div class="contract-title">${config.headerText}</div>
        </div>
        
        <div class="content">
          <p><strong>CONTRATANTE:</strong> [NOME DO CLIENTE]</p>
          <p><strong>CNPJ/CPF:</strong> [DOCUMENTO DO CLIENTE]</p>
          <p><strong>ENDEREÇO:</strong> [ENDEREÇO DO CLIENTE]</p>
          
          <p><strong>CONTRATADA:</strong> ${config.name}</p>
          <p><strong>CNPJ:</strong> ${config.cnpj}</p>
          <p><strong>ENDEREÇO:</strong> ${config.address}, ${config.city}/${config.state}</p>
          
          <br>
          <p><strong>VALOR DO CONTRATO:</strong> R$ [VALOR]</p>
          <p><strong>PERÍODO:</strong> [DATA INÍCIO] a [DATA FIM]</p>
          <p><strong>DESCRIÇÃO:</strong> [DESCRIÇÃO DOS SERVIÇOS]</p>
          
          <br>
          <div style="white-space: pre-line;">${config.contractTerms}</div>
          
          <div class="signature-section">
            <p><strong>ASSINATURAS:</strong></p>
            <div style="display: flex; justify-content: space-between;">
              <div style="width: 45%;">
                <div class="signature-box"></div>
                <p style="text-align: center; margin: 0;"><strong>CONTRATANTE</strong></p>
              </div>
              <div style="width: 45%;">
                <div class="signature-box"></div>
                <p style="text-align: center; margin: 0;"><strong>CONTRATADA</strong></p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          ${config.footerText}
        </div>
      </body>
      </html>
    `;
  };

  if (!open) return null;

  return (
    <div className="space-y-6">
      {/* Dados da Empresa */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray">Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-seguranca-lightgray">Nome da Empresa *</Label>
              <Input
                value={config.name}
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            <div>
              <Label className="text-seguranca-lightgray">CNPJ *</Label>
              <Input
                value={config.cnpj}
                onChange={(e) => setConfig(prev => ({ ...prev, cnpj: e.target.value }))}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>

          <div>
            <Label className="text-seguranca-lightgray">Endereço *</Label>
            <Input
              value={config.address}
              onChange={(e) => setConfig(prev => ({ ...prev, address: e.target.value }))}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-seguranca-lightgray">Cidade *</Label>
              <Input
                value={config.city}
                onChange={(e) => setConfig(prev => ({ ...prev, city: e.target.value }))}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            <div>
              <Label className="text-seguranca-lightgray">Estado *</Label>
              <Input
                value={config.state}
                onChange={(e) => setConfig(prev => ({ ...prev, state: e.target.value }))}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            <div>
              <Label className="text-seguranca-lightgray">CEP *</Label>
              <Input
                value={config.zipCode}
                onChange={(e) => setConfig(prev => ({ ...prev, zipCode: e.target.value }))}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-seguranca-lightgray">Telefone *</Label>
              <Input
                value={config.phone}
                onChange={(e) => setConfig(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            <div>
              <Label className="text-seguranca-lightgray">Email *</Label>
              <Input
                value={config.email}
                onChange={(e) => setConfig(prev => ({ ...prev, email: e.target.value }))}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>

          <div>
            <Label className="text-seguranca-lightgray">Website</Label>
            <Input
              value={config.website}
              onChange={(e) => setConfig(prev => ({ ...prev, website: e.target.value }))}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              placeholder="www.exemplo.com.br"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logo da Empresa */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray">Logo da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-seguranca-lightgray">Upload da Logo</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('logo-upload')?.click()}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                <Upload className="h-4 w-4 mr-2" />
                Escolher Arquivo
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              {logoFile && (
                <span className="text-sm text-gray-400">{logoFile.name}</span>
              )}
            </div>
          </div>

          {logoPreview && (
            <div className="bg-seguranca-black p-4 rounded border border-gray-600">
              <p className="text-sm text-gray-400 mb-2">Preview da Logo:</p>
              <img 
                src={logoPreview} 
                alt="Logo Preview" 
                className="max-h-20 object-contain"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template do Contrato */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray">Template do Contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-seguranca-lightgray">Título do Cabeçalho</Label>
            <Input
              value={config.headerText}
              onChange={(e) => setConfig(prev => ({ ...prev, headerText: e.target.value }))}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>

          <div>
            <Label className="text-seguranca-lightgray">Texto do Rodapé</Label>
            <Textarea
              value={config.footerText}
              onChange={(e) => setConfig(prev => ({ ...prev, footerText: e.target.value }))}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              rows={2}
            />
          </div>

          <div>
            <Label className="text-seguranca-lightgray">Cláusulas e Condições do Contrato</Label>
            <Textarea
              value={config.contractTerms}
              onChange={(e) => setConfig(prev => ({ ...prev, contractTerms: e.target.value }))}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              rows={15}
            />
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-between">
        <Button
          onClick={handlePreview}
          variant="outline"
          className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview Template
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-seguranca-red hover:bg-seguranca-darkred text-white"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
