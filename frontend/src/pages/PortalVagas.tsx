import React from 'react';
import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  ArrowRight,
  Mail,
  Phone,
  Building,
  Calendar,
  FileText,
  Send,
  CheckCircle,
  Star,
  Instagram,
  Facebook,
  MessageCircle
} from 'lucide-react';
import Logo from '@/components/Logo';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useAOS } from '@/hooks/use-aos';
import { useToast } from '@/hooks/use-toast';
import { JobVacancy } from '@/types/hr';
import hrService from '@/services/hrService';
import { candidateService } from '@/services/candidateService';
import { CandidateFormData } from '@/types/candidate';
import { DatePicker } from "@/components/ui/date-picker";

const PortalVagas = () => {
  const aos = useAOS();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobVacancy[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    city: '',
    experience: '',
    motivation: '',
    requiresCnh: false,
    cnhCategory: '',
    curriculum: undefined as File | undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [talentForm, setTalentForm] = useState<Partial<CandidateFormData>>({});
  const [talentFile, setTalentFile] = useState<File | null>(null);
  const [talentLoading, setTalentLoading] = useState(false);

  useEffect(() => {
    loadVacancies();
  }, []);

  const loadVacancies = async () => {
    try {
      setLoading(true);
      console.log('🔍 PortalVagas: Carregando vagas...');
      const vacancies = await hrService.getPublicJobVacancies();
      console.log('🔍 PortalVagas: Vagas carregadas:', vacancies);
      console.log('🔍 PortalVagas: Quantidade de vagas:', vacancies.length);
      setJobs(vacancies);
    } catch (error) {
      console.error('❌ PortalVagas: Erro ao carregar vagas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar vagas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (jobId: string) => {
    console.log('[DEBUG] Candidatura pública aberta para jobId:', jobId);
    setSelectedJob(jobId);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validação CNH
    if (formData.requiresCnh && !formData.cnhCategory) {
      toast({
        title: 'Erro',
        description: 'Se você possui CNH, a categoria é obrigatória.',
        variant: 'destructive'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      if (selectedJob) {
        // Registrar candidatura no backend
        // Montar dados para o backend
        const candidateData = {
          jobVacancyId: selectedJob,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          cpf: formData.cpf,
          address: '',
          city: formData.city,
          state: '',
          educationLevel: '',
          experienceYears: 0,
          currentPosition: '',
          currentCompany: '',
          expectedSalary: 0,
          availability: '',
          curriculum: formData.curriculum,
          requiresCnh: formData.requiresCnh,
          cnhCategory: formData.requiresCnh ? formData.cnhCategory : '',
        };
        await candidateService.createCandidate(candidateData);
        
        // Simulação de envio do formulário
        console.log('Form data submitted:', formData);
        
        toast({
          title: "Sucesso",
          description: "Candidatura enviada com sucesso! Entraremos em contato em breve."
        });
        
        setIsModalOpen(false);
        setShowForm(false);
        setSelectedJob(null);
        resetForm();
        
        // Recarregar vagas para atualizar o contador
        await loadVacancies();
      }
    } catch (error: any) {
      // Tratamento para limite de candidaturas
      if (error.response?.status === 429) {
        toast({
          title: 'Limite de candidaturas atingido',
          description: 'Você atingiu o limite de 3 candidaturas por hora. Tente novamente em 1 hora.',
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      }
      // Tratamento para duplicidade de candidatura
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Erro ao enviar candidatura';
      let userMessage = errorMessage;
      if (errorMessage.includes('Já existe uma candidatura com este CPF ou email')) {
        userMessage = 'Você já se candidatou para esta vaga com este CPF ou e-mail. Caso queira atualizar seus dados, entre em contato com o RH.';
      }
      toast({
        title: 'Erro',
        description: userMessage,
        variant: 'destructive'
      });
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      cpf: '',
      city: '',
      experience: '',
      motivation: '',
      requiresCnh: false,
      cnhCategory: '',
      curriculum: undefined,
    });
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(salary);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleTalentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTalentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTalentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTalentFile(e.target.files[0]);
    }
  };

  const handleTalentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTalentLoading(true);
    try {
      const formData: CandidateFormData = {
        jobVacancyId: '', // banco de talentos
        name: talentForm.name || '',
        email: talentForm.email || '',
        phone: talentForm.phone || '',
        cpf: '',
        address: '',
        city: talentForm.city || '',
        state: '',
        educationLevel: '',
        experienceYears: 0,
        currentPosition: talentForm.currentPosition || '',
        currentCompany: '',
        expectedSalary: 0,
        availability: '',
        curriculum: talentFile || undefined,
      };
      await candidateService.createCandidate(formData);
      toast({ title: 'Sucesso', description: 'Cadastro enviado para o banco de talentos!', variant: 'default' });
      setTalentForm({});
      setTalentFile(null);
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao enviar cadastro.', variant: 'destructive' });
    } finally {
      setTalentLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, curriculum: e.target.files![0] }));
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>
      <Navbar />

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4" style={{ backgroundColor: '#292929' }}>
        <div className="container mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6" data-aos={aos.fadeUp}>
            Trabalhe Conosco
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto" data-aos={aos.fadeUp} data-aos-delay="200">
            Faça parte de uma empresa que valoriza seus colaboradores e oferece 
            oportunidades de crescimento profissional.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 text-gray-300" data-aos={aos.fadeUp} data-aos-delay="400">
            <div className="flex items-center">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="text-sm sm:text-base">Equipe Qualificada</span>
            </div>
            <div className="flex items-center">
              <Building className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="text-sm sm:text-base">Ambiente Profissional</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="text-sm sm:text-base">Oportunidades de Crescimento</span>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-aos={aos.fadeUp}>Vagas Disponíveis</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300" data-aos={aos.fadeUp} data-aos-delay="200">
              Encontre a oportunidade perfeita para sua carreira profissional.
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-400 mt-4">Carregando vagas...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 sm:py-20">
              <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-400 mb-2">Nenhuma vaga disponível</h3>
              <p className="text-sm sm:text-base text-gray-500">No momento não temos vagas abertas. Volte em breve!</p>
              <p className="text-xs text-gray-600 mt-2">Debug: jobs.length = {jobs.length}</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-8 gap-x-6 justify-items-center w-full max-w-7xl mx-auto">
                  {jobs.map((job, index) => (
                    <Card key={job.id} className="hover:bg-gray-800 transition-all duration-300 border-0 shadow-lg border-gray-700 w-full max-w-xs sm:max-w-sm" 
                          style={{ backgroundColor: '#292929' }}
                          data-aos={aos.fadeUp} data-aos-delay={index * 150}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base sm:text-lg text-white">{job.title}</CardTitle>
                            <p className="text-xs sm:text-sm text-gray-400">{job.location}</p>
                          </div>
                          <Badge className="bg-red-600 text-white text-xs sm:text-sm">{job.workSchedule}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="text-sm sm:text-base">
                        {/* <p className="text-gray-300 mb-4">{job.function}</p> */}
                        <div className="space-y-2 mb-4">
                          <h4 className="text-white font-semibold">Requisitos:</h4>
                          <ul className="text-gray-300 text-xs sm:text-sm space-y-1">
                            {job.requirements.slice(0, 3).map((req, idx) => (
                              <li key={idx} className="flex items-center">
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mr-2" />
                                {req}
                              </li>
                            ))}
                            {job.requirements.length > 3 && (
                              <li className="text-gray-400 text-xs sm:text-sm">
                                +{job.requirements.length - 3} mais requisitos
                              </li>
                            )}
                          </ul>
                        </div>
                        <div className="space-y-2 mb-6">
                          <h4 className="text-white font-semibold">Benefícios:</h4>
                          <ul className="text-gray-300 text-xs sm:text-sm space-y-1">
                            {job.benefits.slice(0, 3).map((benefit, idx) => (
                              <li key={idx} className="flex items-center">
                                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 mr-2" />
                                {benefit}
                              </li>
                            ))}
                            {job.benefits.length > 3 && (
                              <li className="text-gray-400 text-xs sm:text-sm">
                                +{job.benefits.length - 3} mais benefícios
                              </li>
                            )}
                          </ul>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <div className="text-sm sm:text-base text-white font-bold">
                            {formatSalary(job.salary)}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-400">
                            {job.applications} candidatos
                          </div>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-400 mb-4">
                          Prazo: {formatDate(job.deadline)}
                        </div>
                        <Button 
                          className="w-full bg-red-600 hover:bg-red-700"
                          onClick={() => handleApply(job.id)}
                        >
                          Candidatar-se
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Application Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[90vh] overflow-y-auto border-gray-700 px-4 py-6 sm:p-6 md:p-8" style={{ backgroundColor: '#292929' }}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl text-white">
              Candidatura para {selectedJob !== null ? jobs.find(j => j.id === selectedJob)?.title : 'Vaga'}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-300">
              Preencha os dados abaixo para se candidatar à vaga.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="w-full">
                <Label htmlFor="name" className="text-white text-sm sm:text-base">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="border-gray-600 text-white w-full text-sm sm:text-base"
                  style={{ backgroundColor: '#1a1a1a' }}
                  required
                />
              </div>
              <div className="w-full">
                <Label htmlFor="email" className="text-white text-sm sm:text-base">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="border-gray-600 text-white w-full text-sm sm:text-base"
                  style={{ backgroundColor: '#1a1a1a' }}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="w-full">
                <Label htmlFor="cpf" className="text-white text-sm sm:text-base">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                  className="border-gray-600 text-white w-full text-sm sm:text-base"
                  style={{ backgroundColor: '#1a1a1a' }}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
              <div className="w-full">
                <Label htmlFor="phone" className="text-white text-sm sm:text-base">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="border-gray-600 text-white w-full text-sm sm:text-base"
                  style={{ backgroundColor: '#1a1a1a' }}
                  required
                />
              </div>
            </div>
            <div className="w-full">
              <Label htmlFor="city" className="text-white text-sm sm:text-base">Cidade *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="border-gray-600 text-white w-full text-sm sm:text-base"
                style={{ backgroundColor: '#1a1a1a' }}
                required
              />
            </div>
            {/* CNH */}
            <div className="flex items-center gap-2 mb-2 mt-2">
              <Switch
                id="requiresCnh"
                checked={!!formData.requiresCnh}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresCnh: checked, cnhCategory: checked ? prev.cnhCategory : '' }))}
              />
              <Label htmlFor="requiresCnh" className="text-white text-sm sm:text-base">Possui CNH?</Label>
            </div>
            {formData.requiresCnh && (
              <div className="mb-2 w-full">
                <Label htmlFor="cnhCategory" className="text-white text-sm sm:text-base">Categoria da CNH *</Label>
                <Input
                  id="cnhCategory"
                  value={formData.cnhCategory || ''}
                  onChange={e => setFormData({ ...formData, cnhCategory: e.target.value })}
                  className="border-gray-600 text-white w-full text-sm sm:text-base"
                  style={{ backgroundColor: '#1a1a1a' }}
                  placeholder="Ex: A, B, AB, C, D, E"
                  required={formData.requiresCnh}
                />
              </div>
            )}
            <div className="w-full">
              <Label htmlFor="experience" className="text-white text-sm sm:text-base">Experiência Profissional</Label>
              <Textarea
                id="experience"
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                className="border-gray-600 text-white w-full text-sm sm:text-base"
                style={{ backgroundColor: '#1a1a1a' }}
                rows={3}
                placeholder="Descreva sua experiência profissional relevante..."
              />
            </div>
            <div className="w-full">
              <Label htmlFor="motivation" className="text-white text-sm sm:text-base">Motivação *</Label>
              <Textarea
                id="motivation"
                value={formData.motivation}
                onChange={(e) => setFormData({...formData, motivation: e.target.value})}
                className="border-gray-600 text-white w-full text-sm sm:text-base"
                style={{ backgroundColor: '#1a1a1a' }}
                rows={4}
                placeholder="Por que você gostaria de trabalhar conosco?"
                required
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 w-full mt-6">
              <div className="w-full sm:w-auto">
                <Label htmlFor="curriculum" className="text-white text-sm sm:text-base">Anexar Currículo (PDF/Word)</Label>
                <Input
                  id="curriculum"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="border-gray-600 text-white bg-[#1a1a1a] w-full text-sm sm:text-base"
                />
                {formData.curriculum && (
                  <div className="text-gray-400 text-xs mt-1">{formData.curriculum.name}</div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black w-full sm:w-auto text-sm sm:text-base"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 w-full sm:w-auto text-sm sm:text-base"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Candidatura
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Why Work With Us Section */}
      <section className="py-12 sm:py-20 px-4" style={{ backgroundColor: '#292929' }}>
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-aos={aos.fadeUp}>Por Que Trabalhar na Promover?</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300" data-aos={aos.fadeUp} data-aos-delay="200">
              Descubra os benefícios de fazer parte da nossa equipe
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <Card className="text-center border-0 shadow-md hover:bg-gray-800 transition-all duration-300" 
                  style={{ backgroundColor: '#1a1a1a' }}
                  data-aos={aos.fadeUp} data-aos-delay="100">
              <CardContent className="p-4 sm:p-6">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-2 sm:mb-4" />
                <h3 className="text-base sm:text-xl font-semibold text-white mb-2">Equipe Qualificada</h3>
                <p className="text-sm sm:text-base text-gray-300">
                  Trabalhe com profissionais experientes e receba treinamento contínuo
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-md hover:bg-gray-800 transition-all duration-300" 
                  style={{ backgroundColor: '#1a1a1a' }}
                  data-aos={aos.fadeUp} data-aos-delay="200">
              <CardContent className="p-4 sm:p-6">
                <Building className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-2 sm:mb-4" />
                <h3 className="text-base sm:text-xl font-semibold text-white mb-2">Ambiente Profissional</h3>
                <p className="text-sm sm:text-base text-gray-300">
                  Estrutura organizacional sólida e ambiente de trabalho respeitoso
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-0 shadow-md hover:bg-gray-800 transition-all duration-300" 
                  style={{ backgroundColor: '#1a1a1a' }}
                  data-aos={aos.fadeUp} data-aos-delay="300">
              <CardContent className="p-4 sm:p-6">
                <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-2 sm:mb-4" />
                <h3 className="text-base sm:text-xl font-semibold text-white mb-2">Crescimento</h3>
                <p className="text-sm sm:text-base text-gray-300">
                  Oportunidades de desenvolvimento e progressão na carreira
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 sm:py-20 px-4" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Dúvidas sobre Vagas?</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300">
              Entre em contato conosco para mais informações
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">Banco de Talentos</h3>
              <form onSubmit={handleTalentSubmit} className="space-y-4 bg-gray-900 p-6 rounded-lg shadow-md">
                <div>
                  <label className="block text-white mb-1 text-sm sm:text-base">Nome *</label>
                  <input type="text" name="name" value={talentForm.name || ''} onChange={handleTalentChange} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 text-sm sm:text-base" required />
                </div>
                <div>
                  <label className="block text-white mb-1 text-sm sm:text-base">E-mail *</label>
                  <input type="email" name="email" value={talentForm.email || ''} onChange={handleTalentChange} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 text-sm sm:text-base" required />
                </div>
                <div>
                  <label className="block text-white mb-1 text-sm sm:text-base">Telefone *</label>
                  <input type="text" name="phone" value={talentForm.phone || ''} onChange={handleTalentChange} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 text-sm sm:text-base" required />
                </div>
                <div>
                  <label className="block text-white mb-1 text-sm sm:text-base">Cidade *</label>
                  <input type="text" name="city" value={talentForm.city || ''} onChange={handleTalentChange} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 text-sm sm:text-base" required />
                </div>
                <div>
                  <label className="block text-white mb-1 text-sm sm:text-base">Área de Interesse / Cargo *</label>
                  <input type="text" name="currentPosition" value={talentForm.currentPosition || ''} onChange={handleTalentChange} className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 text-sm sm:text-base" required />
                </div>
                <div>
                  <label className="block text-white mb-1 text-sm sm:text-base">Currículo (PDF/Word)</label>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleTalentFile} className="w-full text-white text-sm sm:text-base" />
                </div>
                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded text-sm sm:text-base" disabled={talentLoading}>
                  {talentLoading ? 'Enviando...' : 'Enviar Cadastro'}
                </button>
              </form>
            </div>
            
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Dúvidas Frequentes</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h4 className="font-semibold text-white text-base sm:text-lg">Como enviar meu currículo?</h4>
                  <p className="text-gray-300 text-sm sm:text-base">
                    Envie seu currículo para recrutamentopromover@gmail.com com o assunto "Candidatura - [Nome da Vaga]"
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-base sm:text-lg">Qual o formato aceito?</h4>
                  <p className="text-gray-300 text-sm sm:text-base">
                    Aceitamos currículos em formato PDF ou Word (.doc, .docx)
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-base sm:text-lg">Quanto tempo leva o processo?</h4>
                  <p className="text-gray-300 text-sm sm:text-base">
                    O processo seletivo pode levar de 7 a 15 dias úteis para análise inicial
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 border-t border-gray-700" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="container mx-auto">
          {/* Primeira linha - Logo e Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mb-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                <Logo size="lg" type="full" />
              </div>
              <p className="text-sm sm:text-base lg:text-lg text-gray-300 mb-4 sm:mb-6 leading-relaxed">
                Segurança patrimonial de qualidade para sua tranquilidade.
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
                <a href="tel:+553125591245" className="text-gray-400 hover:text-white transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Telefone">
                  <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
                </a>
                <a href="https://www.instagram.com/promover.vigilancia" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Instagram">
                  <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
                </a>
                <a href="https://www.facebook.com/promover.vigilanciapatrimonial" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-500 transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Facebook">
                  <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
                </a>
                <a href="https://maps.google.com/?q=Rua+Cel.+João+Camargos,+267+Centro+Contagem+MG" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors p-2 sm:p-3 rounded-lg hover:bg-gray-800" title="Localização">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-4 sm:mb-6">Serviços</h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base lg:text-lg text-gray-300">
                <li><a href="/servicos" className="hover:text-white transition-colors block py-1">Vigilância Patrimonial</a></li>
                <li><a href="/servicos" className="hover:text-white transition-colors block py-1">Portaria</a></li>
                <li><a href="/servicos" className="hover:text-white transition-colors block py-1">Controlador de Acesso</a></li>
                <li><a href="/servicos" className="hover:text-white transition-colors block py-1">Facilities</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-4 sm:mb-6">Empresa</h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base lg:text-lg text-gray-300">
                <li><a href="/quem-somos" className="hover:text-white transition-colors block py-1">Quem Somos</a></li>
                <li><a href="/trabalhe-conosco" className="hover:text-white transition-colors block py-1">Trabalhe Conosco</a></li>
                <li><a href="/servicos" className="hover:text-white transition-colors block py-1">Orçamento</a></li>
                <li><a href="/contato" className="hover:text-white transition-colors block py-1">Contato</a></li>
                <li className="mt-3 sm:mt-4">
                  <a href="/login" className="inline-block text-black hover:text-gray-800 px-3 py-2 sm:px-4 sm:py-2 rounded text-sm sm:text-base font-medium transition-colors" style={{ backgroundColor: '#FFF600' }}>
                    Área Administrativa
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-4 sm:mb-6">Legal</h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base lg:text-lg text-gray-300">
                <li><a href="/politicas-privacidade" className="hover:text-white transition-colors block py-1">Política de Privacidade</a></li>
                <li><a href="/termos-condicoes" className="hover:text-white transition-colors block py-1">Termos e Condições</a></li>
                <li><a href="#" className="hover:text-white transition-colors block py-1">Cookies</a></li>
              </ul>
            </div>
          </div>

          {/* Segunda linha - Contatos centralizados em 2 colunas */}
          <div className="flex justify-center">
            <div className="w-full max-w-5xl">
              <h3 className="text-center text-xl sm:text-2xl lg:text-3xl font-semibold text-white mb-6 sm:mb-8">Contatos</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                {/* Sede Contagem */}
                <div className="bg-gray-800/50 rounded-xl p-6 sm:p-8 border border-gray-700 hover:border-gray-600 transition-colors">
                  <h4 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center">
                    <Building className="h-6 w-6 mr-3" />
                    Sede – Contagem/MG
                  </h4>
                  <div className="space-y-4 text-sm sm:text-base text-gray-300">
                    <p className="flex items-start">
                      <MapPin className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">Rua Cel. João Camargos, 267<br />Centro – Contagem – MG</span>
                    </p>
                    <p className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 flex-shrink-0" />
                      <a href="tel:+553125591245" className="hover:text-white transition-colors font-medium">(31) 2559-1245</a>
                    </p>
                    <p className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 flex-shrink-0" />
                      <a href="tel:+5531971303587" className="hover:text-white transition-colors font-medium">(31) 97130-3587</a>
                    </p>
                    <p className="flex items-center">
                      <Mail className="h-5 w-5 mr-3 flex-shrink-0" />
                      <a href="mailto:recrutamentopromover@gmail.com" className="hover:text-white transition-colors text-xs sm:text-sm break-all">recrutamentopromover@gmail.com</a>
                    </p>
                  </div>
                </div>
                
                {/* Base Operacional Uberlândia */}
                <div className="bg-gray-800/50 rounded-xl p-6 sm:p-8 border border-gray-700 hover:border-gray-600 transition-colors">
                  <h4 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6 flex items-center">
                    <Building className="h-6 w-6 mr-3" />
                    Base Operacional – Uberlândia/MG
                  </h4>
                  <div className="space-y-4 text-sm sm:text-base text-gray-300">
                    <p className="flex items-start">
                      <MapPin className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">Rua Jerônimo Martins Nascimento, 1.286<br />Bairro Nossa Senhora Aparecida – Uberlândia/MG</span>
                    </p>
                    <p className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 flex-shrink-0" />
                      <a href="tel:+553432192604" className="hover:text-white transition-colors font-medium">(34) 3219-2604</a>
                    </p>
                    <p className="flex items-center">
                      <MessageCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                      <a href="https://wa.me/5531996868810" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors font-medium">
                        (31) 9968-68810 (WhatsApp)
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-6 pt-6 text-center text-gray-400">
            <p className="text-xs sm:text-sm">&copy; 2025 Promover Vigilância Patrimonial. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PortalVagas;