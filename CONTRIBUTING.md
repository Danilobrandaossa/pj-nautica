# Guia de Contribuição

Este documento fornece diretrizes e padrões para contribuir com o projeto Embarcações.

## 🚀 Começando

### Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- npm ou yarn

### Setup Local

1. Clone o repositório:
```bash
git clone <url-do-repositório>
cd pj-nautica
```

2. Configure as variáveis de ambiente:
```bash
cd backend
cp .env.example .env
# Edite o .env com suas configurações
```

3. Instale as dependências:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

4. Configure o banco de dados:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
npm run seed
```

5. Inicie os servidores:
```bash
# Backend (em um terminal)
cd backend
npm run dev

# Frontend (em outro terminal)
cd frontend
npm run dev
```

## 📝 Padrões de Código

### TypeScript

- Use TypeScript para todo o código
- Ative o modo `strict` no `tsconfig.json`
- Evite usar `any` - prefira tipos específicos
- Use interfaces ou tipos para objetos complexos

```typescript
// ✅ Bom
interface UserData {
  email: string;
  name: string;
}

// ❌ Ruim
const user: any = { ... }
```

### Estrutura de Arquivos

- **Backend**: `src/controllers`, `src/services`, `src/routes`, `src/middleware`
- **Frontend**: `src/pages`, `src/components`, `src/hooks`, `src/utils`
- Use nomes descritivos e em camelCase para arquivos

### Nomenclatura

- **Variáveis/Funções**: camelCase (`getUserById`)
- **Classes**: PascalCase (`UserService`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Arquivos**: kebab-case (`user.service.ts`) ou camelCase (`userService.ts`)

### Imports

- Organize imports: bibliotecas externas → internas → relativos
- Use imports absolutos quando possível (`@/components`)

```typescript
// ✅ Bom
import express from 'express';
import { UserService } from '../services/user.service';
import { AppError } from '../middleware/error-handler';

// ❌ Ruim
import { UserService } from '../services/user.service';
import express from 'express';
```

## 🏗️ Arquitetura

### Backend

#### Padrão Controller → Service → Prisma

```
Controller (validação) → Service (lógica) → Prisma (dados)
```

- **Controllers**: Validam inputs, chamam services, retornam respostas
- **Services**: Contêm a lógica de negócio
- **Prisma**: Acesso aos dados

```typescript
// Controller
async create(req: Request, res: Response, next: NextFunction) {
  const validatedData = await validateBody(req, createUserSchema);
  const user = await userService.create(validatedData, req.user.id);
  return res.status(201).json(user);
}

// Service
async create(data: CreateUserData, createdBy: string) {
  // Lógica de negócio aqui
  return await prisma.user.create({ ... });
}
```

#### Tratamento de Erros

- Use `AppError` para erros customizados
- Sempre passe erros para `next()` em controllers
- Use try/catch em services

```typescript
// ✅ Bom
throw new AppError(404, 'Usuário não encontrado');

// ❌ Ruim
throw new Error('Usuário não encontrado');
```

#### Validação

- Use Zod para validação de inputs
- Valide sempre em controllers antes de chamar services
- Valide dados de entrada, nunca confie no cliente

```typescript
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(3),
});

