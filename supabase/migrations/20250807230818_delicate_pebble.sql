/*
  # Create leads table

  1. New Tables
    - `leads`
      - `id` (uuid, primary key)
      - `nome_completo` (text, required)
      - `cpf` (text, unique, required)
      - `email` (text)
      - `telefone` (text)
      - `produto` (jsonb, stores product details)
      - `valor_total` (numeric)
      - `endereco` (text)
      - `numero` (text)
      - `complemento` (text)
      - `bairro` (text)
      - `cep` (text)
      - `cidade` (text)
      - `estado` (text)
      - `pais` (text, default 'BR')
      - `etapa_atual` (integer, default 11)
      - `status_pagamento` (text, default 'pendente')
      - `origem` (text)
      - `meio_pagamento` (text)
      - `order_bumps` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `leads` table
    - Add policies for anonymous and authenticated users
    
  3. Triggers
    - Auto-update `updated_at` timestamp on row updates
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nome_completo TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    email TEXT,
    telefone TEXT,
    produto JSONB,
    valor_total NUMERIC DEFAULT 67.90,
    endereco TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cep TEXT,
    cidade TEXT,
    estado TEXT,
    pais TEXT DEFAULT 'BR',
    etapa_atual INTEGER DEFAULT 11,
    status_pagamento TEXT DEFAULT 'pendente',
    origem TEXT,
    meio_pagamento TEXT,
    order_bumps JSONB
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous users (needed for webhooks and admin panel)
CREATE POLICY "Allow anonymous insert on leads"
    ON public.leads
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow anonymous select on leads"
    ON public.leads
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow anonymous update on leads"
    ON public.leads
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anonymous delete on leads"
    ON public.leads
    FOR DELETE
    TO anon
    USING (true);

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated all operations on leads"
    ON public.leads
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Function to update updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before each update
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();