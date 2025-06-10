/* filepath: /workspaces/trello-marketing-reports/assets/js/app.js */
/**
 * Aplicação Principal - Trello Marketing Reports
 * Orquestra todos os componentes e gerencia o estado global
 */

class TrelloMarketingApp {
    constructor() {
        this.version = '1.0.0';
        this.ui = null;
        this.parser = null;
        this.exporter = null;
        this.isInitialized = false;
        
        this.initialize();
    }

    async initialize() {
        try {
            console.log(`Inicializando Trello Marketing Reports v${this.version}`);
            
            // Aguardar DOM estar pronto
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.showFatalError('Erro crítico na inicialização da aplicação');
        }
    }

    initializeApp() {
        try {
            // Inicializar componentes principais
            this.initializeComponents();
            
            // Configurar estado inicial
            this.setupInitialState();
            
            // Registrar service worker se disponível
            this.registerServiceWorker();
            
            // Marcar como inicializado
            this.isInitialized = true;
            
            console.log('Aplicação inicializada com sucesso');
            this.showAppReady();
            
        } catch (error) {
            console.error('Erro na inicialização da aplicação:', error);
            this.showFatalError('Falha ao inicializar componentes');
        }
    }

    initializeComponents() {
        // Inicializar gerenciador de UI
        this.ui = new UIComponents();
        
        // Inicializar parser do Trello
        this.parser = new TrelloParser();
        
        // Inicializar exportador
        this.exporter = new DataExporter();
        
        // Configurar comunicação entre componentes
        this.setupComponentCommunication();
    }

    setupComponentCommunication() {
        // Permitir que componentes acessem uns aos outros através da instância da app
        if (this.ui) {
            this.ui.app = this;
        }
        if (this.parser) {
            this.parser.app = this;
        }
        if (this.exporter) {
            this.exporter.app = this;
        }
    }

    setupInitialState() {
        // Verificar se há dados salvos localmente
        this.loadSavedState();
        
        // Configurar tratamento de erros globais
        this.setupErrorHandling();
        
        // Configurar atalhos de teclado
        this.setupKeyboardShortcuts();
        
        // Verificar compatibilidade do navegador
        this.checkBrowserCompatibility();
    }