const validatedData = await validateBody(req, createUserSchema);
```

### Frontend

#### Estrutura de Componentes

- Componentes funcionais com hooks
- Separe lógica em hooks customizados quando apropriado
- Use TypeScript para props e state

```typescript
// ✅ Bom
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  // ...
};
```

#### Gerenciamento de Estado

- Use Zustand para estado global
- Use React Query para dados do servidor
- Evite prop drilling - use context se necessário

#### Tratamento de Erros

- Use Error Boundary para erros de renderização
- Trate erros de API com try/catch
- Mostre mensagens claras ao usuário

## 🧪 Testes

### Backend

- **Unitários**: Teste services e utilities isoladamente
- **Integração**: Teste endpoints completos com banco de dados
- Use Jest como framework de testes

```typescript
// Exemplo de teste unitário
describe('UserService', () => {
  it('should create a user', async () => {
    const userData = { email: 'test@example.com', name: 'Test' };
    const user = await userService.create(userData, 'admin-id');
    expect(user).toBeDefined();
    expect(user.email).toBe(userData.email);
  });
});
```

### Frontend

- Teste componentes com React Testing Library
- Teste integração de usuário (cliques, inputs)
- Mantenha cobertura mínima de 70%

### Executar Testes

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 🔒 Segurança

### Boas Práticas

- **Nunca** commite secrets ou credenciais
- Use variáveis de ambiente para configurações sensíveis
- Valide e sanitize todos os inputs
- Use HTTPS em produção
- Implemente rate limiting em endpoints sensíveis
- Use CSRF tokens para operações mutáveis

### Autenticação

- Use JWT para tokens de acesso
- Implemente refresh tokens
- Armazene senhas com hash (bcrypt)
- Valide tokens em todas as rotas protegidas

## 📊 Banco de Dados

### Migrations

- Use Prisma Migrate para mudanças no schema
- Sempre gere migrations para mudanças no schema
- Teste migrations em ambiente de desenvolvimento primeiro

```bash
npx prisma migrate dev --name add_user_status
```

### Queries

- Use `select` para buscar apenas campos necessários
- Evite N+1 queries - use `include` ou joins apropriados
- Adicione índices para queries frequentes
- Use transações para operações atômicas

```typescript
// ✅ Bom - select apenas campos necessários
const users = await prisma.user.findMany({
  select: { id: true, email: true, name: true },
});

// ❌ Ruim - busca todos os campos e relações
const users = await prisma.user.findMany();
```

## 🎨 UI/UX

### Design System

- Use componentes do shadcn/ui
- Mantenha consistência visual
- Siga padrões de acessibilidade (WCAG)

### Responsividade

- Design mobile-first
- Teste em diferentes tamanhos de tela
- Use Tailwind CSS para layouts responsivos

## 📦 Commits

### Formato

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <descrição curta>

<descrição detalhada opcional>

<footer opcional>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Exemplos**:

```
feat(auth): adiciona refresh token
fix(bookings): corrige validação de data
docs(readme): atualiza instruções de instalação
refactor(services): extrai lógica comum
```

### Mensagens

- Use imperativo ("adiciona" não "adicionado")
- Seja específico e conciso
- Referencie issues quando apropriado

## 🔄 Pull Requests

### Processo

1. Crie uma branch a partir de `main`: `git checkout -b feat/nova-funcionalidade`
2. Faça suas alterações e commits
3. Execute testes e lint: `npm test && npm run lint`
4. Push para o repositório: `git push origin feat/nova-funcionalidade`
5. Abra um Pull Request

### Checklist

- [ ] Código segue os padrões do projeto
- [ ] Testes passam localmente
- [ ] Documentação atualizada (se necessário)
- [ ] Sem erros de lint
- [ ] Commits seguem o formato Conventional Commits
- [ ] PR tem descrição clara do que foi alterado

### Revisão

- Mantenha PRs pequenos e focados
- Responda a comentários de revisão
- Mantenha branch atualizada com `main`

## 🐛 Reportar Bugs

Use o template de issue para bugs:

- **Título**: Descrição curta do bug
- **Descrição**: Passos para reproduzir, comportamento esperado vs atual
- **Ambiente**: Node version, OS, etc
- **Logs**: Erros ou logs relevantes

## 💡 Sugerir Funcionalidades

Use o template de issue para features:

- **Título**: Descrição curta da funcionalidade
- **Descrição**: Por que isso seria útil
- **Exemplos**: Casos de uso
- **Alternativas**: Outras soluções consideradas

## 📚 Documentação

- Documente funções complexas com JSDoc
- Mantenha README atualizado
- Documente APIs com OpenAPI/Swagger
- Adicione exemplos quando apropriado

## 🤝 Código de Conduta

- Seja respeitoso e profissional
- Aceite feedback construtivo
- Ajude outros contribuidores
- Mantenha o foco no projeto

## ❓ Dúvidas?

Se tiver dúvidas, abra uma issue ou entre em contato com os mantenedores.

---

**Obrigado por contribuir! 🎉**






