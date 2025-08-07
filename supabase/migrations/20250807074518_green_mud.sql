/*
  # Criar tabela de leads para rastreamento

  1. Nova Tabela
    - `leads`
      - `id` (uuid, primary key)
      - `nome_completo` (text, required)
      - `cpf` (text, unique, required)
      - `email` (text, optional)
      - `telefone` (text, optional)
      - `endereco` (text, optional)
      - `produtos` (jsonb, array de produtos)
      - `valor_total` (numeric, valor da compra)
      - `meio_pagamento` (text, método de pagamento)
      - `origem` (text, origem do lead)
      - `etapa_atual` (integer, etapa atual do rastreamento)
      - `status_pagamento` (text, status do pagamento)
      - `order_bumps` (jsonb, order bumps comprados)
      - `data_compra` (timestamptz, data da compra)
      - `created_at` (timestamptz, data de criação)
      - `updated_at` (timestamptz, data de atualização)

  2. Segurança
    - Habilitar RLS na tabela `leads`
    - Adicionar política para permitir operações públicas (para o sistema de rastreamento)
*/

-- Criar tabela de leads
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  cpf text UNIQUE NOT NULL,
  email text,
  telefone text,
  endereco text,
  produtos jsonb DEFAULT '[]'::jsonb,
  valor_total numeric DEFAULT 67.90,
  meio_pagamento text DEFAULT 'PIX',
  origem text DEFAULT 'direto',
  etapa_atual integer DEFAULT 1,
  status_pagamento text DEFAULT 'pendente',
  order_bumps jsonb DEFAULT '[]'::jsonb,
  data_compra timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (sistema público de rastreamento)
CREATE POLICY "Permitir todas as operações na tabela leads"
  ON leads
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_leads_cpf ON leads(cpf);
CREATE INDEX IF NOT EXISTS idx_leads_etapa_atual ON leads(etapa_atual);
CREATE INDEX IF NOT EXISTS idx_leads_status_pagamento ON leads(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_leads_updated_at 
    BEFORE UPDATE ON leads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();