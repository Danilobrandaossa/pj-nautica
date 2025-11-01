# 🚤 PJ-NAUTICA - Sistema de Embarcações

## 📋 **DESCRIÇÃO DO PROJETO**

Este é uma cópia completa do Sistema de Embarcações desenvolvido, pronto para uso e demonstração. O sistema é uma aplicação web completa para gerenciamento de agendamentos de embarcações.

## 🎯 **FUNCIONALIDADES PRINCIPAIS**

### 👨‍💼 **Área Administrativa:**
- **Dashboard** com estatísticas em tempo real
- **Gerenciamento de Embarcações** (cadastro, edição, exclusão)
- **Agendamentos** com calendário interativo
- **Controle de Usuários** e permissões
- **Notificações** automáticas
- **Relatórios Financeiros** detalhados
- **Analytics** e métricas de uso
- **Logs de Auditoria** completos
- **Bloqueios de Datas** (específicos e semanais)
- **Autenticação 2FA** para segurança

### 👤 **Área do Cliente:**
- **Meus Agendamentos** pessoais
- **Minhas Finanças** e histórico
- **Notificações** pessoais
- **Perfil** e configurações

## 🚀 **COMO EXECUTAR O PROJETO**

### **Pré-requisitos:**
- Docker Desktop instalado
- Windows 10/11
- 4GB RAM disponível

### **Passo a Passo:**

1. **Abra o PowerShell como Administrador**
2. **Navegue até a pasta do projeto:**
   ```powershell
   cd "C:\Users\ueles\OneDrive\Área de Trabalho\pj-nautica"
   ```

3. **Execute o sistema:**
   ```powershell
   docker-compose up -d
   ```

4. **Aguarde a inicialização (2-3 minutos)**

5. **Acesse o sistema:**
   - **Desktop:** `http://localhost:3000`
   - **Mobile:** `http://192.168.1.105:3000`

## 🔑 **CREDENCIAIS DE ACESSO**

### **👨‍💼 Administrador:**
- **Email:** `admin@embarcacoes.com`
- **Senha:** `Admin@123`

### **👤 Cliente de Teste:**
- **Email:** `teste@cliente.com`
- **Senha:** `123456`

## 📱 **ACESSO MOBILE E PWA**

### **Configuração Necessária:**
1. **Certifique-se** que o celular está na **MESMA rede WiFi**
2. **Configure o Firewall** do Windows:
   - Abra "Windows Defender Firewall"
   - Clique em "Configurações Avançadas"
   - Clique em "Regras de Entrada" → "Nova Regra"
   - Selecione "Porta" → "TCP" → "Porta específica: 3000"
   - Selecione "Permitir a conexão"
   - Nome: "Docker Frontend"

### **URL para Mobile:**
```
http://192.168.1.105:3000
```

### **📱 INSTALAÇÃO COMO APP NATIVO:**
1. **Acesse** a URL no celular
2. **Banner aparece** automaticamente na parte inferior
3. **Clique** em "Instalar" no banner
4. **Confirme** a instalação no popup
5. **App instalado** na tela inicial como aplicativo nativo!

### **🎯 Funcionalidades PWA:**
- ✅ **Ícone** na tela inicial
- ✅ **Abertura** instantânea
- ✅ **Notificações** push em tempo real
- ✅ **Funciona** offline
- ✅ **Sincronização** automática
- ✅ **Experiência** de app nativo

## 📊 **DADOS DE DEMONSTRAÇÃO INCLUÍDOS**

- ✅ **13 agendamentos** com diferentes status
- ✅ **6 usuários** cadastrados
- ✅ **18 notificações** ativas
- ✅ **65 logs de auditoria**
- ✅ **3 embarcações** disponíveis
- ✅ **Bloqueios** configurados

## 🛠️ **COMANDOS ÚTEIS**

### **Verificar Status:**
```powershell
docker-compose ps
```

### **Ver Logs:**
```powershell
docker-compose logs frontend
docker-compose logs backend
```

### **Reiniciar Sistema:**
```powershell
docker-compose restart
```

### **Parar Sistema:**
```powershell
docker-compose down
```

## 📁 **ESTRUTURA DO PROJETO**

```
pj-nautica/
├── backend/           # API Node.js + Express
├── frontend/          # React + Vite
├── nginx/             # Configuração Nginx
├── docker-compose.yml # Orquestração Docker
└── README.md          # Documentação
```

## 🔧 **TECNOLOGIAS UTILIZADAS**

- **Backend:** Node.js, Express, TypeScript, Prisma
- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Database:** PostgreSQL
- **Containerização:** Docker, Docker Compose
- **Autenticação:** JWT, 2FA
- **Notificações:** n8n (automação)

## 📞 **SUPORTE**

Para dúvidas ou problemas:
1. Verifique se o Docker Desktop está rodando
2. Confirme se as portas 3000 e 3001 estão livres
3. Verifique os logs com `docker-compose logs`
4. Reinicie o sistema com `docker-compose restart`

## 🎉 **SISTEMA PRONTO PARA DEMONSTRAÇÃO!**

**O PJ-NAUTICA está 100% funcional e pronto para impressionar clientes com todas as funcionalidades de um sistema profissional de gerenciamento de embarcações.**

---
**Desenvolvido com ❤️ para demonstrações profissionais**
