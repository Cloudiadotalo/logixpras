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
            // Validar parâmetros de entrada
            if (!cpf) {
                throw new Error('CPF é obrigatório para atualizar etapa');
            }
            
            // Converter para string se necessário
            const cpfString = cpf.toString();
            
            const cleanCPF = cpfString.replace(/[^\d]/g, '');
            
            if (cleanCPF.length !== 11) {
                console.warn(`⚠️ CPF com formato inválido: ${cpfString} -> ${cleanCPF}`);
                // Se não for um CPF válido, pode ser um ID, vamos buscar o lead primeiro
                if (cleanCPF.length === 0 || cleanCPF.length < 11) {
                    console.log('🔍 Tentando buscar lead por ID para obter CPF...');
                    const leadResult = await this.getLeadById(cpfString);
                    if (leadResult.success && leadResult.data) {
                        return this.updateLeadStage(leadResult.data.cpf, newStage);
                    }
                }
                throw new Error(`CPF inválido: ${cpfString} (deve ter 11 dígitos)`);
            }
            
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

            if (!data || data.length === 0) {
                console.warn('⚠️ Nenhum lead encontrado para CPF:', cleanCPF);
                return { success: false, error: 'Lead não encontrado' };
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
            // Validar parâmetros de entrada
            if (!cpf) {
                throw new Error('CPF é obrigatório para atualizar status de pagamento');
            }
            
            if (typeof cpf !== 'string') {
                throw new Error('CPF deve ser uma string válida');
            }
            
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            
            if (cleanCPF.length !== 11) {
                throw new Error(`CPF inválido: ${cpf} (deve ter 11 dígitos)`);
            }
            
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

    async updateLead(cpf, newStage) {
        // Wrapper method for compatibility
        return await this.updateLeadStage(cpf, newStage);
    }

    async bulkUpdateLeads(leads) {
        try {
            console.log('🔄 Atualizando leads em massa:', leads.length);
            
            // Validar array de leads
            if (!Array.isArray(leads)) {
                throw new Error('Leads deve ser um array');
            }
            
            if (leads.length === 0) {
                return { success: true, results: [], successCount: 0, errorCount: 0 };
            }
            
            const results = [];
            for (const lead of leads) {
                // Validar dados do lead antes de processar
                if (!lead || !lead.cpf) {
                    console.warn('⚠️ Lead sem CPF encontrado, pulando:', lead);
                    results.push({ success: false, error: 'CPF ausente no lead' });
                    continue;
                }
                
                if (!lead.etapa_atual && lead.etapa_atual !== 0) {
                    console.warn('⚠️ Lead sem etapa_atual encontrado, pulando:', lead);
                    results.push({ success: false, error: 'Etapa ausente no lead' });
                    continue;
                }
                
                const result = await this.updateLeadStage(lead.cpf, lead.etapa_atual);
                results.push(result);
            }
            
            const successCount = results.filter(r => r.success).length;
            const errorCount = results.filter(r => !r.success).length;
            
            console.log(`✅ Atualização em massa concluída: ${successCount} sucessos, ${errorCount} erros`);
            
            return {
                success: errorCount === 0,
                results,
                successCount,
                errorCount
            };
        } catch (error) {
            console.error('❌ Erro crítico na atualização em massa:', error);
            return { success: false, error: error.message };
        }
    }

    async getLeadsByDateRange(filters) {
        try {
            console.log('🔍 Buscando leads com filtros:', filters);

            let query = this.supabase.from('leads').select('*');
            
            // Filtro por busca (nome ou CPF)
            if (filters.searchQuery && filters.searchQuery.trim()) {
                const searchTerm = filters.searchQuery.trim();
                query = query.or(`nome_completo.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`);
            }
            
            // Filtro por data de início
            if (filters.startDate) {
                query = query.gte('created_at', filters.startDate);
            }
            
            // Filtro por data de fim
            if (filters.endDate) {
                const endDateTime = new Date(filters.endDate);
                endDateTime.setHours(23, 59, 59, 999);
                query = query.lte('created_at', endDateTime.toISOString());
            }
            
            // Filtro por etapa
            if (filters.stageFilter && filters.stageFilter !== 'all') {
                query = query.eq('etapa_atual', parseInt(filters.stageFilter));
            }
            
            // Ordenar por data de criação (mais recentes primeiro)
            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) {
                console.error('❌ Erro ao buscar leads com filtros:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Leads filtrados encontrados:', data.length);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Erro crítico ao buscar leads com filtros:', error);
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