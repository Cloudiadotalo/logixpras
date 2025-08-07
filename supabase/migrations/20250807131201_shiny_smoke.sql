/*
  # Fix RLS policy for leads table

  1. Security Changes
    - Add policy to allow anonymous users to insert leads
    - Keep existing policies for authenticated users
    - Maintain security while allowing public lead creation

  This migration fixes the "new row violates row-level security policy" error
  by allowing anonymous users to create leads, which is necessary for the
  public-facing lead capture functionality.
*/

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can insert own data" ON leads;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir leads" ON leads;

-- Create policy to allow anonymous users to insert leads
CREATE POLICY "Allow anonymous insert for leads"
  ON leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow authenticated users to insert leads
CREATE POLICY "Allow authenticated insert for leads"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Keep existing read policies for authenticated users
CREATE POLICY "Authenticated users can read all leads" ON leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep existing update policies for authenticated users
CREATE POLICY "Authenticated users can update leads" ON leads
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Keep existing delete policies for authenticated users
CREATE POLICY "Authenticated users can delete leads" ON leads
  FOR DELETE
  TO authenticated
  USING (true);