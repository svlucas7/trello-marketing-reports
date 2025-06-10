# Trello Marketing Reports - Guia do Usuário

## 📋 Sobre o Sistema

O **Trello Marketing Reports** é uma aplicação web profissional desenvolvida para gerar relatórios detalhados da equipe de marketing a partir de dados exportados do Trello. O sistema permite análise completa das tarefas, métricas de desempenho e exportação em múltiplos formatos.

## 🚀 Como Usar

### 1. Exportar Dados do Trello

1. **Acesse seu board do Trello**
2. **Abra o menu do board** (botão "..." no canto superior direito)
3. **Selecione "Mais" → "Imprimir e exportar" → "Exportar como JSON"**
4. **Salve o arquivo** com um nome descritivo (ex: `marketing-junho-2025.json`)

### 2. Importar Dados no Sistema

1. **Clique em "Importar Dados"** na página inicial
2. **Configure o período** de análise:
   - Data de início: 2 de junho de 2025 (padrão)
   - Data de fim: Data atual (ajustável)
3. **Siga o guia visual** de exportação do Trello
4. **Selecione o arquivo JSON** exportado
5. **Clique em "Processar Dados"**

### 3. Visualizar Dashboard

Após o processamento, você terá acesso a:

- **📊 KPIs Principais**: Total de tarefas, concluídas, em andamento e atrasadas
- **📈 Gráficos de Status**: Visualização da distribuição das tarefas
- **👥 Performance da Equipe**: Estatísticas individuais de cada membro
- **🎯 Métricas Detalhadas**: Taxas de conclusão e atrasos

### 4. Relatórios Detalhados

A seção de relatórios oferece:

- **📋 Tabela Completa**: Todas as tarefas com detalhes
- **🔍 Filtros Avançados**: Por status, membro ou busca textual
- **📄 Paginação**: Navegação otimizada para grandes volumes
- **📊 Informações Contextuais**: Observações e dias de atraso

### 5. Exportação de Dados

Exporte seus relatórios em:

- **📄 PDF**: Relatório profissional formatado
- **📊 Excel**: Planilha com múltiplas abas
- **📋 JSON**: Dados estruturados para integração
- **📝 Texto**: Formato para copiar/colar

## 🎯 Métricas Calculadas

### Status das Tarefas

- **Concluída**: Cards na lista "Done" ou similares
- **Em Andamento**: Cards em listas de trabalho ativo
- **Atrasada**: Cards com prazo vencido
- **Pendente**: Cards sem início ou prazo indefinido

### Cálculo de Atrasos

- **Dias de Atraso**: Diferença entre data atual e prazo (due date)
- **Apenas para tarefas não concluídas**: Tarefas concluídas não contam atraso
- **Arredondamento**: Sempre para cima (ex: 1.2 dias = 2 dias)

### Estatísticas por Membro

- **Total de Tarefas**: Todas as tarefas atribuídas
- **Taxa de Conclusão**: Percentual de tarefas concluídas
- **Tarefas Atrasadas**: Quantidade de tarefas em atraso
- **Performance Relativa**: Comparação com a equipe

## ⚡ Funcionalidades Avançadas

### Temas

- **Tema Claro**: Interface tradicional com fundo branco
- **Tema Escuro**: Interface moderna com fundo escuro
- **Persistência**: Preferência salva automaticamente

### Filtros Inteligentes

- **Múltiplos Status**: Selecione vários status simultaneamente
- **Busca Textual**: Procure por nome, membro ou observações
- **Combinação**: Use filtros em conjunto para análises específicas
- **Limpeza Rápida**: Botão para remover todos os filtros

### Sessões Persistentes

- **Auto-salvamento**: Dados salvos automaticamente
- **Restauração**: Oferece restaurar sessão anterior (24h)
- **Segurança**: Dados permanecem apenas no seu navegador

### Atalhos de Teclado

- **Ctrl/Cmd + I**: Ir para Importação
- **Ctrl/Cmd + D**: Ir para Dashboard
- **Ctrl/Cmd + R**: Ir para Relatórios
- **Ctrl/Cmd + E**: Ir para Exportação
- **F1**: Abrir Ajuda
- **Esc**: Fechar modais

## 🔧 Requisitos Técnicos

### Navegadores Suportados

- **Chrome/Edge**: Versão 90+
- **Firefox**: Versão 88+
- **Safari**: Versão 14+
- **Opera**: Versão 76+

### Recursos Necessários

- **JavaScript**: Habilitado
- **LocalStorage**: Para persistência de dados
- **FileReader API**: Para leitura de arquivos
- **Canvas**: Para geração de PDFs

### Limitações

- **Tamanho do arquivo**: Até 50MB de JSON
- **Sessões**: Dados mantidos por 24 horas
- **Offline**: Funciona offline após primeiro carregamento

## 📊 Estrutura dos Dados

### Formato de Entrada (Trello JSON)

```json
{
  "name": "Nome do Board",
  "cards": [
    {
      "name": "Nome da Tarefa",
      "members": [{"fullName": "Nome do Membro"}],
      "due": "2025-06-15T10:00:00.000Z",
      "list": {"name": "Lista Atual"},
      "desc": "Descrição da tarefa"
    }
  ],
  "lists": [
    {
      "name": "Nome da Lista",
      "closed": false
    }
  ]
}
```

### Formato de Saída

```json
{
  "period": {
    "start": "2025-06-02",
    "end": "2025-06-10"
  },
  "metrics": {
    "totalTasks": 25,
    "completedTasks": 18,
    "inProgressTasks": 5,
    "overdueTasks": 2
  },
  "tasks": [...],
  "memberStats": {...}
}
```

## 🆘 Solução de Problemas

### Erro ao Importar Arquivo

1. **Verifique o formato**: Arquivo deve ser JSON válido
2. **Tamanho do arquivo**: Máximo 50MB
3. **Estrutura**: Deve ser exportação direta do Trello
4. **Permissões**: Board deve estar acessível

### Dados Não Aparecem

1. **Período selecionado**: Verifique se há tarefas no período
2. **Filtros ativos**: Limpe todos os filtros
3. **Cache do navegador**: Recarregue a página (Ctrl+F5)
4. **Console de erros**: Pressione F12 e verifique erros

### Exportação Não Funciona

1. **Popup bloqueado**: Permita popups para o site
2. **Downloads bloqueados**: Verifique configurações do navegador
3. **Espaço em disco**: Verifique espaço disponível
4. **Navegador atualizado**: Use versão recente

### Performance Lenta

1. **Tamanho dos dados**: Reduza período de análise
2. **Filtros**: Use filtros para reduzir dataset
3. **Recursos do sistema**: Feche outras abas/programas
4. **Cache**: Limpe cache do navegador

## 📞 Suporte

Para suporte técnico ou dúvidas:

1. **Verifique este guia** para soluções comuns
2. **Pressione F12** para ver erros no console
3. **Capture screenshots** do problema
4. **Entre em contato** com a equipe de desenvolvimento

---

**Desenvolvido com ❤️ para a Equipe de Marketing**  
*Versão 1.0.0 - Junho 2025*
