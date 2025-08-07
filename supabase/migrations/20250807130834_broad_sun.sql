/*
  # Criar tabela de leads para sistema de rastreamento

  1. Nova Tabela
    - `leads`
      - `id` (uuid, chave primária)
      - `nome_completo` (text, nome do cliente)
      - `cpf` (text, CPF único do cliente)
      - `email` (text, email do cliente)
      - `telefone` (text, telefone do cliente)
      - `endereco` (text, endereço completo)
      - `valor_total` (numeric, valor do pedido)
      - `meio_pagamento` (text, forma de pagamento)
      - `origem` (text, origem do lead)
      - `produtos` (jsonb, lista de produtos)
      - `order_bumps` (jsonb, order bumps adicionais)
      - `etapa_atual` (integer, etapa atual do rastreamento)
      - `status_pagamento` (text, status do pagamento)
      - `created_at` (timestamp, data de criação)
      - `updated_at` (timestamp, data de atualização)

  2. Segurança
    - Habilitar RLS na tabela `leads`
    - Adicionar política para usuários autenticados lerem todos os dados
    - Adicionar política para usuários autenticados modificarem todos os dados

  3. Índices
    - Índice único no CPF
    - Índice na etapa atual para consultas rápidas
    - Índice no status de pagamento
*/

-- Criar tabela leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  cpf text UNIQUE NOT NULL,
  email text,
  telefone text,
  endereco text,
  valor_total numeric DEFAULT 67.90,
  meio_pagamento text DEFAULT 'PIX',
  origem text DEFAULT 'direto',
  produtos jsonb DEFAULT '[]'::jsonb,
  order_bumps jsonb DEFAULT '[]'::jsonb,
  etapa_atual integer DEFAULT 1,
  status_pagamento text DEFAULT 'pendente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Política para leitura (usuários autenticados podem ler todos os leads)
CREATE POLICY "Usuários autenticados podem ler leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para inserção (usuários autenticados podem inserir leads)
CREATE POLICY "Usuários autenticados podem inserir leads"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para atualização (usuários autenticados podem atualizar leads)
CREATE POLICY "Usuários autenticados podem atualizar leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para exclusão (usuários autenticados podem excluir leads)
CREATE POLICY "Usuários autenticados podem excluir leads"
  ON leads
  FOR DELETE
  TO authenticated
  USING (true);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_cpf ON leads(cpf);
CREATE INDEX IF NOT EXISTS idx_leads_etapa_atual ON leads(etapa_atual);
CREATE INDEX IF NOT EXISTS idx_leads_status_pagamento ON leads(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_leads_updated_at'
  ) THEN
    CREATE TRIGGER update_leads_updated_at
      BEFORE UPDATE ON leads
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;