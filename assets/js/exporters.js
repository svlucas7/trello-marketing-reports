/**
 * Exporters - Sistema de exportação de relatórios
 * Suporta PDF, Excel, JSON e texto formatado
 */

class ReportExporters {
    constructor() {
        this.data = null;
    }

    setData(processedData) {
        this.data = processedData;
    }

    /**
     * Exporta relatório em PDF
     */
    async exportPDF() {
        if (!this.data) {
            throw new Error('Nenhum dado disponível para exportação');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Configurações
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let yPosition = margin;

        // Função para adicionar nova página se necessário
        const checkPageBreak = (neededHeight = 20) => {
            if (yPosition + neededHeight > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
                return true;
            }
            return false;
        };

        // Função para adicionar texto com quebra de linha
        const addText = (text, x, y, maxWidth, fontSize = 12) => {
            doc.setFontSize(fontSize);
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, x, y);
            return lines.length * (fontSize * 0.6);
        };

        try {
            // Cabeçalho
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('Relatório de Marketing - Trello', margin, yPosition);
            yPosition += 15;

            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text(`Quadro: ${this.data.boardInfo.name}`, margin, yPosition);
            yPosition += 8;

            const startDate = this.data.period.start.toLocaleDateString('pt-BR');
            const endDate = this.data.period.end.toLocaleDateString('pt-BR');
            doc.text(`Período: ${startDate} - ${endDate}`, margin, yPosition);
            yPosition += 8;

            doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, yPosition);
            yPosition += 20;

            checkPageBreak(40);

            // Resumo Geral
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Resumo Geral', margin, yPosition);
            yPosition += 15;

            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            
            const metrics = this.data.metrics;
            const summaryData = [
                `Total de Tarefas: ${metrics.total}`,
                `Tarefas Concluídas: ${metrics.completed} (${metrics.completedPercentage}%)`,
                `Tarefas em Andamento: ${metrics.inProgress} (${metrics.inProgressPercentage}%)`,
                `Tarefas Atrasadas: ${metrics.overdue} (${metrics.overduePercentage}%)`,
                `Média de Dias em Atraso: ${metrics.avgDaysLate} dias`
            ];

            summaryData.forEach(line => {
                checkPageBreak();
                doc.text(line, margin, yPosition);
                yPosition += 8;
            });

            yPosition += 15;
            checkPageBreak(40);

            // Performance da Equipe
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Performance da Equipe', margin, yPosition);
            yPosition += 15;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');

            metrics.memberStats.forEach(member => {
                checkPageBreak(25);
                
                doc.setFont(undefined, 'bold');
                doc.text(`${member.member.fullName}:`, margin, yPosition);
                yPosition += 6;
                
                doc.setFont(undefined, 'normal');
                doc.text(`  • Total: ${member.total} | Concluídas: ${member.completed} | Em Andamento: ${member.inProgress} | Atrasadas: ${member.overdue}`, margin, yPosition);
                yPosition += 6;
                
                const completionRate = member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0;
                doc.text(`  • Taxa de Conclusão: ${completionRate}% | Média de Atraso: ${Math.round(member.avgDaysLate)} dias`, margin, yPosition);
                yPosition += 10;
            });

            yPosition += 10;
            checkPageBreak(40);

            // Detalhamento das Tarefas
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Detalhamento das Tarefas', margin, yPosition);
            yPosition += 15;

            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');

            this.data.cards.forEach((card, index) => {
                checkPageBreak(30);
                
                doc.setFont(undefined, 'bold');
                doc.text(`${index + 1}. ${card.name}`, margin, yPosition);
                yPosition += 6;
                
                doc.setFont(undefined, 'normal');
                const responsible = card.members.length > 0 ? card.members.map(m => m.fullName).join(', ') : 'Sem Responsável';
                doc.text(`   Responsável: ${responsible}`, margin, yPosition);
                yPosition += 5;
                
                const dueDate = card.dueDate ? card.dueDate.toLocaleDateString('pt-BR') : 'Sem data';
                doc.text(`   Data Prevista: ${dueDate}`, margin, yPosition);
                yPosition += 5;
                
                const status = this.translateStatus(card.status);
                doc.text(`   Status: ${status}`, margin, yPosition);
                yPosition += 5;
                
                if (card.daysLate > 0) {
                    doc.text(`   Dias em Atraso: ${card.daysLate}`, margin, yPosition);
                    yPosition += 5;
                }
                
                if (card.observations && card.observations !== 'Sem observações') {
                    const obsHeight = addText(`   Observações: ${card.observations}`, margin, yPosition, pageWidth - 2 * margin, 9);
                    yPosition += obsHeight + 3;
                }
                
                yPosition += 5;
            });

            // Rodapé em todas as páginas
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont(undefined, 'normal');
                doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
                doc.text('Marketing Reports Dashboard', margin, pageHeight - 10);
            }

