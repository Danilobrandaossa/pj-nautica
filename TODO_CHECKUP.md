# 📋 TO-DO LIST - Sistema de Embarcações

**Criado em:** 30/10/2025  
**Baseado em:** CHECKUP_REPORT.md  
**Status:** 🟢 Em Progresso

---

## 🎯 LEGENDA DE PRIORIDADES

- 🔴 **PRIORIDADE ALTA** - Crítico, resolver primeiro
- 🟡 **PRIORIDADE MÉDIA** - Importante, resolver em breve
- 🟢 **PRIORIDADE BAIXA** - Melhorias, resolver quando possível

---

## ✅ CORREÇÕES JÁ APLICADAS

- [x] **Corrigir 8 erros de TypeScript nos controllers** ✅
- [x] **Ativar TypeScript strict mode no backend** ✅
- [x] **Remover dependências duplicadas** ✅
- [x] **Melhorar validação de JWT secrets em produção** ✅
- [x] **Corrigir Service Worker interferindo no dev** ✅

---

## 🔴 PRIORIDADE ALTA - URGENTE

### Testes e Qualidade
- [ ] **Configurar Jest no backend**
  - [ ] Instalar `jest`, `@types/jest`, `ts-jest`
  - [ ] Criar `jest.config.ts`
  - [ ] Configurar scripts de teste no `package.json`
  - [ ] **Estimativa:** 30 minutos

- [ ] **Implementar testes unitários básicos**
  - [ ] Testes de autenticação (login, refresh, logout)
  - [ ] Testes de criação de usuário
  - [ ] Testes de criação de agendamento
  - [ ] Testes de validações de negócio (24h antecedência)
  - [ ] **Estimativa:** 4-6 horas

- [ ] **Implementar testes de integração**
  - [ ] Testes de endpoints principais da API
  - [ ] Testes de integração com banco de dados
  - [ ] **Estimativa:** 4-6 horas

### CI/CD e Automação
- [ ] **Configurar GitHub Actions (ou similar)**
  - [ ] Criar `.github/workflows/ci.yml`
  - [ ] Configurar lint automático
  - [ ] Configurar testes automáticos
  - [ ] Configurar build automático
  - [ ] Configurar gates de qualidade (lint, test, build devem passar)
  - [ ] **Estimativa:** 2-3 horas

- [ ] **Adicionar análise de código (SonarQube/CodeQL)**
  - [ ] Integrar SonarQube ou GitHub CodeQL
  - [ ] Configurar relatórios de qualidade
  - [ ] **Estimativa:** 2 horas

### Segurança
- [ ] **Revisar todas as validações de input**
  - [ ] Verificar validações numéricas em todos os controllers
  - [ ] Verificar sanitização de strings longas
  - [ ] Adicionar validações adicionais onde necessário
  - [ ] **Estimativa:** 2-3 horas

- [ ] **Implementar validação de CSRF tokens**
  - [ ] Instalar `csurf` ou similar
  - [ ] Adicionar middleware de CSRF
  - [ ] Configurar tokens em formulários
  - [ ] **Estimativa:** 2-3 horas

- [ ] **Adicionar rate limiting específico para endpoints sensíveis**
  - [ ] Rate limit mais restritivo para `/api/auth/login`
  - [ ] Rate limit para `/api/users` (criação de usuários)
  - [ ] **Estimativa:** 1 hora

---

## 🟡 PRIORIDADE MÉDIA - IMPORTANTE

### Performance Frontend
- [ ] **Implementar lazy loading de rotas**
  - [ ] Converter importações de páginas para `React.lazy()`
  - [ ] Adicionar `Suspense` com fallback de loading
  - [ ] Testar carregamento de rotas
  - [ ] **Estimativa:** 2-3 horas

- [ ] **Adicionar paginação em listagens grandes**
  - [ ] Lista de usuários (UsersPage)
  - [ ] Lista de agendamentos (BookingsPage)
  - [ ] Lista de embarcações (VesselsPage)
  - [ ] Histórico financeiro (FinancialHistoryPage)
  - [ ] **Estimativa:** 4-6 horas

- [ ] **Otimizar bundle size**
  - [ ] Analisar bundle com `npm run build -- --analyze`
  - [ ] Identificar e remover imports desnecessários
  - [ ] Implementar tree-shaking onde necessário
  - [ ] **Estimativa:** 2-3 horas

