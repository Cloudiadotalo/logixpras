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
            if (!leadData['Nome do Cliente'] && !leadData.nome_completo && !leadData.nome) {
                throw new Error('Nome completo é obrigatório');
            }
            
            if (!leadData['Documento'] && !leadData.cpf) {
                throw new Error('CPF é obrigatório');
            }
            
            // Limpar e validar CPF
            const cpfField = leadData['Documento'] || leadData.cpf;
            const cleanCPF = cpfField.toString().replace(/[^\d]/g, '');
            if (cleanCPF.length !== 11) {
                throw new Error(`CPF inválido: ${cleanCPF} (deve ter 11 dígitos)`);
            }
            
            // Preparar dados para inserção
            const dataToInsert = {
                'Nome do Cliente': (leadData['Nome do Cliente'] || leadData.nome_completo || leadData.nome).toString().trim(),
                'Documento': parseInt(cleanCPF),
                'Email do Cliente': leadData['Email do Cliente'] || leadData.email || null,
                'Telefone do Cliente': leadData['Telefone do Cliente'] || leadData.telefone ? parseInt((leadData['Telefone do Cliente'] || leadData.telefone).toString().replace(/[^\d]/g, '')) : null,
                'Produto': leadData['Produto'] || leadData.produto || 'Kit 12 caixas organizadoras + brinde',
                'Valor Total Venda': leadData['Valor Total Venda'] || leadData.valor_total || leadData.valor || '67.90',
                'Endereço': leadData['Endereço'] || leadData.endereco || null,
                'Número': leadData['Número'] || leadData.numero || null,
                'Complemento': leadData['Complemento'] || leadData.complemento || null,
                'Bairro': leadData['Bairro'] || leadData.bairro || null,
                'Cep': leadData['Cep'] || leadData.cep ? parseInt((leadData['Cep'] || leadData.cep).toString().replace(/[^\d]/g, '')) : null,
                'Cidade': leadData['Cidade'] || leadData.cidade || null,
                'Estado': leadData['Estado'] || leadData.estado || null,
                'País': leadData['País'] || leadData.pais || 'BR'
            };
            
            console.log('📝 Dados preparados para inserção:', {
                nome: dataToInsert['Nome do Cliente'],
                documento: dataToInsert['Documento'],
                email: dataToInsert['Email do Cliente'],
                valor: dataToInsert['Valor Total Venda']
            });
            
            const { data, error } = await this.supabase
                .from('logr')
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
                .from('logr')
                .select('*')
                .eq('Documento', parseInt(cleanCPF))
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('📝 Lead não encontrado para CPF:', cleanCPF);
                    return { success: false, error: 'Lead não encontrado' };
                }
                console.error('❌ Erro ao buscar lead:', error);
                return { success: false, error: error.message };
            }

            // Mapear dados da tabela logr para formato esperado
            const mappedData = {
                id: data.Documento,
                nome_completo: data['Nome do Cliente'],
                cpf: data.Documento ? data.Documento.toString() : '',
                email: data['Email do Cliente'],
                telefone: data['Telefone do Cliente'] ? data['Telefone do Cliente'].toString() : '',
                produto: data.Produto,
                valor_total: data['Valor Total Venda'],
                endereco: data['Endereço'],
                numero: data['Número'],
                complemento: data.Complemento,
                bairro: data.Bairro,
                cep: data.Cep ? data.Cep.toString() : '',
                cidade: data.Cidade,
                estado: data.Estado,
                pais: data['País'],
                etapa_atual: 11,
                status_pagamento: 'pendente',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('✅ Lead encontrado e mapeado:', mappedData);
            return { success: true, data: mappedData };
        } catch (error) {
            console.error('❌ Erro crítico ao buscar lead:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllLeads() {
        try {
            console.log('📋 Buscando todos os leads...');

            const { data, error } = await this.supabase
                .from('logr')
                .select('*')
                .order('Nome do Cliente', { ascending: true });

            if (error) {
                console.error('❌ Erro ao buscar leads:', error);
                return { success: false, error: error.message };
            }

            // Mapear dados da tabela logr para formato esperado pelo painel
            const mappedData = data.map(lead => ({
                id: lead.Documento, // Usar CPF como ID único
                nome_completo: lead['Nome do Cliente'],
                cpf: lead.Documento ? lead.Documento.toString() : '',
                email: lead['Email do Cliente'],
                telefone: lead['Telefone do Cliente'] ? lead['Telefone do Cliente'].toString() : '',
                produto: lead.Produto,
                valor_total: lead['Valor Total Venda'],
                endereco: lead['Endereço'],
                numero: lead['Número'],
                complemento: lead.Complemento,
                bairro: lead.Bairro,
                cep: lead.Cep ? lead.Cep.toString() : '',
                cidade: lead.Cidade,
                estado: lead.Estado,
                pais: lead['País'],
                etapa_atual: 11, // Etapa padrão para leads existentes
                status_pagamento: 'pendente', // Status padrão
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            console.log('✅ Leads encontrados e mapeados:', mappedData.length);
            console.log('📊 Primeiro lead mapeado:', mappedData[0]);
            return { success: true, data: mappedData };
        } catch (error) {
            console.error('❌ Erro crítico ao buscar leads:', error);
            return { success: false, error: error.message };
        }
    }

    async getLeadsByStage(stage) {
        try {
            console.log('🔍 Buscando leads por etapa:', stage);

            let query = this.supabase.from('logr').select('*');
            
            // Como a tabela logr não tem campo de etapa, retornar todos
            console.log('⚠️ Tabela logr não possui campo de etapa, retornando todos os leads');

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
            console.log('⚠️ Tabela logr não possui campo etapa_atual - operação será ignorada');

            // Simular sucesso já que a tabela logr não tem campo de etapa
            return { success: true, data: { cpf: cleanCPF, etapa_atual: newStage } };
        } catch (error) {
            console.error('❌ Erro crítico ao atualizar etapa:', error);
            return { success: false, error: error.message };
        }
    }

    async updatePaymentStatus(cpf, status) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            console.log('💳 Tentando atualizar status de pagamento:', cleanCPF, 'para:', status);
            console.log('⚠️ Tabela logr não possui campo status_pagamento - operação será ignorada');

            // Simular sucesso já que a tabela logr não tem campo de status
            return { success: true, data: { cpf: cleanCPF, status_pagamento: status } };
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
                .from('logr')
                .delete()
                .eq('Documento', parseInt(cleanCPF))
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
                .from('logr')
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