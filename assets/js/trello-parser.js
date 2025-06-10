/**
 * Trello Parser - Sistema de análise de dados do Trello
 * Processa dados JSON exportados do Trello e gera métricas de performance
 */

class TrelloParser {
    constructor() {
        this.data = null;
        this.processedData = null;
        this.startDate = null;
        this.endDate = null;
    }

    /**
     * Valida se o JSON fornecido é um export válido do Trello
     */
    validateTrelloJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            // Verifica estrutura básica do Trello
            if (!data.id || !data.name || !data.cards || !data.lists || !data.members) {
                return {
                    valid: false,
                    error: 'Estrutura inválida. Certifique-se de que é um export completo do Trello.'
                };
            }

            // Verifica se tem dados úteis
            if (!Array.isArray(data.cards) || data.cards.length === 0) {
                return {
                    valid: false,
                    error: 'Nenhum cartão encontrado no quadro.'
                };
            }

            return { valid: true, data };
        } catch (error) {
            return {
                valid: false,
                error: 'JSON inválido. Verifique se copiou o conteúdo completo.'
            };
        }
    }

    /**
     * Define o período para análise
     */
    setPeriod(startDate, endDate) {
        this.startDate = new Date(startDate);
        this.endDate = new Date(endDate);
        // Ajustar para final do dia
        this.endDate.setHours(23, 59, 59, 999);
    }

    /**
     * Processa os dados do Trello
     */
    processData(jsonString) {
        const validation = this.validateTrelloJSON(jsonString);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        this.data = validation.data;
        this.processedData = this.analyzeData();
        return this.processedData;
    }

    /**
     * Analisa os dados e calcula métricas
     */
    analyzeData() {
        const cards = this.data.cards.filter(card => !card.closed);
        const members = this.data.members;
        const lists = this.data.lists;

        // Criar mapa de listas para identificar status
        const listMap = {};
        lists.forEach(list => {
            listMap[list.id] = list.name.toLowerCase();
        });

        // Criar mapa de membros
        const memberMap = {};
        members.forEach(member => {
            memberMap[member.id] = {
                id: member.id,
                fullName: member.fullName || member.username,
                username: member.username,
                initials: member.initials || this.generateInitials(member.fullName || member.username)
            };
        });

        // Processar cartões
        const processedCards = cards.map(card => {
            const processedCard = this.processCard(card, listMap, memberMap);
            return processedCard;
        }).filter(card => this.isCardInPeriod(card));

        // Calcular métricas gerais
        const metrics = this.calculateMetrics(processedCards, memberMap);

        return {
            cards: processedCards,
            members: memberMap,
            metrics: metrics,
            period: {
                start: this.startDate,
                end: this.endDate
            },
            boardInfo: {
                id: this.data.id,
                name: this.data.name,
                totalCards: processedCards.length
            }
        };
    }

    /**
     * Processa um cartão individual
     */
    processCard(card, listMap, memberMap) {
        const listName = listMap[card.idList] || 'Desconhecido';
        const status = this.determineStatus(listName, card);
        
        // Processar membros do cartão
        const cardMembers = (card.idMembers || []).map(memberId => {
            return memberMap[memberId] || {
                id: memberId,
                fullName: 'Usuário Desconhecido',
                username: 'unknown',
                initials: 'UD'
            };
        });

        // Processar datas
        const dueDate = card.due ? new Date(card.due) : null;
        const dateLastActivity = card.dateLastActivity ? new Date(card.dateLastActivity) : null;

        // Calcular dias em atraso
        const daysLate = this.calculateDaysLate(dueDate, status);

        // Extrair observações dos comentários
        const observations = this.extractObservations(card);

        return {
            id: card.id,
            name: card.name,
            desc: card.desc,
            dueDate: dueDate,
            dateLastActivity: dateLastActivity,
            status: status,
            listName: listName,
            members: cardMembers,
            daysLate: daysLate,
            observations: observations,
            url: card.url,
            labels: card.labels || [],
            closed: card.closed || false
        };
    }

    /**
     * Determina o status do cartão baseado na lista
     */
    determineStatus(listName, card) {
        const lowerListName = listName.toLowerCase();
        
        // Padrões para identificar status
        if (lowerListName.includes('concluí') || 
            lowerListName.includes('done') || 
            lowerListName.includes('finaliz') ||
            lowerListName.includes('entregue')) {
            return 'concluida';
        }
        
        if (lowerListName.includes('andamento') || 
            lowerListName.includes('progress') || 
            lowerListName.includes('fazendo') ||
            lowerListName.includes('doing')) {
            return 'andamento';
        }

        // Se tem data de vencimento e já passou, é atrasada
        if (card.due) {
            const dueDate = new Date(card.due);
            const now = new Date();
            if (dueDate < now && !lowerListName.includes('concluí')) {
                return 'atrasada';
            }
        }

        // Por padrão, considera em andamento se não for concluída
        return 'andamento';
    }

    /**
     * Calcula dias em atraso
     */
    calculateDaysLate(dueDate, status) {
        if (!dueDate || status === 'concluida') {
            return 0;
        }

        const now = new Date();
        const diffTime = now - dueDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays > 0 ? diffDays : 0;
    }

    /**
     * Extrai observações do cartão
     */
    extractObservations(card) {
        let observations = [];

        // Adicionar descrição se existir
        if (card.desc && card.desc.trim()) {
            observations.push(card.desc.trim().substring(0, 100));
        }

        // Adicionar labels como observações
        if (card.labels && card.labels.length > 0) {
            const labelNames = card.labels.map(label => label.name).filter(name => name);
            if (labelNames.length > 0) {
                observations.push(`Labels: ${labelNames.join(', ')}`);
            }
        }

        return observations.join(' | ') || 'Sem observações';
    }

    /**
     * Verifica se o cartão está no período especificado
     */
    isCardInPeriod(card) {
        if (!this.startDate || !this.endDate) {
            return true; // Se não há período definido, inclui todos
        }

        // Considera a data de última atividade ou data de vencimento
        const cardDate = card.dateLastActivity || card.dueDate;
        
        if (!cardDate) {
            return true; // Inclui cartões sem data
        }

        return cardDate >= this.startDate && cardDate <= this.endDate;
    }

    /**
     * Calcula métricas gerais
     */
    calculateMetrics(cards, memberMap) {
        const total = cards.length;
        const completed = cards.filter(card => card.status === 'concluida').length;
        const inProgress = cards.filter(card => card.status === 'andamento').length;
        const overdue = cards.filter(card => card.status === 'atrasada').length;

        // Métricas por membro
        const memberStats = {};
        Object.values(memberMap).forEach(member => {
            memberStats[member.id] = {
                member: member,
                total: 0,
                completed: 0,
                inProgress: 0,
                overdue: 0,
                avgDaysLate: 0
            };
        });

        // Calcular estatísticas por membro
        cards.forEach(card => {
            if (card.members.length === 0) {
                // Cartão sem responsável
                if (!memberStats['unassigned']) {
                    memberStats['unassigned'] = {
                        member: {
                            id: 'unassigned',
                            fullName: 'Sem Responsável',
                            username: 'unassigned',
                            initials: 'SR'
                        },
                        total: 0,
                        completed: 0,
                        inProgress: 0,
                        overdue: 0,
                        avgDaysLate: 0
                    };
                }
                
                const stats = memberStats['unassigned'];
                stats.total++;
                stats[card.status]++;
                if (card.daysLate > 0) {
                    stats.avgDaysLate = (stats.avgDaysLate * (stats.total - 1) + card.daysLate) / stats.total;
                }
            } else {
                // Distribuir entre os membros responsáveis
                card.members.forEach(member => {
                    if (memberStats[member.id]) {
                        const stats = memberStats[member.id];
                        stats.total++;
                        stats[card.status]++;
                        if (card.daysLate > 0) {
                            stats.avgDaysLate = (stats.avgDaysLate * (stats.total - 1) + card.daysLate) / stats.total;
                        }
                    }
                });
            }
        });

        // Remover membros sem tarefas
        Object.keys(memberStats).forEach(memberId => {
            if (memberStats[memberId].total === 0 && memberId !== 'unassigned') {
                delete memberStats[memberId];
            }
        });

        return {
            total: total,
            completed: completed,
            inProgress: inProgress,
            overdue: overdue,
            completedPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
            inProgressPercentage: total > 0 ? Math.round((inProgress / total) * 100) : 0,
            overduePercentage: total > 0 ? Math.round((overdue / total) * 100) : 0,
            memberStats: Object.values(memberStats),
            avgDaysLate: cards.length > 0 ? 
                Math.round(cards.reduce((sum, card) => sum + card.daysLate, 0) / cards.length) : 0
        };
    }

    /**
     * Gera iniciais do nome
     */
    generateInitials(name) {
        if (!name) return 'ND';
        
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }

    /**
     * Exporta dados para formato de relatório
     */
    exportReport() {
        if (!this.processedData) {
            throw new Error('Nenhum dado processado encontrado.');
        }

        const { cards, metrics, period, boardInfo } = this.processedData;

        return {
            metadata: {
                boardName: boardInfo.name,
                period: {
                    start: period.start.toLocaleDateString('pt-BR'),
                    end: period.end.toLocaleDateString('pt-BR')
                },
                generatedAt: new Date().toLocaleString('pt-BR'),
                totalTasks: metrics.total,
                totalMembers: metrics.memberStats.length
            },
            summary: {
                totalTasks: metrics.total,
                completedTasks: metrics.completed,
                inProgressTasks: metrics.inProgress,
                overdueTasks: metrics.overdue,
                completionRate: metrics.completedPercentage,
                avgDaysLate: metrics.avgDaysLate
            },
            teamPerformance: metrics.memberStats.map(stat => ({
                member: stat.member.fullName,
                totalTasks: stat.total,
                completed: stat.completed,
                inProgress: stat.inProgress,
                overdue: stat.overdue,
                completionRate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
                avgDaysLate: Math.round(stat.avgDaysLate)
            })),
            detailedTasks: cards.map(card => ({
                member: card.members.length > 0 ? card.members.map(m => m.fullName).join(', ') : 'Sem Responsável',
                taskName: card.name,
                dueDate: card.dueDate ? card.dueDate.toLocaleDateString('pt-BR') : 'Sem data',
                status: this.translateStatus(card.status),
                daysLate: card.daysLate,
                observations: card.observations
            }))
        };
    }

    /**
     * Traduz status para português
     */
    translateStatus(status) {
        const translations = {
            'concluida': 'Concluída',
            'andamento': 'Em Andamento',
            'atrasada': 'Atrasada'
        };
        return translations[status] || status;
    }

    /**
     * Filtra dados por critérios
     */
    filterData(filters = {}) {
        if (!this.processedData) {
            return { cards: [], metrics: null };
        }

        let filteredCards = [...this.processedData.cards];

        // Filtrar por status
        if (filters.status) {
            filteredCards = filteredCards.filter(card => card.status === filters.status);
        }

        // Filtrar por membro
        if (filters.member) {
            filteredCards = filteredCards.filter(card => 
                card.members.some(member => member.id === filters.member)
            );
        }

        // Filtrar por busca de texto
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredCards = filteredCards.filter(card => 
                card.name.toLowerCase().includes(searchTerm) ||
                card.observations.toLowerCase().includes(searchTerm)
            );
        }

        // Recalcular métricas para dados filtrados
        const filteredMetrics = this.calculateMetrics(filteredCards, this.processedData.members);

        return {
            cards: filteredCards,
            metrics: filteredMetrics
        };
    }
}

// Exportar para uso global
window.TrelloParser = TrelloParser;
