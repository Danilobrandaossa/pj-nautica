# Tarefas Pendentes

## Resumo
**Total de tarefas pendentes: 9**

---

## 🟢 Prioridade BAIXA (9 tarefas)

### 1. **remove-duplicates**
**Status:** 🔴 Pendente  
**Descrição:** Remover código duplicado (extrair para services compartilhados)  
**Arquivos envolvidos:**
- Backend services que podem ter lógica duplicada
- Controllers com validações repetidas
- Frontend components com lógica similar

### 2. **standardize-errors**
**Status:** 🔴 Pendente  
**Descrição:** Padronizar tratamento de erros (todos usarem next(error))  
**Arquivos envolvidos:**
- `backend/src/controllers/*.ts` - Garantir que todos usam `next(error)`
- Revisar todos os try/catch nos controllers

### 3. **add-jsdoc**
**Status:** 🔴 Pendente  
**Descrição:** Adicionar JSDoc em métodos complexos  
**Arquivos envolvidos:**
- `backend/src/services/*.ts` - Documentar métodos complexos
- `backend/src/controllers/*.ts` - Documentar endpoints
- Métodos de lógica de negócio

### 4. **soft-deletes**
**Status:** 🔴 Pendente  
**Descrição:** Implementar soft deletes nas entidades principais  
**Arquivos envolvidos:**
- `backend/prisma/schema.prisma` - Adicionar campo `deletedAt`
- `backend/src/services/*.ts` - Atualizar lógica de delete
- Migrations do Prisma

### 5. **e2e-tests**
**Status:** 🔴 Pendente  
**Descrição:** Adicionar testes E2E com Playwright/Cypress  
**Arquivos envolvidos:**
- Instalar Playwright ou Cypress
- Criar testes E2E para fluxos críticos (login, booking, etc)
- Configurar CI/CD para testes E2E

### 6. **accessibility**
**Status:** 🔴 Pendente  
**Descrição:** Melhorar acessibilidade (labels, contraste, navegação teclado)  
**Arquivos envolvidos:**
- `frontend/src/pages/*.tsx` - Adicionar labels, ARIA
- Verificar contraste de cores
- Testar navegação por teclado
- Adicionar focus indicators

### 7. **visual-tests**
**Status:** 🔴 Pendente  
**Descrição:** Adicionar testes visuais (Chromatic ou similar)  
**Arquivos envolvidos:**
- Configurar Chromatic ou Storybook
- Criar stories para componentes principais
- Configurar CI/CD para visual regression tests

### 8. **secret-rotation**
**Status:** 🔴 Pendente  
**Descrição:** Implementar rotação de secrets (JWT)  
**Arquivos envolvidos:**
- Sistema de rotação de JWT secrets
- Migração de tokens antigos
- Documentação do processo

### 9. **backup-automation**
**Status:** 🔴 Pendente  
**Descrição:** Melhorar configuração de backup (scripts automatizados)  
**Arquivos envolvidos:**
- Scripts de backup do banco de dados
- Configuração de agendamento (cron)
- Documentação de restore

### 10. **api-versioning**
**Status:** 🔴 Pendente  
**Descrição:** Adicionar versionamento de API (/api/v1/...)  
**Arquivos envolvidos:**
- `backend/src/routes/*.ts` - Adicionar prefixo `/api/v1`
- `backend/src/server.ts` - Configurar rotas versionadas
- Documentação da API versionada

---

## 📊 Tarefas Concluídas

✅ **Total concluídas: 21 tarefas**

### Prioridade ALTA (10/10) ✅
- Configurar Jest no backend
- Implementar testes unitários de autenticação
- Implementar testes unitários de criação de usuário
- Implementar testes unitários de agendamentos
- Implementar testes de integração
- Configurar GitHub Actions
- Adicionar análise de código (CodeQL)
- Revisar todas as validações de input
- Implementar validação de CSRF tokens
- Adicionar rate limiting específico

### Prioridade MÉDIA (11/11) ✅
- Implementar lazy loading de rotas no frontend
- Adicionar paginação em listagens grandes
- Otimizar bundle size
- Otimizar imagens (WebP, lazy loading)
- Implementar cache com Redis (in-memory cache)
- Revisar e otimizar queries N+1
- Adicionar índices adicionais no banco
- Implementar monitoramento de erros com Sentry
- Adicionar métricas de performance
- Implementar health checks avançados
- Adicionar documentação Swagger/OpenAPI
- Criar CONTRIBUTING.md
- Documentar variáveis de ambiente

### Prioridade BAIXA (3/13) ✅
- Remover todos os tipos any (parcial - alguns removidos)
- Melhorar tratamento de erros no frontend (Error Boundary)
- Melhorar feedback visual (loading, erros, sucesso consistentes)

---

## 🎯 Próximos Passos Recomendados

1. **Prioridade Alta (Qualidade):**
   - `standardize-errors` - Garantir consistência no tratamento de erros
   - `add-jsdoc` - Melhorar documentação do código

2. **Prioridade Média (Funcionalidades):**
   - `soft-deletes` - Proteger dados importantes
   - `e2e-tests` - Testar fluxos completos do usuário

3. **Prioridade Baixa (Melhorias):**
   - `accessibility` - Melhorar acessibilidade da aplicação
   - `remove-duplicates` - Limpar código duplicado

---

**Última atualização:** Baseado no TODO atual do projeto






