/*
  # Create leads table for tracking system

  1. New Tables
    - `leads`
      - `id` (uuid, primary key)
      - `nome_completo` (text, required)
      - `cpf` (text, unique, required)
      - `email` (text, optional)
      - `telefone` (text, optional)
      - `endereco` (text, optional)
      - `valor_total` (numeric, default 67.90)
      - `meio_pagamento` (text, default 'PIX')
      - `origem` (text, default 'direto')
      - `produtos` (jsonb, default [])
      - `order_bumps` (jsonb, default [])
      - `etapa_atual` (integer, default 1)
      - `status_pagamento` (text, default 'pendente')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `leads` table
    - Add policies for anonymous and authenticated users
    - Add indexes for performance

  3. Triggers
    - Auto-update `updated_at` column on changes
*/

-- Create the leads table
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

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous users (for webhook and public access)
CREATE POLICY "Allow anonymous insert for leads"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select for leads"
  ON leads
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous update for leads"
  ON leads
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated insert for leads"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read all leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update leads"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete leads"
  ON leads
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_cpf ON leads (cpf);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads (updated_at);
CREATE INDEX IF NOT EXISTS idx_leads_etapa_atual ON leads (etapa_atual);
CREATE INDEX IF NOT EXISTS idx_leads_status_pagamento ON leads (status_pagamento);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER IF NOT EXISTS update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();