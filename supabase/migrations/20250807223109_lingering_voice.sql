/*
  # Adicionar políticas RLS para tabela logr

  1. Políticas de Segurança
    - Permitir inserção para usuários anônimos (webhooks e painel admin)
    - Permitir leitura para usuários anônimos e autenticados
    - Permitir atualização para usuários autenticados
    - Permitir exclusão para usuários autenticados

  2. Observações
    - A tabela logr já tem RLS habilitado
    - Adicionando políticas para permitir operações CRUD necessárias
*/

-- Política para permitir inserção (anônimos e autenticados)
CREATE POLICY "Allow insert for anon and authenticated users on logr"
  ON logr
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política para permitir leitura (anônimos e autenticados)
CREATE POLICY "Allow select for anon and authenticated users on logr"
  ON logr
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política para permitir atualização (apenas autenticados)
CREATE POLICY "Allow update for authenticated users on logr"
  ON logr
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para permitir exclusão (apenas autenticados)
CREATE POLICY "Allow delete for authenticated users on logr"
  ON logr
  FOR DELETE
  TO authenticated
  USING (true);