- [ ] **Otimizar imagens**
  - [ ] Converter imagens para formatos modernos (WebP)
  - [ ] Implementar lazy loading de imagens
  - [ ] Adicionar dimensões corretas nas imagens
  - [ ] **Estimativa:** 2 horas

### Performance Backend
- [ ] **Implementar cache (Redis)**
  - [ ] Instalar e configurar Redis
  - [ ] Adicionar cache para consultas frequentes
  - [ ] Cache de lista de embarcações
  - [ ] Cache de dados do dashboard
  - [ ] **Estimativa:** 4-6 horas

- [ ] **Revisar e otimizar queries N+1**
  - [ ] Auditar todas as queries com Prisma
  - [ ] Usar `include` adequadamente
  - [ ] Adicionar `select` para limitar campos retornados
  - [ ] **Estimativa:** 3-4 horas

- [ ] **Adicionar índices adicionais no banco**
  - [ ] Índice em `users.status` (se consultas frequentes)
  - [ ] Índice composto em `bookings(bookingDate, status)`
  - [ ] Revisar outros índices necessários
  - [ ] **Estimativa:** 1-2 horas

### Monitoramento e Observabilidade
- [ ] **Implementar monitoramento de erros**
  - [ ] Integrar Sentry ou similar
  - [ ] Configurar alertas para erros críticos
  - [ ] Adicionar contexto nas notificações de erro
  - [ ] **Estimativa:** 2-3 horas

- [ ] **Adicionar métricas de performance**
  - [ ] Tempo de resposta de endpoints
  - [ ] Taxa de erro por endpoint
  - [ ] Uso de memória e CPU
  - [ ] **Estimativa:** 3-4 horas

- [ ] **Implementar health checks avançados**
  - [ ] Verificar conexão com banco
  - [ ] Verificar conexão com Redis (se implementado)
  - [ ] Verificar serviços externos (n8n)
  - [ ] **Estimativa:** 1-2 horas

### Documentação
- [ ] **Adicionar Swagger/OpenAPI**
  - [ ] Instalar `swagger-ui-express` ou `@nestjs/swagger`
  - [ ] Documentar todos os endpoints
  - [ ] Adicionar exemplos de request/response
  - [ ] Disponibilizar em `/api-docs`
  - [ ] **Estimativa:** 4-6 horas

- [ ] **Criar CONTRIBUTING.md**
  - [ ] Padrões de código
  - [ ] Processo de commit
  - [ ] Como rodar testes
  - [ ] Como fazer PR
  - [ ] **Estimativa:** 1-2 horas

- [ ] **Documentar variáveis de ambiente**
  - [ ] Criar `.env.example` completo
  - [ ] Documentar cada variável no README
  - [ ] Adicionar valores padrão seguros
  - [ ] **Estimativa:** 1 hora

---

## 🟢 PRIORIDADE BAIXA - MELHORIAS

### Qualidade de Código
- [ ] **Remover código duplicado**
  - [ ] Identificar lógicas repetidas em controllers
  - [ ] Extrair para services compartilhados
  - [ ] Refatorar código duplicado
  - [ ] **Estimativa:** 3-4 horas

- [ ] **Padronizar tratamento de erros**
  - [ ] Garantir que todos os controllers usem `next(error)`
  - [ ] Remover `res.status().json()` diretos
  - [ ] Usar error handler centralizado
  - [ ] **Estimativa:** 2-3 horas

- [ ] **Adicionar tipos mais específicos**
  - [ ] Buscar e remover todos os `any`
  - [ ] Criar tipos customizados onde necessário
  - [ ] Adicionar tipos de retorno explícitos
  - [ ] **Estimativa:** 4-6 horas

- [ ] **Adicionar JSDoc em métodos complexos**
  - [ ] Documentar métodos de negócio complexos
  - [ ] Adicionar exemplos de uso
  - [ ] Documentar parâmetros e retornos
  - [ ] **Estimativa:** 3-4 horas

### Funcionalidades
- [ ] **Implementar soft deletes**
  - [ ] Adicionar campo `deletedAt` nas entidades principais
  - [ ] Ajustar queries para não retornar deletados
  - [ ] Implementar restauração de registros
  - [ ] **Estimativa:** 4-6 horas

