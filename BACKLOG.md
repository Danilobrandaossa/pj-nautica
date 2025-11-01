# Backlog de Funcionalidades Futuras

Este documento contém funcionalidades planejadas para implementação futura no sistema.

---

## 💳 Sistema de Pagamentos Completo

### Descrição
Implementar fluxo completo de pagamentos com integração real de gateways.

### Funcionalidades
- ✅ Adapter de gateway criado (MercadoPagoAdapter - stub)
- ⏳ Geração automática de boletos/PIX quando criar cobrança
- ⏳ Atualização de status via webhook (pago, atrasado, cancelado)
- ⏳ Aplicação automática de juros/multas em caso de atraso
- ⏳ Interface para visualizar link de pagamento (PIX/boleto)

### Prioridade: Alta

---

## 🚫 Bloqueio Automático por Inadimplência

### Descrição
Sistema que bloqueia usuários automaticamente após período configurável de inadimplência.

### Funcionalidades
- ⏳ Configuração de dias de tolerância antes do bloqueio (via /settings)
- ⏳ Cron job ou event listener que verifica pagamentos em atraso
- ⏳ Bloqueio automático após período configurado
- ⏳ Notificação ao usuário antes do bloqueio (X dias antes)
- ⏳ Dashboard com lista de usuários bloqueados por inadimplência

### Prioridade: Alta

---

## 📱 Notificações Automáticas

### Descrição
Sistema de notificações automáticas via WhatsApp/Email quando eventos ocorrem no sistema.

### Funcionalidades
- ✅ Serviço de log de notificações criado (notificationLogService)
- ✅ Tabela notification_logs no banco
- ⏳ Templates configuráveis de mensagens (via /settings)
- ⏳ Integração com WhatsApp (via n8n ou gateway direto)
- ⏳ Integração com Email (SMTP configurável)
- ⏳ Eventos que devem disparar:
  - Agendamento criado → Confirmação
  - Agendamento cancelado → Notificação de cancelamento
  - Pagamento em atraso → Link atualizado do boleto/PIX
  - Pagamento confirmado → Confirmação de pagamento
  - Bloqueio automático → Aviso de bloqueio com instruções
- ⏳ Interface /notification-management para ver logs de envios

### Prioridade: Média-Alta

---

## 📊 Melhorias no Frontend

### Descrição
Melhorias na experiência do usuário e visualizações de dados.

### Funcionalidades
- ⏳ Dashboard com métricas de pagamentos (visão geral financeira)
- ⏳ Histórico financeiro detalhado (com filtros avançados)
- ⏳ Filtros avançados nas listagens (usuários, reservas, etc)
- ⏳ Exportação de dados (PDF/Excel)
- ⏳ Gráficos de utilização de embarcações
- ⏳ Relatórios periódicos (mensais, anuais)

### Prioridade: Média

---

## 🏢 Multi-tenancy

### Descrição
Suporte para múltiplas contas/organizações no mesmo sistema.

### Funcionalidades
- ⏳ Sistema de tenants/organizações
- ⏳ Isolamento de dados por tenant
- ⏳ Planos e limites por organização
- ⏳ Whitelabel por tenant (logo, cores, domínio)

### Prioridade: Baixa (futuro)

---

## 🔧 Melhorias Técnicas

### Descrição
Melhorias técnicas e de infraestrutura.

### Funcionalidades
- ⏳ Sistema de retry automático para falhas de webhook (já parcialmente implementado)
- ⏳ Rate limiting mais granular (por endpoint/usuário)
- ⏳ Cache distribuído (Redis) em vez de in-memory
- ⏳ Background jobs (Bull/BullMQ) para tarefas pesadas
- ⏳ Monitoramento avançado (Grafana/Prometheus)
- ⏳ Testes de integração end-to-end mais abrangentes

### Prioridade: Média

---

## 📝 Notas de Implementação

### Ordem Sugerida de Implementação
1. **Bloqueio Automático** - Impacto direto no negócio
2. **Pagamentos Completo** - Essencial para operação
3. **Notificações Automáticas** - Melhora comunicação
4. **Melhorias Frontend** - Melhora UX
5. **Multi-tenancy** - Se necessário escalar

### Dependências
- Integração n8n ativa (para notificações)
- Credenciais de gateway de pagamento (Mercado Pago, etc)
- Configuração SMTP (para emails)

### Configurações Necessárias
- Adicionar em /settings:
  - `payment.autoGenerateInvoice` (boolean)
  - `payment.jurosTaxa` (number)
  - `payment.multaTaxa` (number)
  - `blocking.diasTolerancia` (number)
  - `blocking.notificarDiasAntes` (number)
  - `notifications.whatsapp.enabled` (boolean)
  - `notifications.email.enabled` (boolean)
  - `notifications.templates.*` (JSON)

---

**Última atualização:** 2025-10-31  
**Status do sistema:** Funcional com configurações básicas




