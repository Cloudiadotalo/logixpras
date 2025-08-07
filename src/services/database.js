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
            
            // Validar dados obrigatórios
            if (!leadData.nome_completo && !leadData.nome) {
                throw new Error('Nome completo é obrigatório');
            }
            
            if (!leadData.cpf) {
                throw new Error('CPF é obrigatório');
            }
            
            // Limpar e validar CPF
            const cpfField = leadData.cpf;
            const cleanCPF = cpfField.toString().replace(/[^\d]/g, '');
            if (cleanCPF.length !== 11) {
                throw new Error(`CPF inválido: ${cleanCPF} (deve ter 11 dígitos)`);
            }
            
            // Preparar dados para inserção
            const dataToInsert = {
                nome_completo: (leadData.nome_completo || leadData.nome).toString().trim(),
                cpf: cleanCPF,
                email: leadData.email || null,
                telefone: leadData.telefone ? leadData.telefone.toString().replace(/[^\d]/g, '') : null,
                produto: leadData.produto || [{ nome: 'Kit 12 caixas organizadoras + brinde', preco: 67.90 }],
                valor_total: parseFloat(leadData.valor_total || leadData.valor || 67.90),
                endereco: leadData.endereco || null,
                numero: leadData.numero || null,
                complemento: leadData.complemento || null,
                bairro: leadData.bairro || null,
                cep: leadData.cep ? leadData.cep.toString().replace(/[^\d]/g, '') : null,
                cidade: leadData.cidade || null,
                estado: leadData.estado || null,
                pais: leadData.pais || 'BR',
                etapa_atual: leadData.etapa_atual || 11,
                status_pagamento: leadData.status_pagamento || 'pendente'
            };
            
            console.log('📝 Dados preparados para inserção:', {
                nome: dataToInsert.nome_completo,
                cpf: dataToInsert.cpf,
                email: dataToInsert.email,
                valor: dataToInsert.valor_total
            });
            
            const { data, error } = await this.supabase
                .from('leads')
                .insert([dataToInsert])
                .select()
                .single();

            if (error) {
                console.error('❌ Erro detalhado ao criar lead:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                    leadData: dataToInsert
                });
                
                // Verificar se é erro de CPF duplicado
                if (error.code === '23505') {
                    return { success: false, error: `CPF ${cleanCPF} já existe no sistema` };
                }
                
                return { success: false, error: `${error.message} (Código: ${error.code})` };
            }

            console.log('✅ Lead criado com sucesso:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Erro crítico ao criar lead:', {
                message: error.message,
                stack: error.stack,
                leadData: leadData
            });
            return { success: false, error: `Erro crítico: ${error.message}` };
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
                .order('nome_completo', { ascending: true });

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

    async getLeadsByStage(stage) {
        try {
            console.log('🔍 Buscando leads por etapa:', stage);

            let query = this.supabase.from('leads').select('*');
            
            // Filtrar por etapa
            if (stage) {
                query = query.eq('etapa_atual', stage);
            }

            const { data, error } = await query;

            if (error) {
                console.error('❌ Erro ao buscar leads por etapa:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Leads encontrados por etapa:', data.length);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Erro crítico ao buscar leads por etapa:', error);
            return { success: false, error: error.message };
        }
    }

    async updateLeadStage(cpf, newStage) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            console.log('🔄 Tentando atualizar etapa do lead:', cleanCPF, 'para etapa:', newStage);

            const { data, error } = await this.supabase
                .from('leads')
                .update({ etapa_atual: newStage, updated_at: new Date().toISOString() })
                .eq('cpf', cleanCPF)
                .select();

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
            console.log('💳 Tentando atualizar status de pagamento:', cleanCPF, 'para:', status);

            const { data, error } = await this.supabase
                .from('leads')
                .update({ status_pagamento: status, updated_at: new Date().toISOString() })
                .eq('cpf', cleanCPF)
                .select();

            if (error) {
                console.error('❌ Erro ao atualizar status:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Status atualizado com sucesso:', data);
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
                .select('*')
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