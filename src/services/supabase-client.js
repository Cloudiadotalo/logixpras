/**
 * Cliente Supabase configurado - Agrupador de transações
 */
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase usando variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zxizvckmvgrvhduhprfd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4aXp2Y2ttdmdydmhkdWhwcmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NDE3NDMsImV4cCI6MjA3MDExNzc0M30.rYD2KCL49QZLRyMa9a72EBNHvl94dSrp-W5IKyiTlNM';

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
});

// Verificar configuração
console.log('🔗 Supabase configurado:', {
  url: supabaseUrl,
  keyConfigured: !!supabaseAnonKey,
  project: 'Agrupador de transações'
});

// Função para testar conexão
export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro no teste de conexão:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Conexão com Supabase OK');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erro crítico no teste:', error);
    return { success: false, error: error.message };
  }
}

// Exportar configurações para uso em outros módulos
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  project: 'Agrupador de transações'
};