import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, FileCheck2, Users, ArrowUpRight, MapPinned } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const sections = [
  {
    value: 'turismo',
    title: 'Transporte Turístico',
    description: 'Organize viagens, escalas, veículos, motoristas e operação de fretamento turístico.',
    icon: Bus,
    links: [
      { label: 'Gestão de viagens e fretamentos', path: '/fretamento/viagens' },
      { label: 'Escalas e viagens', path: '/saosilvestre/escalas' },
      { label: 'Roteirização', path: '/fretamento/rotas' },
    ],
  },
  {
    value: 'passageiros',
    title: 'Listas de Passageiros',
    description: 'Cadastre e consulte passageiros, clientes e listas vinculadas às operações de transporte.',
    icon: Users,
    links: [{ label: 'Abrir gestão de passageiros', path: '/fretamento/passageiros' }],
  },
  {
    value: 'antt',
    title: 'Autorizações ANTT',
    description: 'Consulte e gerencie autorizações, certificados e documentos regulatórios de transporte.',
    icon: FileCheck2,
    links: [{ label: 'Abrir autorizações e certificações', path: '/manutencao/certificacoes-cfme' }],
  },
];

const FretamentosHub: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300"><MapPinned className="h-5 w-5" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Transporte de funcionários, turismo e fretamento</p><h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">Central de Fretamentos</h2><p className="mt-1 max-w-3xl text-sm text-slate-400">Acesse as ferramentas de viagens, passageiros e autorizações a partir de uma área organizada por atividade.</p></div>
        </div>
      </div>
      <Tabs defaultValue="turismo" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-3">
          {sections.map(({ value, title, icon: Icon }) => <TabsTrigger key={value} value={value} className="min-h-12 justify-start gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 text-slate-300 data-[state=active]:border-sky-500/50 data-[state=active]:bg-sky-500/10 data-[state=active]:text-white sm:justify-center"><Icon className="h-4 w-4" />{title}</TabsTrigger>)}
        </TabsList>
        {sections.map(({ value, title, description, icon: Icon, links }) => <TabsContent key={value} value={value}>
          <Card className="border-slate-700 bg-slate-900/70"><CardContent className="p-5 sm:p-6">
            <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sky-300"><Icon className="h-5 w-5" /></div><div><h3 className="font-semibold text-white">{title}</h3><p className="mt-1 text-sm text-slate-400">{description}</p></div></div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">{links.map(({ label, path }) => <Button key={path} onClick={() => navigate(path)} className="justify-between bg-sky-600 text-white hover:bg-sky-500">{label}<ArrowUpRight className="ml-3 h-4 w-4" /></Button>)}</div>
          </CardContent></Card>
        </TabsContent>)}
      </Tabs>
    </div>
  );
};

export default FretamentosHub;
