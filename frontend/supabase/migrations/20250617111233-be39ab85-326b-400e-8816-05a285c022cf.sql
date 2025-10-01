
-- Criar tabela para filiais
CREATE TABLE public.filiais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT NOT NULL,
  cidade TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  responsavel TEXT NOT NULL,
  funcionarios INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso (permitir todas as operações para usuários autenticados)
CREATE POLICY "Usuários autenticados podem visualizar filiais" 
  ON public.filiais 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Usuários autenticados podem criar filiais" 
  ON public.filiais 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar filiais" 
  ON public.filiais 
  FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar filiais" 
  ON public.filiais 
  FOR DELETE 
  TO authenticated 
  USING (true);
