# 📊 Fluxo de Dados Financeiros - Como os Dados São Alimentados

## 🔄 Visão Geral do Fluxo

```
[FRONTEND] → [API/Backend] → [Database/Prisma] → [Retorna Dados] → [Frontend Exibe]
```

---

## 📍 **1. TAB "PAINEL POR PRIORIDADE"**

### **Endpoint:**
```
GET /api/financial/payments-by-priority
```

### **Como os dados são coletados:**

#### **Passo 1: Buscar do Banco de Dados**
O serviço `FinancialService.getPaymentsByPriority()` busca 3 tipos de pagamentos:

1. **Parcelas (Installments)**
   - Filtra: `status IN ['PENDING', 'OVERDUE']`
   - Inclui: usuário, embarcação, número da parcela
   - Ordena por: `dueDate` (data de vencimento)

2. **Mensalidades da Marina (MarinaPayments)**
   - Filtra: `status IN ['PENDING', 'OVERDUE']`
   - Inclui: usuário, embarcação, mês de referência
   - Ordena por: `dueDate`

3. **Cobranças Avulsas (AdHocCharges)**
   - Filtra: `status IN ['PENDING', 'OVERDUE']`
   - Inclui: usuário, embarcação, tipo de cobrança
   - Ordena por: `dueDate`

#### **Passo 2: Transformar e Unificar**
Todos os pagamentos são transformados em um formato unificado:
```javascript
{
  id: string,
  type: 'installment' | 'marina' | 'adhoc',
  userName: string,
  vesselName: string,
  amount: number,
  dueDate: Date,
  status: 'PENDING' | 'OVERDUE' | 'PAID',
  description: string
}
```

#### **Passo 3: Categorizar por Prioridade**
Os pagamentos são divididos em grupos:

- **EM ATRASO** (`overdue`):
  - Status = 'OVERDUE' OU
  - Data de vencimento < hoje

- **VENCE HOJE** (`dueToday`):
  - Data de vencimento = hoje

- **PRÓXIMOS 3 DIAS** (`dueIn3Days`):
  - Data de vencimento entre hoje e 3 dias

- **PRÓXIMOS 7 DIAS** (`dueIn7Days`):
  - Data de vencimento entre 3 e 7 dias

- **VENCE DEPOIS** (`dueLater`):
  - Data de vencimento > 7 dias

#### **Passo 4: Calcular Resumo**
```javascript
summary: {
  total: número total de pagamentos,
  totalAmount: soma de todos os valores,
  overdueCount: quantidade em atraso,
  overdueAmount: valor total em atraso,
  dueTodayCount: quantidade que vence hoje,
  dueTodayAmount: valor total que vence hoje
}
```

### **Quando os dados são atualizados?**

- **Automaticamente a cada 30 segundos** (refetchInterval)
- **Quando um pagamento é registrado** (invalidação de cache)
- **Ao mudar para a tab** (carregamento sob demanda)

---

## 📍 **2. TAB "CONTROLE FINANCEIRO"**

### **Endpoints:**
```
GET /api/users      → Lista todos os usuários
GET /api/vessels    → Lista todas as embarcações
```

### **Como os dados são coletados:**

#### **Dados de Usuários (`/api/users`):**

O backend retorna usuários com:
- Dados pessoais (nome, email, telefone, status)
- **Embarcações vinculadas** (`userVessels`)
  - Para cada embarcação vinculada:
    - Dados financeiros: `totalValue`, `downPayment`, `remainingAmount`
    - Parcelas: `totalInstallments`, parcelas pagas
    - Marina: `marinaMonthlyFee`, `marinaDueDay`
    - Status: `ACTIVE`, `PAID_OFF`, etc.

#### **Estrutura dos Dados:**
```javascript
{
  id: string,
  name: string,
  email: string,
  status: 'ACTIVE' | 'OVERDUE' | 'OVERDUE_PAYMENT' | 'BLOCKED',
  vessels: [
    {
      id: string,                    // ID do vínculo UserVessel
      vessel: {
        id: string,
        name: string
      },
      totalValue: number,            // Valor total da embarcação
      downPayment: number,            // Entrada paga
      remainingAmount: number,        // Saldo restante
      totalInstallments: number,      // Total de parcelas
      paidInstallments: number,       // Parcelas pagas
      marinaMonthlyFee: number,       // Taxa mensal da marina
      marinaDueDay: number           // Dia de vencimento
    }
  ]
}
```

#### **Dados de Embarcações (`/api/vessels`):**
- Lista simples de embarcações (nome, descrição, etc.)

#### **Cálculos no Frontend:**

1. **Estatísticas Gerais:**
   - Total de usuários: `users.length`
   - Usuários ativos: filtro `status === 'ACTIVE'`
   - Em atraso: filtro `status IN ['OVERDUE', 'OVERDUE_PAYMENT']`
   - Receita estimada: soma de `userVessel.totalValue` de todos os usuários

2. **Resumo por Embarcação:**
   - Agrupa usuários por embarcação
   - Calcula valor total e marina total por embarcação

---

## 🔄 **3. COMO OS DADOS SÃO CRIADOS/ATUALIZADOS**

### **A. Quando um usuário é vinculado a uma embarcação:**

