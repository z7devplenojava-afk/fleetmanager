import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { CandidateFormData } from '../../types/candidate';
import { candidateService } from '../../services/candidateService';
import { useToast } from '../../hooks/use-toast';
import { Loader2, Upload, FileText, AlertCircle, Shield, User, Briefcase } from 'lucide-react';
import { 
  candidateValidationRules, 
  validateForm, 
  sanitizeInput, 
  validateFile, 
  RateLimiter 
} from '../../utils/validation';
import { useReCaptcha } from '../ui/recaptcha';
import { Switch } from '../ui/switch';

interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacancyId: string;
  vacancyTitle: string;
}

const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const educationLevels = [
  'Ensino Fundamental Incompleto',
  'Ensino Fundamental Completo',
  'Ensino Médio Incompleto',
  'Ensino Médio Completo',
  'Ensino Superior Incompleto',
  'Ensino Superior Completo',
  'Pós-graduação',
  'Mestrado',
  'Doutorado'
];

const availabilityOptions = [
  'Imediata',
  '15 dias',
  '30 dias',
  '60 dias',
  '90 dias',
  'A combinar'
];

const cnhCategories = ['A', 'B', 'AB', 'C', 'D', 'E'];

// Rate limiter instance
const rateLimiter = new RateLimiter(3, 3600000); // 3 attempts per hour