- [ ] **Melhorar tratamento de erros no frontend**
  - [ ] Criar componente de Error Boundary
  - [ ] Adicionar feedback visual consistente
  - [ ] Melhorar mensagens de erro para usuário
  - [ ] **Estimativa:** 2-3 horas

- [ ] **Adicionar testes E2E**
  - [ ] Configurar Playwright ou Cypress
  - [ ] Testes de fluxo completo de criação de reserva
  - [ ] Testes de login e navegação
  - [ ] **Estimativa:** 6-8 horas

### UX/UI
- [ ] **Melhorar feedback visual**
  - [ ] Estados de loading consistentes
  - [ ] Mensagens de erro mais claras
  - [ ] Feedback de sucesso em ações
  - [ ] **Estimativa:** 3-4 horas

- [ ] **Melhorar acessibilidade**
  - [ ] Adicionar labels em todos os inputs
  - [ ] Melhorar contraste de cores
  - [ ] Suporte a navegação por teclado
  - [ ] **Estimativa:** 4-6 horas

- [ ] **Adicionar testes visuais (UI)**
  - [ ] Configurar Chromatic ou similar
  - [ ] Testes de regressão visual
  - [ ] **Estimativa:** 2-3 horas

### Infraestrutura
- [ ] **Implementar rotação de secrets**
  - [ ] Script para rotação de JWT secrets
  - [ ] Documentação do processo
  - [ ] **Estimativa:** 2-3 horas

- [ ] **Melhorar configuração de backup**
  - [ ] Scripts automatizados de backup do banco
  - [ ] Configurar backup automático
  - [ ] Testar restauração
  - [ ] **Estimativa:** 3-4 horas

- [ ] **Adicionar versionamento de API**
  - [ ] Estruturar versão nas rotas (`/api/v1/...`)
  - [ ] Documentar versões suportadas
  - [ ] **Estimativa:** 2-3 horas

---

## 📊 ESTIMATIVA TOTAL

### 🔴 Prioridade Alta
- **Tempo estimado:** 20-28 horas
- **Sprint sugerida:** 1-2 sprints (2-3 semanas)

### 🟡 Prioridade Média
- **Tempo estimado:** 45-65 horas
- **Sprint sugerida:** 3-4 sprints (6-8 semanas)

### 🟢 Prioridade Baixa
- **Tempo estimado:** 50-70 horas
- **Sprint sugerida:** 4-5 sprints (8-10 semanas)

**TOTAL:** ~115-163 horas (aproximadamente 3-4 meses trabalhando meio período)

---

## 🎯 PLANO DE AÇÃO SUGERIDO

### Sprint 1 (Semana 1-2) - Fundação
- ✅ Correções já aplicadas
- [ ] Configurar Jest
- [ ] Implementar testes unitários básicos (auth, users)
- [ ] Configurar GitHub Actions básico

### Sprint 2 (Semana 3-4) - Qualidade
- [ ] Implementar testes de integração
- [ ] Adicionar Swagger/OpenAPI
- [ ] Revisar validações de input
- [ ] Adicionar rate limiting específico

### Sprint 3 (Semana 5-6) - Performance
- [ ] Implementar lazy loading
- [ ] Adicionar paginação
- [ ] Otimizar bundle size
- [ ] Implementar cache (Redis)

### Sprint 4 (Semana 7-8) - Monitoramento
- [ ] Implementar Sentry
- [ ] Adicionar métricas de performance
- [ ] Health checks avançados
- [ ] Documentação completa

---

## 📝 NOTAS

- ⚠️ **Importante:** Testes devem ser prioridade máxima
- ⚠️ **Importante:** CI/CD deve ser configurado após testes básicos
- 💡 **Dica:** Trabalhar em iterações pequenas (2-3 tarefas por vez)
- 💡 **Dica:** Revisar e atualizar esta lista após cada sprint
- 💡 **Dica:** Marcar tarefas concluídas e mover para "Correções Aplicadas"

---

## ✅ PROGRESSO GERAL

- **Correções Críticas:** 5/5 ✅ (100%)
- **Prioridade Alta:** 0/12 (0%)
- **Prioridade Média:** 0/21 (0%)
- **Prioridade Baixa:** 0/20 (0%)

**TOTAL:** 5/58 tarefas concluídas (8.6%)

---

**Última atualização:** 30/10/2025  
**Próxima revisão:** Após conclusão do Sprint 1






