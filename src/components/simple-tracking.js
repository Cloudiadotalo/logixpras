/**
 * Sistema de rastreamento simplificado e funcional
 */
import { supabase } from '../services/supabase-client.js';

export class SimpleTrackingSystem {
    constructor() {
        this.currentCPF = null;
        this.userData = null;
        this.trackingData = null;
        this.init();
    }

    init() {
        console.log('🚀 Inicializando sistema de rastreamento simplificado');
        this.setupForm();
        this.setupCPFMask();
    }

    setupForm() {
        const form = document.getElementById('trackingForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    setupCPFMask() {
        const cpfInput = document.getElementById('cpfInput');
        if (cpfInput) {
            cpfInput.addEventListener('input', (e) => {
                this.applyCPFMask(e.target);
            });
        }
    }

    applyCPFMask(input) {
        let value = input.value.replace(/[^\d]/g, '');
        
        if (value.length > 11) {
            value = value.slice(0, 11);
        }
        
        if (value.length > 9) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/(\d{3})(\d{3})/, '$1.$2');
        }
        
        input.value = value;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const cpfInput = document.getElementById('cpfInput');
        const cpf = cpfInput.value.replace(/[^\d]/g, '');
        
        if (!this.isValidCPF(cpf)) {
            this.showError('CPF inválido. Verifique os dados e tente novamente.');
            return;
        }