            // Salvar arquivo
            const filename = `relatorio-marketing-${startDate.replace(/\//g, '-')}-${endDate.replace(/\//g, '-')}.pdf`;
            doc.save(filename);

            return { success: true, filename };

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            throw new Error('Erro ao gerar PDF: ' + error.message);
        }
    }

    /**
     * Exporta relatório em Excel
     */
    async exportExcel() {
        if (!this.data) {
            throw new Error('Nenhum dado disponível para exportação');
        }

        try {
            const XLSX = window.XLSX;
            const wb = XLSX.utils.book_new();

            // Aba 1: Resumo Geral
            const summaryData = [
                ['Relatório de Marketing - Trello'],
                [''],
                ['Quadro:', this.data.boardInfo.name],
                ['Período:', `${this.data.period.start.toLocaleDateString('pt-BR')} - ${this.data.period.end.toLocaleDateString('pt-BR')}`],
                ['Gerado em:', new Date().toLocaleString('pt-BR')],
                [''],
                ['RESUMO GERAL'],
                ['Total de Tarefas', this.data.metrics.total],
                ['Tarefas Concluídas', this.data.metrics.completed],
                ['Tarefas em Andamento', this.data.metrics.inProgress],
                ['Tarefas Atrasadas', this.data.metrics.overdue],
                ['Taxa de Conclusão (%)', this.data.metrics.completedPercentage],
                ['Média de Dias em Atraso', this.data.metrics.avgDaysLate]
            ];

            const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
            
            // Formatação da aba resumo
            wsSummary['!cols'] = [{ width: 25 }, { width: 20 }];
            
            XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

            // Aba 2: Performance da Equipe
            const teamHeaders = ['Colaborador', 'Total', 'Concluídas', 'Em Andamento', 'Atrasadas', 'Taxa Conclusão (%)', 'Média Atraso (dias)'];
            const teamData = [teamHeaders];

            this.data.metrics.memberStats.forEach(member => {
                const completionRate = member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0;
                teamData.push([
                    member.member.fullName,
                    member.total,
                    member.completed,
                    member.inProgress,
                    member.overdue,
                    completionRate,
                    Math.round(member.avgDaysLate)
                ]);
            });

            const wsTeam = XLSX.utils.aoa_to_sheet(teamData);
            wsTeam['!cols'] = [
                { width: 25 }, { width: 10 }, { width: 12 }, 
                { width: 15 }, { width: 12 }, { width: 15 }, { width: 18 }
            ];
            
            XLSX.utils.book_append_sheet(wb, wsTeam, 'Performance Equipe');

            // Aba 3: Detalhamento das Tarefas
            const taskHeaders = ['Colaborador', 'Nome da Tarefa', 'Data Prevista', 'Status', 'Dias em Atraso', 'Observações'];
            const taskData = [taskHeaders];

            this.data.cards.forEach(card => {
                const responsible = card.members.length > 0 ? card.members.map(m => m.fullName).join(', ') : 'Sem Responsável';
                const dueDate = card.dueDate ? card.dueDate.toLocaleDateString('pt-BR') : 'Sem data';
                const status = this.translateStatus(card.status);
                
                taskData.push([
                    responsible,
                    card.name,
                    dueDate,
                    status,
                    card.daysLate,
                    card.observations
                ]);
            });

            const wsDetails = XLSX.utils.aoa_to_sheet(taskData);
            wsDetails['!cols'] = [
                { width: 25 }, { width: 35 }, { width: 15 }, 
                { width: 15 }, { width: 15 }, { width: 40 }
            ];
            
            XLSX.utils.book_append_sheet(wb, wsDetails, 'Detalhamento');

            // Salvar arquivo
            const startDate = this.data.period.start.toLocaleDateString('pt-BR');
            const endDate = this.data.period.end.toLocaleDateString('pt-BR');
            const filename = `relatorio-marketing-${startDate.replace(/\//g, '-')}-${endDate.replace(/\//g, '-')}.xlsx`;
            
            XLSX.writeFile(wb, filename);

            return { success: true, filename };

        } catch (error) {
            console.error('Erro ao gerar Excel:', error);
            throw new Error('Erro ao gerar Excel: ' + error.message);
        }
    }

    /**
     * Exporta dados em JSON estruturado
     */
    exportJSON() {
        if (!this.data) {
            throw new Error('Nenhum dado disponível para exportação');
        }

        try {
            const exportData = {
                metadata: {
                    boardName: this.data.boardInfo.name,
                    period: {
                        start: this.data.period.start.toISOString(),
                        end: this.data.period.end.toISOString()
                    },
                    generatedAt: new Date().toISOString(),
                    version: '2.0.0'
                },
                summary: this.data.metrics,
                teamPerformance: this.data.metrics.memberStats,
                tasks: this.data.cards.map(card => ({
                    id: card.id,
                    name: card.name,
                    description: card.desc,
                    members: card.members,
                    dueDate: card.dueDate ? card.dueDate.toISOString() : null,
                    status: card.status,
                    daysLate: card.daysLate,
                    observations: card.observations,
                    listName: card.listName,
                    labels: card.labels,
                    url: card.url
                }))
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            const startDate = this.data.period.start.toLocaleDateString('pt-BR');
            const endDate = this.data.period.end.toLocaleDateString('pt-BR');
            a.download = `relatorio-marketing-${startDate.replace(/\//g, '-')}-${endDate.replace(/\//g, '-')}.json`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return { success: true, filename: a.download };

        } catch (error) {
            console.error('Erro ao gerar JSON:', error);
            throw new Error('Erro ao gerar JSON: ' + error.message);
        }
    }

    /**
     * Copia relatório formatado para área de transferência
     */
    async copyFormattedReport() {
        if (!this.data) {
            throw new Error('Nenhum dado disponível para exportação');
        }

        try {
            const report = this.generateFormattedText();
            
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(report);
            } else {
                // Fallback para navegadores mais antigos
                const textArea = document.createElement('textarea');
                textArea.value = report;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }

            return { success: true };

        } catch (error) {
            console.error('Erro ao copiar relatório:', error);
            throw new Error('Erro ao copiar relatório: ' + error.message);
        }
    }

    /**
     * Gera texto formatado do relatório
     */
    generateFormattedText() {
        const startDate = this.data.period.start.toLocaleDateString('pt-BR');
        const endDate = this.data.period.end.toLocaleDateString('pt-BR');
        
        let report = `🏢 RELATÓRIO DE MARKETING - TRELLO\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        report += `📋 Quadro: ${this.data.boardInfo.name}\n`;
        report += `📅 Período: ${startDate} - ${endDate}\n`;
        report += `⏰ Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
        
        // Resumo Geral
        report += `📊 RESUMO GERAL\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        report += `📝 Total de Tarefas: ${this.data.metrics.total}\n`;
        report += `✅ Tarefas Concluídas: ${this.data.metrics.completed} (${this.data.metrics.completedPercentage}%)\n`;
        report += `🔄 Tarefas em Andamento: ${this.data.metrics.inProgress} (${this.data.metrics.inProgressPercentage}%)\n`;
        report += `⚠️ Tarefas Atrasadas: ${this.data.metrics.overdue} (${this.data.metrics.overduePercentage}%)\n`;
        report += `📈 Média de Dias em Atraso: ${this.data.metrics.avgDaysLate} dias\n\n`;
        
        // Performance da Equipe
        report += `👥 PERFORMANCE DA EQUIPE\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        this.data.metrics.memberStats.forEach(member => {
            const completionRate = member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0;
            report += `👤 ${member.member.fullName}:\n`;
            report += `   • Total: ${member.total} | Concluídas: ${member.completed} | Em Andamento: ${member.inProgress} | Atrasadas: ${member.overdue}\n`;
            report += `   • Taxa de Conclusão: ${completionRate}% | Média de Atraso: ${Math.round(member.avgDaysLate)} dias\n\n`;
        });
        
        // Detalhamento das Tarefas
        report += `📋 DETALHAMENTO DAS TAREFAS\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        
        this.data.cards.forEach((card, index) => {
            const responsible = card.members.length > 0 ? card.members.map(m => m.fullName).join(', ') : 'Sem Responsável';
            const dueDate = card.dueDate ? card.dueDate.toLocaleDateString('pt-BR') : 'Sem data';
            const status = this.translateStatus(card.status);
            
            report += `${index + 1}. ${card.name}\n`;
            report += `   📋 Responsável: ${responsible}\n`;
            report += `   📅 Data Prevista: ${dueDate}\n`;
            report += `   🏷️ Status: ${status}\n`;
            
            if (card.daysLate > 0) {
                report += `   ⏰ Dias em Atraso: ${card.daysLate}\n`;
            }
            
            if (card.observations && card.observations !== 'Sem observações') {
                report += `   💬 Observações: ${card.observations}\n`;
            }
            
            report += `\n`;
        });
        
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        report += `📱 Gerado por: Marketing Reports Dashboard v2.0\n`;
        report += `🌐 Desenvolvido com ❤️ para equipes de alta performance\n`;
        
        return report;
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
}

// Exportar para uso global
window.ReportExporters = ReportExporters;
