
-- Atualizar tabela de contratos para incluir notificações
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS notificar_rh BOOLEAN DEFAULT false;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS notificar_dp BOOLEAN DEFAULT false;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS notificar_operacional BOOLEAN DEFAULT false;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Criar tabela para notificações
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE CASCADE,
  departamento TEXT NOT NULL, -- 'rh', 'dp', 'operacional'
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'enviada', 'erro'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS na tabela de notificações
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para notificações
CREATE POLICY "Usuários podem visualizar notificações" 
  ON public.notificacoes 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem inserir notificações" 
  ON public.notificacoes 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar notificações" 
  ON public.notificacoes 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_contrato_id ON public.notificacoes(contrato_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_departamento ON public.notificacoes(departamento);
CREATE INDEX IF NOT EXISTS idx_notificacoes_status ON public.notificacoes(status);