        this.currentCPF = cpf;
        await this.searchTracking();
    }

    isValidCPF(cpf) {
        if (cpf.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        return true;
    }

    async searchTracking() {
        this.showLoading();
        
        try {
            // Buscar no Supabase primeiro
            const leadData = await this.searchInSupabase();
            
            if (leadData) {
                this.userData = {
                    nome: leadData.nome_completo,
                    cpf: this.currentCPF,
                    email: leadData.email,
                    telefone: leadData.telefone,
                    endereco: leadData.endereco
                };
                this.generateTrackingFromLead(leadData);
            } else {
                // Gerar dados mock se não encontrar
                this.userData = this.generateMockUserData();
                this.generateMockTracking();
            }
            
            this.hideLoading();
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Erro na busca:', error);
            this.hideLoading();
            this.showError('Erro ao buscar dados. Tente novamente.');
        }
    }

    async searchInSupabase() {
        try {
            console.log('🔍 Buscando no Supabase CPF:', this.currentCPF);
            
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('cpf', this.currentCPF)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('📝 Lead não encontrado no Supabase');
                    return null;
                }
                throw error;
            }

            console.log('✅ Lead encontrado no Supabase:', data);
            return data;
        } catch (error) {
            console.error('❌ Erro ao buscar no Supabase:', error);
            return null;
        }
    }

    generateMockUserData() {
        const names = [
            'João Silva Santos', 'Maria Oliveira Costa', 'Pedro Souza Lima',
            'Ana Paula Ferreira', 'Carlos Eduardo Alves', 'Fernanda Santos Rocha'
        ];
        
        const cpfIndex = parseInt(this.currentCPF.slice(-2)) % names.length;
        
        return {
            nome: names[cpfIndex],
            cpf: this.currentCPF,
            email: `cliente${cpfIndex}@email.com`,
            telefone: `(11) 9${this.currentCPF.slice(-8)}`,
            endereco: 'Rua das Flores, 123 - Centro - São Paulo/SP'
        };
    }

    generateTrackingFromLead(leadData) {
        const currentStage = leadData.etapa_atual || 1;
        const isPaid = leadData.status_pagamento === 'pago';
        
        this.trackingData = {
            currentStep: currentStage,
            isPaid: isPaid,
            steps: this.generateSteps(currentStage, isPaid)
        };
    }

    generateMockTracking() {
        this.trackingData = {
            currentStep: 11,
            isPaid: false,
            steps: this.generateSteps(11, false)
        };
    }

    generateSteps(currentStep, isPaid) {
        const baseSteps = [
            { id: 1, title: 'Pedido criado', description: 'Seu pedido foi criado', completed: currentStep >= 1 },
            { id: 2, title: 'Preparando envio', description: 'Preparando para envio', completed: currentStep >= 2 },
            { id: 3, title: 'Enviado da China', description: '[China] Pedido enviado', completed: currentStep >= 3 },
            { id: 4, title: 'Centro de triagem', description: '[China] Centro de triagem Shenzhen', completed: currentStep >= 4 },
            { id: 5, title: 'Centro logístico', description: '[China] Saiu do centro logístico', completed: currentStep >= 5 },
            { id: 6, title: 'Trânsito internacional', description: '[China] Em trânsito internacional', completed: currentStep >= 6 },
            { id: 7, title: 'Liberado exportação', description: '[China] Liberado na alfândega de exportação', completed: currentStep >= 7 },
            { id: 8, title: 'Saiu da origem', description: 'Pedido saiu da origem: Shenzhen', completed: currentStep >= 8 },
            { id: 9, title: 'Chegou no Brasil', description: 'Pedido chegou no Brasil', completed: currentStep >= 9 },
            { id: 10, title: 'Centro distribuição', description: 'Em trânsito para CURITIBA/PR', completed: currentStep >= 10 },
            { id: 11, title: 'Alfândega importação', description: 'Chegou na alfândega: CURITIBA/PR', completed: currentStep >= 11, needsLiberation: !isPaid }
        ];

        if (isPaid) {
            baseSteps.push({
                id: 12,
                title: 'Pedido liberado',
                description: 'Pedido liberado na alfândega',
                completed: true
            });
        }

        return baseSteps;
    }

    displayResults() {
        this.displayOrderDetails();
        this.displayTrackingTimeline();
        
        // Mostrar seções
        const orderDetails = document.getElementById('orderDetails');
        const trackingResults = document.getElementById('trackingResults');
        
        if (orderDetails) orderDetails.style.display = 'block';
        if (trackingResults) trackingResults.style.display = 'block';
        
        // Scroll para resultados
        setTimeout(() => {
            if (orderDetails) {
                orderDetails.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }

    displayOrderDetails() {
        const elements = {
            'customerName': this.userData.nome,
            'fullName': this.userData.nome,
            'formattedCpf': this.formatCPF(this.userData.cpf),
            'customerNameStatus': this.userData.nome,
            'currentStatus': this.trackingData.isPaid ? 'Pedido liberado' : 'Aguardando liberação aduaneira'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    displayTrackingTimeline() {
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;

        timeline.innerHTML = '';

        this.trackingData.steps.forEach((step, index) => {
            const item = this.createTimelineItem(step);
            timeline.appendChild(item);
            
            // Animar entrada
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    createTimelineItem(step) {
        const item = document.createElement('div');
        item.className = `timeline-item ${step.completed ? 'completed' : ''}`;
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.5s ease';

        const date = this.generateStepDate(step.id);
        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let buttonHtml = '';
        if (step.needsLiberation && step.completed) {
            buttonHtml = `
                <button class="liberation-button-timeline" onclick="simpleTracking.showLiberationModal()">
                    <i class="fas fa-unlock"></i> Liberar Pacote
                </button>
            `;
        }

        const chinaTag = step.description.includes('[China]') ? '<span class="china-tag">China</span>' : '';

        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-date">
                    <span class="date">${dateStr}</span>
                    <span class="time">${timeStr}</span>
                </div>
                <div class="timeline-text">
                    <p>${chinaTag}${step.description}</p>
                    ${buttonHtml}
                </div>
            </div>
        `;

        return item;
    }

    generateStepDate(stepId) {
        const now = new Date();
        const daysBack = Math.max(0, 12 - stepId);
        const date = new Date(now);
        date.setDate(date.getDate() - daysBack);
        date.setHours(8 + (stepId % 12), Math.floor(Math.random() * 60), 0, 0);
        return date;
    }

    showLiberationModal() {
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Configurar botão de simulação
            const simulateButton = document.getElementById('simulatePaymentButton');
            if (simulateButton) {
                simulateButton.onclick = () => this.simulatePayment();
            }
        }
    }

    closeLiberationModal() {
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    simulatePayment() {
        console.log('💳 Simulando pagamento da taxa alfandegária');
        
        // Atualizar no Supabase se possível
        this.updatePaymentInSupabase();
        
        // Fechar modal
        this.closeLiberationModal();
        
        // Adicionar etapa de liberação
        this.addLiberationStep();
        
        // Mostrar sucesso
        this.showSuccess('Pagamento processado! Pedido liberado na alfândega.');
    }

    async updatePaymentInSupabase() {
        try {
            const { data, error } = await supabase
                .from('leads')
                .update({
                    status_pagamento: 'pago',
                    etapa_atual: 12,
                    updated_at: new Date().toISOString()
                })
                .eq('cpf', this.currentCPF);

            if (error) {
                console.warn('⚠️ Erro ao atualizar no Supabase:', error);
            } else {
                console.log('✅ Status atualizado no Supabase');
            }
        } catch (error) {
            console.warn('⚠️ Erro na atualização:', error);
        }
    }

    addLiberationStep() {
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;

        const liberationStep = {
            id: 12,
            title: 'Pedido liberado',
            description: 'Pedido liberado na alfândega de importação',
            completed: true
        };

        const item = this.createTimelineItem(liberationStep);
        timeline.appendChild(item);

        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

        // Atualizar status
        const statusElement = document.getElementById('currentStatus');
        if (statusElement) {
            statusElement.textContent = 'Pedido liberado na alfândega';
        }
    }

    formatCPF(cpf) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    showLoading() {
        const loading = document.createElement('div');
        loading.id = 'trackingLoading';
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            backdrop-filter: blur(5px);
        `;

        loading.innerHTML = `
            <div style="
                background: white;
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            ">
                <i class="fas fa-search" style="font-size: 3rem; color: #1e4a6b; animation: pulse 1.5s infinite;"></i>
                <h3 style="color: #2c3e50; margin: 20px 0 10px;">Rastreando Pedido...</h3>
                <p style="color: #666;">Aguarde enquanto buscamos seu pacote</p>
            </div>
        `;

        document.body.appendChild(loading);
        document.body.style.overflow = 'hidden';
    }

    hideLoading() {
        const loading = document.getElementById('trackingLoading');
        if (loading) {
            loading.remove();
            document.body.style.overflow = 'auto';
        }
    }

    showError(message) {
        const error = document.createElement('div');
        error.style.cssText = `
            background: #fee;
            color: #c33;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            border: 1px solid #fcc;
            text-align: center;
            font-weight: 500;
        `;
        error.textContent = message;

        const form = document.querySelector('.tracking-form');
        if (form) {
            form.appendChild(error);
            setTimeout(() => error.remove(), 5000);
        }
    }

    showSuccess(message) {
        const success = document.createElement('div');
        success.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #c3e6cb;
            font-weight: 500;
            z-index: 4000;
            animation: slideInRight 0.3s ease;
        `;
        success.innerHTML = `<i class="fas fa-check"></i> ${message}`;

        document.body.appendChild(success);
        setTimeout(() => success.remove(), 4000);
    }
}