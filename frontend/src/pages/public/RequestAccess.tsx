import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, ArrowLeft, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const RequestAccess: React.FC = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        companyName: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulação de envio - futuramente conectar com endpoint de solicitação
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsSubmitted(true);
            toast({
                title: "Solicitação enviada!",
                description: "O administrador entrará em contato em breve.",
                variant: 'default' // Changed from 'success' to 'default' as 'success' might not be a valid variant in shadcn/ui toast
            });
        } catch (error) {
            toast({
                title: "Erro ao enviar",
                description: "Tente novamente mais tarde.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="w-full max-w-md shadow-lg border-emerald-100">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-emerald-100 p-3 rounded-full w-fit mb-4">
                            <CheckCircle className="h-10 w-10 text-emerald-600" />
                        </div>
                        <CardTitle className="text-2xl text-emerald-700">Solicitação Recebida!</CardTitle>
                        <CardDescription>
                            Sua solicitação de acesso foi enviada com sucesso para a equipe administrativa da FlexBus.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center text-slate-600 space-y-4">
                        <p>
                            Analisaremos seus dados e entraremos em contato através do email <strong>{formData.email}</strong> ou telefone informado.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center pt-2">
                        <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-amber-500 blur-[120px]" />
                <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-slate-700 blur-[100px]" />
            </div>

            <Card className="w-full max-w-lg shadow-2xl border-slate-800 bg-white/95 backdrop-blur z-10">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                        <span className="text-amber-600 font-bold text-sm uppercase tracking-wider">Acesso Pendente</span>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Solicitar Acesso</CardTitle>
                    <CardDescription className="text-slate-500">
                        Parece que seu usuário não está vinculado a nenhuma empresa. Preencha o formulário abaixo para solicitar o vínculo.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800">
                            <AlertTitle>Atenção</AlertTitle>
                            <AlertDescription>
                                Se você acabou de se cadastrar, aguarde a aprovação do seu gestor ou solicite o vínculo abaixo.
                            </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Seu nome"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Corporativo</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="seu.email@empresa.com.br"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyName">Nome da Empresa</Label>
                            <Input
                                id="companyName"
                                name="companyName"
                                required
                                value={formData.companyName}
                                onChange={handleChange}
                                placeholder="Para qual empresa você trabalha?"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Mensagem (Opcional)</Label>
                            <Textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="Detalhes adicionais, cargo, departamento..."
                                className="resize-none"
                                rows={3}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pt-2">
                        <Button
                            type="submit"
                            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Enviando...' : (
                                <>
                                    <Send className="mr-2 h-4 w-4" /> Enviar Solicitação
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate('/login')}
                            className="w-full text-slate-500"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Login
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default RequestAccess;