**Frontend → Backend:**
```javascript
PUT /api/users/:userId
{
  vesselFinancials: [{
    vesselId: "xxx",
    totalValue: 25000,
    downPayment: 15000,
    totalInstallments: 10,
    marinaMonthlyFee: 350,
    marinaDueDay: 5
  }]
}
```

**Backend Processa:**

1. **Cria vínculo** `UserVessel` no banco
2. **Calcula saldo restante**: `remainingAmount = totalValue - downPayment`
3. **Gera parcelas automaticamente**:
   - Divide `remainingAmount` por `totalInstallments`
   - Cria parcelas mensais (próximos N meses)
   - Cada parcela tem: `amount`, `dueDate`, `status: 'PENDING'`

4. **Gera mensalidades da marina**:
   - Cria 12 pagamentos mensais (próximos 12 meses)
   - Define `dueDate` no dia `marinaDueDay` de cada mês
   - Valor fixo: `marinaMonthlyFee`

### **B. Quando um pagamento é registrado:**

#### **Opção 1: Pagamento Rápido (Quick Payment)**
```javascript
POST /api/financial/quick-payment/:paymentId
{ paymentType: 'installment' | 'marina' }
```

**O que acontece:**
1. Busca o pagamento no banco
2. Atualiza: `status = 'PAID'`, `paymentDate = hoje`
3. Se for parcela, verifica se embarcação foi quitada
4. Atualiza status do usuário (se necessário)

#### **Opção 2: Registrar Pagamento Manual**
```javascript
POST /api/financial/register-payment
{
  userVesselId: "xxx",
  amount: 500,
  paymentDate: "2024-01-15",
  type: 'installment' | 'marina',
  notes: "Pagamento via PIX"
}
```

**O que acontece:**
1. Cria registro de pagamento
2. Se for parcela específica, marca como paga
3. Atualiza saldo e status

### **C. Atualização automática de status:**

O sistema verifica automaticamente:

1. **Parcelas em atraso**:
   - Verifica `dueDate < hoje` E `status = 'PENDING'`
   - Atualiza para `status = 'OVERDUE'`

2. **Status do usuário**:
   - Se tem parcelas em atraso → `OVERDUE_PAYMENT`
   - Se tem marina em atraso → `OVERDUE`
   - Se tudo pago → `ACTIVE`
   - Se bloqueado → `BLOCKED`

---

## 🗄️ **4. ESTRUTURA DO BANCO DE DADOS**

### **Tabelas Principais:**

1. **`users`**
   - Dados pessoais
   - Status financeiro: `status`

2. **`user_vessels`** (vínculo usuário-embarcação)
   - `totalValue`: Valor total
   - `downPayment`: Entrada
   - `remainingAmount`: Saldo restante
   - `totalInstallments`: Quantidade de parcelas
   - `marinaMonthlyFee`: Taxa mensal marina
   - `marinaDueDay`: Dia de vencimento

3. **`installments`** (parcelas)
   - `userVesselId`: Vínculo
   - `installmentNumber`: Número da parcela
   - `amount`: Valor
   - `dueDate`: Data de vencimento
   - `status`: PENDING | OVERDUE | PAID

4. **`marina_payments`** (mensalidades da marina)
   - `userVesselId`: Vínculo
   - `amount`: Valor
   - `dueDate`: Data de vencimento
   - `status`: PENDING | OVERDUE | PAID

5. **`ad_hoc_charges`** (cobranças avulsas)
   - `userVesselId`: Vínculo
   - `title`: Título
   - `amount`: Valor
   - `dueDate`: Data de vencimento
   - `status`: PENDING | OVERDUE | PAID

---

## 📊 **5. RESUMO DO FLUXO**

```
┌─────────────────────────────────────────────────────────┐
│ 1. ADMIN CRIA/VINCULA USUÁRIO + EMBARCAÇÃO             │
│    ↓                                                     │
│ 2. BACKEND GERA AUTOMATICAMENTE:                        │
│    - Parcelas mensais (baseado em totalInstallments)   │
│    - Mensalidades da marina (próximos 12 meses)        │
│    ↓                                                     │
│ 3. DADOS SALVOS NO BANCO:                               │
│    - user_vessels (dados financeiros)                  │
│    - installments (parcelas)                           │
│    - marina_payments (mensalidades)                     │
│    ↓                                                     │
│ 4. FRONTEND BUSCA DADOS:                                │
│    - /api/financial/payments-by-priority               │
│      → Agrupa por prioridade                           │
│    - /api/users                                         │
│      → Inclui vessels com dados financeiros             │
│    ↓                                                     │
│ 5. QUANDO PAGAMENTO É REGISTRADO:                      │
│    - Atualiza status: PENDING → PAID                   │
│    - Recalcula saldos                                   │
│    - Atualiza status do usuário                        │
│    - Frontend atualiza automaticamente (cache)          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 **Pontos Importantes:**

1. **Geração Automática**: Parcelas e mensalidades são criadas automaticamente quando você vincula embarcação ao usuário
2. **Atualização em Tempo Real**: Tab "Prioridade" atualiza a cada 30 segundos
3. **Carregamento Otimizado**: Cada tab só carrega seus dados quando está ativa
4. **Status Automático**: Sistema atualiza status de usuários baseado em pagamentos em atraso
5. **Unificação de Dados**: Todos os tipos de pagamento (parcelas, marina, avulsos) são tratados de forma unificada