export function CandidateFormModal({ isOpen, onClose, vacancyId, vacancyTitle }: CandidateFormModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [curriculumFile, setCurriculumFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CandidateFormData>({
    jobVacancyId: vacancyId,
    name: '',
    email: '',
    phone: '',
    cpf: '',
    address: '',
    city: '',
    state: '',
    educationLevel: '',
    experienceYears: 0,
    currentPosition: '',
    currentCompany: '',
    expectedSalary: 0,
    availability: '',
    requiresCnh: false,
    cnhCategory: '',
  });

  // reCAPTCHA hook (use your actual site key)
  const { execute: executeRecaptcha, isLoading: recaptchaLoading, error: recaptchaError } = useReCaptcha(
    import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'your-site-key-here'
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        jobVacancyId: vacancyId,
        name: '',
        email: '',
        phone: '',
        cpf: '',
        address: '',
        city: '',
        state: '',
        educationLevel: '',
        experienceYears: 0,
        currentPosition: '',
        currentCompany: '',
        expectedSalary: 0,
        availability: '',
        requiresCnh: false,
        cnhCategory: '',
      });
      setCurriculumFile(null);
      setErrors({});
    }
  }, [isOpen, vacancyId]);

  const handleInputChange = (field: keyof CandidateFormData, value: string | number) => {
    // Sanitize input to prevent XSS
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: 'Erro',
          description: validationError,
          variant: 'destructive'
        });
        event.target.value = '';
        return;
      }

      setCurriculumFile(file);
      setErrors(prev => ({ ...prev, curriculum: '' }));
    }
  };

  const validateFormData = (): boolean => {
    const validationErrors = validateForm(formData, candidateValidationRules);
    
    // Additional validation for curriculum file
    if (curriculumFile) {
      const fileError = validateFile(curriculumFile);
      if (fileError) {
        validationErrors.curriculum = fileError;
      }
    }

    // Se CNH for obrigatória, categoria deve ser preenchida
    if (formData.requiresCnh && !formData.cnhCategory) {
      validationErrors.cnhCategory = 'Informe a categoria da CNH';
    }
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    const clientKey = `candidate_${vacancyId}_${Date.now()}`; // Simple key based on vacancy and time
    if (!rateLimiter.canAttempt(clientKey)) {
      const remainingTime = rateLimiter.getRemainingTime(clientKey);
      const minutes = Math.ceil(remainingTime / 60000);
      
      toast({
        title: 'Limite excedido',
        description: `Você pode enviar apenas 3 candidaturas por hora. Tente novamente em ${minutes} minutos.`,
        variant: 'destructive'
      });
      return;
    }

    // Validate form
    if (!validateFormData()) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, corrija os erros no formulário.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Execute reCAPTCHA verification
      let captchaToken = '';
      try {
        captchaToken = await executeRecaptcha();
      } catch (error) {
        toast({
          title: 'Erro de verificação',
          description: 'Falha na verificação de segurança. Tente novamente.',
          variant: 'destructive'
        });
        return;
      }

      const candidateData = {
        ...formData,
        curriculum: curriculumFile
      };

      // Add captcha token to the request
      await candidateService.createCandidate(candidateData, captchaToken);
      
      toast({
        title: 'Sucesso',
        description: 'Candidatura enviada com sucesso! Entraremos em contato em breve.',
      });

      // Clear form
      setFormData({
        jobVacancyId: vacancyId,
        name: '',
        email: '',
        phone: '',
        cpf: '',
        address: '',
        city: '',
        state: '',
        educationLevel: '',
        experienceYears: 0,
        currentPosition: '',
        currentCompany: '',
        expectedSalary: 0,
        availability: '',
        requiresCnh: false,
        cnhCategory: '',
      });
      setCurriculumFile(null);
      setErrors({});
      onClose();
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast({
          title: 'Limite de candidaturas atingido',
          description: 'Você atingiu o limite de 3 candidaturas por hora. Tente novamente em 1 hora.',
          variant: 'destructive'
        });
        return;
      }
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Erro ao enviar candidatura';
      // Mensagem customizada para duplicidade
      let userMessage = errorMessage;
      if (errorMessage.includes('Já existe uma candidatura com este CPF ou email')) {
        userMessage = 'Você já se candidatou para esta vaga com este CPF ou e-mail. Caso queira atualizar seus dados, entre em contato com o RH.';
      }
      console.log('Toast erro candidatura:', userMessage); // debug
      toast({
        title: 'Candidatura já enviada',
        description: userMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    handleInputChange('cpf', formatted);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl lg:max-w-3xl sm:rounded-lg max-h-[90vh] overflow-y-auto p-3 sm:p-6 border-gray-700">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-400" />
            Candidatar-se para: {vacancyTitle}
          </DialogTitle>
          <p className="text-sm text-gray-400">
            Seus dados estão protegidos e serão utilizados apenas para esta candidatura.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Pessoais */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-600 pb-2 flex items-center gap-2">
              <User className="h-4 w-4 text-green-400" />
              Informações Pessoais
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base text-white font-medium">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`border-gray-600 text-white text-sm sm:text-base ${errors.name ? 'border-red-500' : ''}`}
                  style={{ backgroundColor: '#1a1a1a' }}
                  required
                />
                {errors.name && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base text-white font-medium">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`border-gray-600 text-white text-sm sm:text-base ${errors.email ? 'border-red-500' : ''}`}
                  style={{ backgroundColor: '#1a1a1a' }}
                  required
                />
                {errors.email && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm sm:text-base text-white font-medium">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`border-gray-600 text-white text-sm sm:text-base ${errors.phone ? 'border-red-500' : ''}`}
                  style={{ backgroundColor: '#1a1a1a' }}
                />
                {errors.phone && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-sm sm:text-base text-white font-medium">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleCPFChange(e.target.value)}
                  className={`border-gray-600 text-white text-sm sm:text-base ${errors.cpf ? 'border-red-500' : ''}`}
                  style={{ backgroundColor: '#1a1a1a' }}
                  maxLength={14}
                  required
                />
                {errors.cpf && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.cpf}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm sm:text-base text-white font-medium">Endereço</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={`border-gray-600 text-white text-sm sm:text-base ${errors.address ? 'border-red-500' : ''}`}
                style={{ backgroundColor: '#1a1a1a' }}
                rows={2}
              />
              {errors.address && (
                <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm sm:text-base text-white font-medium">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`border-gray-600 text-white text-sm sm:text-base ${errors.city ? 'border-red-500' : ''}`}
                  style={{ backgroundColor: '#1a1a1a' }}
                />
                {errors.city && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.city}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm sm:text-base text-white font-medium">Estado</Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger className="border-gray-600 text-white text-sm sm:text-base" style={{ backgroundColor: '#1a1a1a' }}>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Informações Profissionais */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-600 pb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-400" />
              Informações Profissionais
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4">
              <Switch
                id="requiresCnh"
                checked={!!formData.requiresCnh}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresCnh: checked, cnhCategory: checked ? prev.cnhCategory : '' }))}
              />
              <Label htmlFor="requiresCnh" className="text-sm sm:text-base text-white font-medium">Possui CNH?</Label>
            </div>
            {formData.requiresCnh && (
              <div className="mb-4 space-y-2">
                <Label htmlFor="cnhCategory" className="text-sm sm:text-base text-white font-medium">Categoria da CNH *</Label>
                <Select
                  value={formData.cnhCategory || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cnhCategory: value }))}
                >
                  <SelectTrigger className="border-gray-600 text-white text-sm sm:text-base" style={{ backgroundColor: '#1a1a1a' }}>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {cnhCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cnhCategory && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.cnhCategory}
                  </p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="educationLevel" className="text-sm sm:text-base text-white font-medium">Nível de Escolaridade</Label>
                <Select value={formData.educationLevel} onValueChange={(value) => handleInputChange('educationLevel', value)}>
                  <SelectTrigger className="border-gray-600 text-white text-sm sm:text-base" style={{ backgroundColor: '#1a1a1a' }}>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experienceYears" className="text-sm sm:text-base text-white font-medium">Anos de Experiência</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experienceYears}
                  onChange={(e) => handleInputChange('experienceYears', parseInt(e.target.value) || 0)}
                  className={`border-gray-600 text-white text-sm sm:text-base ${errors.experienceYears ? 'border-red-500' : ''}`}
                  style={{ backgroundColor: '#1a1a1a' }}
                />
                {errors.experienceYears && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.experienceYears}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPosition" className="text-sm sm:text-base text-white font-medium">Cargo Atual</Label>
                <Input
                  id="currentPosition"
                  value={formData.currentPosition}
                  onChange={(e) => handleInputChange('currentPosition', e.target.value)}
                  className={`border-gray-600 text-white text-sm sm:text-base ${errors.currentPosition ? 'border-red-500' : ''}`}
                  style={{ backgroundColor: '#1a1a1a' }}
                />
                {errors.currentPosition && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.currentPosition}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentCompany" className="text-sm sm:text-base text-white font-medium">Empresa Atual</Label>
                <Input
                  id="currentCompany"
                  value={formData.currentCompany}
                  onChange={(e) => handleInputChange('currentCompany', e.target.value)}
                  className={`border-gray-600 text-white text-sm sm:text-base ${errors.currentCompany ? 'border-red-500' : ''}`}
                  style={{ backgroundColor: '#1a1a1a' }}
                />
                {errors.currentCompany && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.currentCompany}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedSalary" className="text-sm sm:text-base text-white font-medium">Pretensão Salarial (R$)</Label>
                <Input
                  id="expectedSalary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.expectedSalary}
                  onChange={(e) => handleInputChange('expectedSalary', parseFloat(e.target.value) || 0)}
                  className={`border-gray-600 text-white text-sm sm:text-base ${errors.expectedSalary ? 'border-red-500' : ''}`}
                  style={{ backgroundColor: '#1a1a1a' }}
                />
                {errors.expectedSalary && (
                  <p className="text-red-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.expectedSalary}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability" className="text-sm sm:text-base text-white font-medium">Disponibilidade</Label>
                <Select value={formData.availability} onValueChange={(value) => handleInputChange('availability', value)}>
                  <SelectTrigger className="border-gray-600 text-white text-sm sm:text-base" style={{ backgroundColor: '#1a1a1a' }}>
                    <SelectValue placeholder="Selecione a disponibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {availabilityOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Upload do Currículo */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-white border-b border-gray-600 pb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-400" />
              Currículo
            </h3>
            
            <div className={`border-2 border-dashed rounded-lg p-3 sm:p-6 text-center ${
              errors.curriculum ? 'border-red-500' : 'border-gray-600'
            }`}>
              <input
                type="file"
                id="curriculum"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="curriculum" className="cursor-pointer">
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  <div className="text-white">
                    <span className="text-sm sm:text-base font-medium">Clique para fazer upload</span>
                    <p className="text-xs sm:text-sm text-gray-400">
                      PDF ou Word (máx. 2MB)
                    </p>
                  </div>
                </div>
              </label>
              
              {curriculumFile && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-green-400">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">{curriculumFile.name}</span>
                </div>
              )}

              {errors.curriculum && (
                <p className="text-red-400 text-xs sm:text-sm mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.curriculum}
                </p>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-gray-600 text-white hover:bg-gray-700 text-sm sm:text-base px-4 py-2 h-auto w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || recaptchaLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base px-4 py-2 h-auto w-full sm:w-auto order-1 sm:order-2"
            >
              {isLoading || recaptchaLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Candidatura'
              )}
            </Button>
          </div>

          {/* Security notice */}
          <div className="text-xs text-gray-400 text-center border-t border-gray-600 pt-4">
            <p>🔒 Este formulário é protegido por reCAPTCHA e possui validações de segurança.</p>
            <p>Seus dados são tratados conforme a LGPD e utilizados apenas para esta candidatura.</p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 