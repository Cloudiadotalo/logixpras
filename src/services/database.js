/**
 * Serviço de banco de dados usando Supabase
 */
import { supabase } from './supabase-client.js';
import { CPFValidator } from '../utils/cpf-validator.js';

export class DatabaseService {
    constructor() {
        this.supabase = supabase;
        console.log('🔗 DatabaseService inicializado com Supabase');
    }

    async createLead(leadData) {
        try {
            console.log('💾 Criando lead no Supabase:', leadData);
            
            const { data, error } = await this.supabase
                .from('leads')
                .insert([{
                    nome_completo: leadData.nome_completo || leadData.nome,
                    cpf: leadData.cpf.replace(/[^\d]/g, ''),
                    email: leadData.email,
                    telefone: leadData.telefone,
                    endereco: leadData.endereco,
                    valor_total: parseFloat(leadData.valor_total || 67.90),
                    meio_pagamento: leadData.meio_pagamento || 'PIX',
                    origem: leadData.origem || 'direto',
                    produtos: leadData.produtos || [],
                    order_bumps: leadData.order_bumps || [],
                    etapa_atual: 1,
                    status_pagamento: 'pendente'
                }])
                .select()
                .single();

            if (error) {
                console.error('❌ Erro ao criar lead:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Lead criado com sucesso:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Erro crítico ao criar lead:', error);
            return { success: false, error: error.message };
        }
    }

    async getLeadByCPF(cpf) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            console.log('🔍 Buscando lead por CPF:', cleanCPF);

            const { data, error } = await this.supabase
                .from('leads')
                .select('*')
                .eq('cpf', cleanCPF)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('📝 Lead não encontrado para CPF:', cleanCPF);
                    return { success: false, error: 'Lead não encontrado' };
                }
                console.error('❌ Erro ao buscar lead:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Lead encontrado:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Erro crítico ao buscar lead:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllLeads() {
        try {
            console.log('📋 Buscando todos os leads...');

            const { data, error } = await this.supabase
                .from('leads')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('❌ Erro ao buscar leads:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Leads encontrados:', data.length);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Erro crítico ao buscar leads:', error);
            return { success: false, error: error.message };
        }
    }

    async updateLeadStage(cpf, newStage) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            console.log('🔄 Atualizando etapa do lead:', cleanCPF, 'para etapa:', newStage);

            const { data, error } = await this.supabase
                .from('leads')
                .update({
                    etapa_atual: newStage,
                    updated_at: new Date().toISOString()
                })
                .eq('cpf', cleanCPF)
                .select()
                .single();

            if (error) {
                console.error('❌ Erro ao atualizar etapa:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Etapa atualizada com sucesso:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Erro crítico ao atualizar etapa:', error);
            return { success: false, error: error.message };
        }
    }

    async updatePaymentStatus(cpf, status) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            console.log('💳 Atualizando status de pagamento:', cleanCPF, 'para:', status);

            const { data, error } = await this.supabase
                .from('leads')
                .update({
                    status_pagamento: status,
                    updated_at: new Date().toISOString()
                })
                .eq('cpf', cleanCPF)
                .select()
                .single();

            if (error) {
                console.error('❌ Erro ao atualizar status de pagamento:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Status de pagamento atualizado:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Erro crítico ao atualizar status:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteLead(cpf) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            console.log('🗑️ Deletando lead:', cleanCPF);

            const { data, error } = await this.supabase
                .from('leads')
                .delete()
                .eq('cpf', cleanCPF)
                .select();

            if (error) {
                console.error('❌ Erro ao deletar lead:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Lead deletado com sucesso:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Erro crítico ao deletar lead:', error);
            return { success: false, error: error.message };
        }
    }

    async testConnection() {
        try {
            console.log('🔍 Testando conexão com Supabase...');
            
            const { data, error } = await this.supabase
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
}

// Re-exportar CPFValidator para compatibilidade
export { CPFValidator } from '../utils/cpf-validator.js';