    loadSavedState() {
        try {
            // Tentar carregar dados da sessão anterior
            const savedData = localStorage.getItem('trello-marketing-data');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                
                // Verificar se os dados não estão muito antigos (24 horas)
                const savedTime = new Date(parsedData.timestamp);
                const now = new Date();
                const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    this.ui.currentData = parsedData.data;
                    this.ui.filteredData = parsedData.data ? [...parsedData.data.tasks] : null;
                    
                    console.log('Dados da sessão anterior carregados');
                    
                    // Mostrar opção de restaurar
                    this.showRestoreOption();
                } else {
                    // Dados muito antigos, limpar
                    localStorage.removeItem('trello-marketing-data');
                }
            }
        } catch (error) {
            console.error('Erro ao carregar estado salvo:', error);
            localStorage.removeItem('trello-marketing-data');
        }
    }

    saveCurrentState() {
        try {
            if (this.ui.currentData) {
                const stateData = {
                    data: this.ui.currentData,
                    timestamp: new Date().toISOString()
                };
                
                localStorage.setItem('trello-marketing-data', JSON.stringify(stateData));
                console.log('Estado atual salvo');
            }
        } catch (error) {
            console.error('Erro ao salvar estado:', error);
        }
    }

    showRestoreOption() {
        const restoreNotification = document.createElement('div');
        restoreNotification.className = 'restore-notification';
        restoreNotification.innerHTML = `
            <div class="restore-content">
                <i class="fas fa-history"></i>
                <span>Dados da sessão anterior encontrados</span>
                <div class="restore-actions">
                    <button class="btn btn-primary btn-sm" onclick="app.restoreSession()">Restaurar</button>
                    <button class="btn btn-secondary btn-sm" onclick="app.discardSession()">Descartar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(restoreNotification);
        
        // Auto-remover após 10 segundos
        setTimeout(() => {
            if (document.body.contains(restoreNotification)) {
                this.discardSession();
            }
        }, 10000);
    }

    restoreSession() {
        const notification = document.querySelector('.restore-notification');
        if (notification) {
            document.body.removeChild(notification);
        }
        
        if (this.ui.currentData) {
            this.ui.populateMemberFilter();
            this.ui.showView('dashboard');
            this.ui.showToast('Sessão anterior restaurada', 'success');
        }
    }

    discardSession() {
        const notification = document.querySelector('.restore-notification');
        if (notification) {
            document.body.removeChild(notification);
        }
        
        localStorage.removeItem('trello-marketing-data');
        this.ui.currentData = null;
        this.ui.filteredData = null;
        console.log('Sessão anterior descartada');
    }

    setupErrorHandling() {
        // Capturar erros JavaScript não tratados
        window.addEventListener('error', (event) => {
            console.error('Erro JavaScript:', event.error);
            this.handleError(event.error, 'Erro JavaScript não tratado');
        });

        // Capturar promessas rejeitadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promise rejeitada:', event.reason);
            this.handleError(event.reason, 'Promise rejeitada não tratada');
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + I = Importar
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                this.ui.showView('import');
            }
            
            // Ctrl/Cmd + D = Dashboard
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                if (this.ui.currentData) {
                    this.ui.showView('dashboard');
                }
            }
            
            // Ctrl/Cmd + R = Relatórios
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                if (this.ui.currentData) {
                    this.ui.showView('reports');
                }
            }
            
            // Ctrl/Cmd + E = Exportar
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                if (this.ui.currentData) {
                    this.ui.showView('export');
                }
            }
            
            // F1 = Ajuda
            if (e.key === 'F1') {
                e.preventDefault();
                this.ui.openModal('help-modal');
            }
            
            // Escape = Fechar modais
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal-overlay[style*="flex"]');
                if (openModal) {
                    this.ui.closeModal(openModal);
                }
            }
        });
    }

    checkBrowserCompatibility() {
        const features = {
            'FileReader': typeof FileReader !== 'undefined',
            'JSON': typeof JSON !== 'undefined',
            'localStorage': typeof localStorage !== 'undefined',
            'fetch': typeof fetch !== 'undefined'
        };

        const missingFeatures = Object.entries(features)
            .filter(([feature, supported]) => !supported)
            .map(([feature]) => feature);

        if (missingFeatures.length > 0) {
            console.warn('Recursos não suportados:', missingFeatures);
            this.showCompatibilityWarning(missingFeatures);
        }
    }

    showCompatibilityWarning(missingFeatures) {
        const warning = document.createElement('div');
        warning.className = 'compatibility-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Navegador não totalmente compatível</h3>
                <p>Alguns recursos podem não funcionar corretamente:</p>
                <ul>
                    ${missingFeatures.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
                <p>Recomendamos usar uma versão mais recente do navegador.</p>
                <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">
                    Continuar mesmo assim
                </button>
            </div>
        `;
        
        document.body.appendChild(warning);
    }

    handleError(error, context = '') {
        const errorInfo = {
            message: error.message || 'Erro desconhecido',
            stack: error.stack || '',
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Log detalhado para debug
        console.error('Erro capturado:', errorInfo);

        // Mostrar erro amigável ao usuário
        this.ui.showToast(`Erro: ${errorInfo.message}`, 'error');

        // Em modo de desenvolvimento, mostrar mais detalhes
        if (this.isDevelopmentMode()) {
            console.table(errorInfo);
        }
    }

    isDevelopmentMode() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator && !this.isDevelopmentMode()) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registrado:', registration.scope);
            } catch (error) {
                console.log('Falha ao registrar Service Worker:', error);
            }
        }
    }

    showAppReady() {
        // Remover splash screen se existir
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(splash)) {
                    document.body.removeChild(splash);
                }
            }, 500);
        }

        // Mostrar aplicação
        const app = document.getElementById('app');
        if (app) {
            app.style.opacity = '1';
        }

        console.log('Aplicação pronta para uso');
    }

    showFatalError(message) {
        document.body.innerHTML = `
            <div class="fatal-error">
                <div class="error-content">
                    <i class="fas fa-exclamation-circle"></i>
                    <h1>Erro Crítico</h1>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        Recarregar Página
                    </button>
                </div>
            </div>
        `;
    }

    // Métodos públicos para serem chamados externamente
    processData(jsonData, startDate, endDate) {
        return this.parser.parseBoard(jsonData, startDate, endDate);
    }

    exportData(format, data, filteredData) {
        return this.exporter.export(format, data, filteredData);
    }

    // Método para salvar estado antes de sair
    beforeUnload() {
        this.saveCurrentState();
    }

    // Método para obter informações da aplicação
    getAppInfo() {
        return {
            version: this.version,
            initialized: this.isInitialized,
            hasData: !!this.ui?.currentData,
            currentView: this.ui?.currentView,
            theme: document.documentElement.getAttribute('data-theme')
        };
    }
}

// Inicializar aplicação quando script carregar
let app;

// Aguardar que todos os scripts necessários estejam carregados
function initializeApp() {
    if (typeof TrelloParser !== 'undefined' && 
        typeof DataExporter !== 'undefined' && 
        typeof UIComponents !== 'undefined') {
        
        app = new TrelloMarketingApp();
        
        // Salvar estado antes de sair
        window.addEventListener('beforeunload', () => {
            if (app) {
                app.beforeUnload();
            }
        });
        
        // Disponibilizar globalmente para debug
        window.app = app;
        
    } else {
        // Tentar novamente em 100ms
        setTimeout(initializeApp, 100);
    }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
