/* filepath: /workspaces/trello-marketing-reports/assets/js/components.js */
/**
 * Gerenciador de Componentes da UI
 * Responsável por todas as interações e estados visuais
 */

class UIComponents {
    constructor() {
        this.initializeComponents();
        this.bindEvents();
        this.currentView = 'welcome';
        this.currentData = null;
        this.filteredData = null;
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    initializeComponents() {
        // Inicializar dropdowns
        this.initializeDropdowns();
        // Inicializar modais
        this.initializeModals();
        // Inicializar tooltips
        this.initializeTooltips();
        // Configurar tema inicial
        this.initializeTheme();
    }

    bindEvents() {
        // Navegação principal
        this.bindNavigationEvents();
        // Eventos do wizard de importação
        this.bindWizardEvents();
        // Eventos de filtros e busca
        this.bindFilterEvents();
        // Eventos de exportação
        this.bindExportEvents();
        // Eventos de tema
        this.bindThemeEvents();
        // Eventos de paginação
        this.bindPaginationEvents();
    }

    bindNavigationEvents() {
        // Botões de navegação principal
        document.getElementById('btn-import')?.addEventListener('click', () => {
            this.showView('import');
        });

        document.getElementById('btn-dashboard')?.addEventListener('click', () => {
            if (this.currentData) {
                this.showView('dashboard');
            } else {
                this.showToast('Importe dados do Trello primeiro', 'warning');
            }
        });

        document.getElementById('btn-reports')?.addEventListener('click', () => {
            if (this.currentData) {
                this.showView('reports');
            } else {
                this.showToast('Importe dados do Trello primeiro', 'warning');
            }
        });

        document.getElementById('btn-export')?.addEventListener('click', () => {
            if (this.currentData) {
                this.showView('export');
            } else {
                this.showToast('Importe dados do Trello primeiro', 'warning');
            }
        });

        // Link "Começar Agora"
        document.getElementById('start-now')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('import');
        });
    }

    bindWizardEvents() {
        // Step 1: Configurar período
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const nextStep1 = document.getElementById('next-step-1');

        // Definir data padrão (2 de junho de 2025)
        if (startDateInput) {
            startDateInput.value = '2025-06-02';
        }
        if (endDateInput) {
            endDateInput.value = new Date().toISOString().split('T')[0];
        }

        nextStep1?.addEventListener('click', () => {
            this.goToWizardStep(2);
        });

        // Step 2: Guia de exportação
        const nextStep2 = document.getElementById('next-step-2');
        const prevStep2 = document.getElementById('prev-step-2');

        nextStep2?.addEventListener('click', () => {
            this.goToWizardStep(3);
        });

        prevStep2?.addEventListener('click', () => {
            this.goToWizardStep(1);
        });

        // Step 3: Importar dados
        const fileInput = document.getElementById('trello-file');
        const processBtn = document.getElementById('process-data');
        const prevStep3 = document.getElementById('prev-step-3');

        fileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                processBtn.disabled = false;
                processBtn.textContent = 'Processar Dados';
            }
        });

        processBtn?.addEventListener('click', () => {
            this.processUploadedFile();
        });

        prevStep3?.addEventListener('click', () => {
            this.goToWizardStep(2);
        });
    }

    bindFilterEvents() {
        // Filtros de status
        const statusFilters = document.querySelectorAll('input[name="status-filter"]');
        statusFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                this.applyFilters();
            });
        });

        // Filtro de membro
        const memberFilter = document.getElementById('member-filter');
        memberFilter?.addEventListener('change', () => {
            this.applyFilters();
        });

        // Busca
        const searchInput = document.getElementById('search-tasks');
        let searchTimeout;
        searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.applyFilters();
            }, 300);
        });

        // Botão limpar filtros
        const clearFilters = document.getElementById('clear-filters');
        clearFilters?.addEventListener('click', () => {
            this.clearAllFilters();
        });
    }

    bindExportEvents() {
        // Botões de exportação
        document.getElementById('export-pdf')?.addEventListener('click', () => {
            this.exportData('pdf');
        });

        document.getElementById('export-excel')?.addEventListener('click', () => {
            this.exportData('excel');
        });

        document.getElementById('export-json')?.addEventListener('click', () => {
            this.exportData('json');
        });

        document.getElementById('copy-text')?.addEventListener('click', () => {
            this.exportData('text');
        });
    }

    bindThemeEvents() {
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle?.addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    bindPaginationEvents() {
        // Os eventos de paginação são criados dinamicamente
        // quando a tabela é renderizada
    }

    showView(viewName) {
        // Esconder todas as seções
        const sections = document.querySelectorAll('.main-section');
        sections.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });

        // Mostrar seção selecionada
        const targetSection = document.getElementById(`${viewName}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
        }

        // Atualizar navegação
        this.updateNavigation(viewName);
        this.currentView = viewName;

        // Ações específicas por view
        switch(viewName) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'reports':
                this.renderReportsTable();
                break;
            case 'export':
                this.updateExportSection();
                break;
        }
    }

    updateNavigation(activeView) {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.id === `btn-${activeView}`) {
                btn.classList.add('active');
            }
        });
    }

    goToWizardStep(step) {
        // Esconder todos os steps
        for (let i = 1; i <= 3; i++) {
            const stepElement = document.getElementById(`step-${i}`);
            if (stepElement) {
                stepElement.style.display = i === step ? 'block' : 'none';
            }
        }

        // Atualizar indicadores de progresso
        this.updateWizardProgress(step);
    }

    updateWizardProgress(currentStep) {
        const indicators = document.querySelectorAll('.step-indicator');
        indicators.forEach((indicator, index) => {
            const stepNum = index + 1;
            indicator.classList.remove('active', 'completed');
            
            if (stepNum < currentStep) {
                indicator.classList.add('completed');
            } else if (stepNum === currentStep) {
                indicator.classList.add('active');
            }
        });
    }

    async processUploadedFile() {
        const fileInput = document.getElementById('trello-file');
        const processBtn = document.getElementById('process-data');
        
        if (!fileInput.files.length) {
            this.showToast('Selecione um arquivo JSON do Trello', 'error');
            return;
        }

        const file = fileInput.files[0];
        
        // Mostrar loading
        this.showLoading(true);
        processBtn.disabled = true;
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

        try {
            const fileContent = await this.readFile(file);
            const jsonData = JSON.parse(fileContent);

            // Obter datas do formulário
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;

            // Processar dados com TrelloParser
            const parser = new TrelloParser();
            const result = parser.parseBoard(jsonData, startDate, endDate);

            if (result.success) {
                this.currentData = result.data;
                this.filteredData = [...result.data.tasks];
                
                this.showToast('Dados processados com sucesso!', 'success');
                this.showView('dashboard');
                this.populateMemberFilter();
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Erro ao processar arquivo:', error);
            this.showToast('Erro ao processar arquivo: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
            processBtn.disabled = false;
            processBtn.textContent = 'Processar Dados';
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    renderDashboard() {
        if (!this.currentData) return;

        const metrics = this.currentData.metrics;
        
        // Atualizar KPIs
        this.updateKPICard('total-tasks', metrics.totalTasks, 'Total de Tarefas');
        this.updateKPICard('completed-tasks', metrics.completedTasks, 'Concluídas');
        this.updateKPICard('in-progress-tasks', metrics.inProgressTasks, 'Em Andamento');
        this.updateKPICard('overdue-tasks', metrics.overdueTasks, 'Atrasadas');

        // Renderizar gráfico de status
        this.renderStatusChart();

        // Renderizar estatísticas por membro
        this.renderTeamStats();
    }

    updateKPICard(elementId, value, label) {
        const element = document.getElementById(elementId);
        if (element) {
            const valueEl = element.querySelector('.kpi-value');
            const labelEl = element.querySelector('.kpi-label');
            
            if (valueEl) valueEl.textContent = value;
            if (labelEl) labelEl.textContent = label;
        }
    }

    renderStatusChart() {
        const chartContainer = document.getElementById('statusChart');
        if (!chartContainer || !this.currentData) return;

        const metrics = this.currentData.metrics;
        
        chartContainer.innerHTML = `
            <div class="status-stat completed">
                <div class="status-stat-value">${metrics.completedTasks}</div>
                <div class="status-stat-label">Concluídas</div>
            </div>
            <div class="status-stat in-progress">
                <div class="status-stat-value">${metrics.inProgressTasks}</div>
                <div class="status-stat-label">Em Andamento</div>
            </div>
            <div class="status-stat overdue">
                <div class="status-stat-value">${metrics.overdueTasks}</div>
                <div class="status-stat-label">Atrasadas</div>
            </div>
        `;
    }

    renderTeamStats() {
        const container = document.getElementById('team-performance');
        if (!container || !this.currentData) return;

        const memberStats = this.currentData.memberStats;
        
        container.innerHTML = Object.entries(memberStats).map(([member, stats]) => `
            <div class="team-member-card">
                <div class="member-name">${member}</div>
                <div class="member-stats">
                    <div class="stat">
                        <span class="stat-value">${stats.totalTasks}</span>
                        <span class="stat-label">Total</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${stats.completedTasks}</span>
                        <span class="stat-label">Concluídas</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${stats.overdueTasks}</span>
                        <span class="stat-label">Atrasadas</span>
                    </div>
                </div>
                <div class="member-completion-rate">
                    ${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% concluído
                </div>
            </div>
        `).join('');
    }

    populateMemberFilter() {
        const memberFilter = document.getElementById('member-filter');
        if (!memberFilter || !this.currentData) return;

        const members = Object.keys(this.currentData.memberStats);
        
        memberFilter.innerHTML = `
            <option value="">Todos os membros</option>
            ${members.map(member => `<option value="${member}">${member}</option>`).join('')}
        `;
    }

    applyFilters() {
        if (!this.currentData) return;

        let filtered = [...this.currentData.tasks];

        // Filtro por status
        const statusFilters = document.querySelectorAll('input[name="status-filter"]:checked');
        if (statusFilters.length > 0) {
            const selectedStatuses = Array.from(statusFilters).map(f => f.value);
            filtered = filtered.filter(task => selectedStatuses.includes(task.status));
        }

        // Filtro por membro
        const memberFilter = document.getElementById('member-filter');
        if (memberFilter && memberFilter.value) {
            filtered = filtered.filter(task => task.member === memberFilter.value);
        }

        // Filtro por busca
        const searchInput = document.getElementById('search-tasks');
        if (searchInput && searchInput.value.trim()) {
            const searchTerm = searchInput.value.trim().toLowerCase();
            filtered = filtered.filter(task => 
                task.name.toLowerCase().includes(searchTerm) ||
                task.member.toLowerCase().includes(searchTerm) ||
                (task.observations && task.observations.toLowerCase().includes(searchTerm))
            );
        }

        this.filteredData = filtered;
        this.currentPage = 1;
        this.renderReportsTable();
    }

    clearAllFilters() {
        // Limpar checkboxes de status
        const statusFilters = document.querySelectorAll('input[name="status-filter"]');
        statusFilters.forEach(filter => filter.checked = false);

        // Limpar select de membro
        const memberFilter = document.getElementById('member-filter');
        if (memberFilter) memberFilter.value = '';

        // Limpar busca
        const searchInput = document.getElementById('search-tasks');
        if (searchInput) searchInput.value = '';

        // Aplicar filtros (vai mostrar todos)
        this.applyFilters();
    }

    renderReportsTable() {
        const tableBody = document.getElementById('reports-table-body');
        const pagination = document.getElementById('pagination');
        
        if (!tableBody || !this.filteredData) return;

        // Calcular paginação
        const totalItems = this.filteredData.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentItems = this.filteredData.slice(startIndex, endIndex);

        // Renderizar linhas da tabela
        tableBody.innerHTML = currentItems.map(task => `
            <tr>
                <td>${task.member}</td>
                <td>${task.name}</td>
                <td>${task.dueDate || 'Sem prazo'}</td>
                <td><span class="status-badge status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span></td>
                <td>${task.daysLate > 0 ? task.daysLate : '-'}</td>
                <td>${task.observations || '-'}</td>
            </tr>
        `).join('');

        // Renderizar paginação
        this.renderPagination(totalPages);

        // Atualizar contador
        const resultsInfo = document.getElementById('results-info');
        if (resultsInfo) {
            resultsInfo.textContent = `Mostrando ${startIndex + 1}-${Math.min(endIndex, totalItems)} de ${totalItems} tarefas`;
        }
    }

    renderPagination(totalPages) {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Botão anterior
        if (this.currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="app.ui.goToPage(${this.currentPage - 1})">Anterior</button>`;
        }

        // Números das páginas
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="pagination-btn active">${i}</button>`;
            } else {
                paginationHTML += `<button class="pagination-btn" onclick="app.ui.goToPage(${i})">${i}</button>`;
            }
        }

        // Botão próximo
        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="pagination-btn" onclick="app.ui.goToPage(${this.currentPage + 1})">Próximo</button>`;
        }

        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderReportsTable();
    }

    updateExportSection() {
        const exportInfo = document.getElementById('export-info');
        if (!exportInfo || !this.currentData) return;

        const metrics = this.currentData.metrics;
        const dateRange = `${this.currentData.period.start} a ${this.currentData.period.end}`;

        exportInfo.innerHTML = `
            <div class="export-summary">
                <h3>Resumo dos Dados</h3>
                <p><strong>Período:</strong> ${dateRange}</p>
                <p><strong>Total de tarefas:</strong> ${metrics.totalTasks}</p>
                <p><strong>Membros da equipe:</strong> ${Object.keys(this.currentData.memberStats).length}</p>
            </div>
        `;
    }

    async exportData(format) {
        if (!this.currentData) {
            this.showToast('Nenhum dado para exportar', 'warning');
            return;
        }

        this.showLoading(true, 'Preparando exportação...');

        try {
            const exporter = new DataExporter();
            await exporter.export(format, this.currentData, this.filteredData);
            this.showToast(`Dados exportados em formato ${format.toUpperCase()}`, 'success');
        } catch (error) {
            console.error('Erro na exportação:', error);
            this.showToast('Erro ao exportar dados: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        // Mostrar toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Remover toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    showLoading(show, message = 'Carregando...') {
        let loader = document.getElementById('loading-overlay');
        
        if (show) {
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'loading-overlay';
                loader.className = 'loading-overlay';
                document.body.appendChild(loader);
            }
            
            loader.innerHTML = `
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">${message}</div>
                </div>
            `;
            loader.style.display = 'flex';
        } else if (loader) {
            loader.style.display = 'none';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Atualizar ícone do botão
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }

    initializeDropdowns() {
        // Implementar dropdowns personalizados se necessário
    }

    initializeModals() {
        // Fechar modais ao clicar no overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target);
            }
        });

        // Botões de fechar modal
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) this.closeModal(modal);
            });
        });
    }

    initializeTooltips() {
        // Implementar tooltips se necessário
    }

    closeModal(modal) {
        modal.style.display = 'none';
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }
}
