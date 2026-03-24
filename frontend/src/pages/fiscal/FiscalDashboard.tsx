import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, RefreshCw, Filter, Search, FileDown, Database } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import fiscalService, { FiscalDocument } from '@/services/fiscalService';
import { FiscalDocumentsTable } from '@/components/fiscal/FiscalDocumentsTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

const FiscalDashboard: React.FC = () => {
    const [selectedDoc, setSelectedDoc] = useState<FiscalDocument | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: documents = [], isLoading, refetch } = useQuery({
        queryKey: ['fiscalDocuments'],
        queryFn: fiscalService.findAll
    });

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            await fiscalService.upload(file);
            toast({ title: "Arquivo enviado!", description: "O documento fiscal será processado em instantes." });
            refetch();
        } catch (error) {
            toast({ title: "Erro no upload", variant: "destructive" });
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <StandardLayout title="Gestão Fiscal" subtitle="Controle de documentos fiscais (NF-e, CT-e, NFS-e) e impostos">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
                        <Card className="bg-seguranca-graphite border-gray-600 min-w-[200px]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total em Documentos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-seguranca-yellow">
                                    {documents.reduce((acc, d) => acc + d.totalAmount, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-seguranca-graphite border-gray-600 min-w-[150px]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Processados (Mês)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-blue-400">{documents.length}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className="flex-1 md:flex-none border-gray-600 text-gray-400 hover:bg-gray-700"
                            onClick={() => refetch()}
                        >
                            <RefreshCw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                        <div className="relative flex-1 md:flex-none">
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                accept=".xml,.pdf"
                            />
                            <Button className="w-full bg-seguranca-red hover:bg-seguranca-darkred shadow-lg shadow-red-900/20">
                                <Upload size={18} className="mr-2" />
                                Importar XML/PDF
                            </Button>
                        </div>
                    </div>
                </div>

                <Card className="bg-seguranca-graphite border-gray-600 overflow-hidden">
                    <CardHeader className="border-b border-gray-600/50 bg-seguranca-black/20 flex flex-row items-center justify-between">
                        <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                            <Database className="mr-2 text-seguranca-yellow" size={20} />
                            Documentos Fiscais Recebidos
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <Filter size={16} className="mr-2" /> Filtrar
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                <FileDown size={16} className="mr-2" /> Exportar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <FiscalDocumentsTable
                            data={documents}
                            onView={(doc) => setSelectedDoc(doc)}
                            onDelete={async (doc) => {
                                if (confirm(`Excluir documento ${doc.number}?`)) {
                                    await fiscalService.delete(doc.id);
                                    refetch();
                                }
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        </StandardLayout>
    );
};

export default FiscalDashboard;
