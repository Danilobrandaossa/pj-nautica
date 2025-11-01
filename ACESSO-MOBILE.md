# 📱 COMO ACESSAR O SISTEMA NO CELULAR

## 🔧 **CONFIGURAÇÃO NECESSÁRIA:**

### **1. Verificar IP da Máquina:**
```
IP da sua máquina: 192.168.1.105
```

### **2. Configurar Firewall do Windows:**

**Opção A - Via Interface Gráfica:**
1. Abra o "Windows Defender Firewall"
2. Clique em "Configurações Avançadas"
3. Clique em "Regras de Entrada" → "Nova Regra"
4. Selecione "Porta" → "TCP" → "Porta específica: 3000"
5. Selecione "Permitir a conexão"
6. Marque todas as opções (Domínio, Privado, Público)
7. Nome: "Docker Frontend"
8. Clique em "Concluir"

**Opção B - Via PowerShell (Execute como Administrador):**
```powershell
netsh advfirewall firewall add rule name="Docker Frontend" dir=in action=allow protocol=TCP localport=3000
```

### **3. Verificar se o Sistema está Rodando:**
```bash
# Verificar containers
docker ps

# Verificar logs do frontend
docker-compose logs frontend
```

## 📱 **ACESSO NO CELULAR:**

### **Requisitos:**
- ✅ Celular na **MESMA rede WiFi** que o computador
- ✅ Navegador atualizado (Chrome, Safari, Firefox)

### **URL para Acessar:**
```
http://192.168.1.105:3000
```

### **Credenciais de Login:**

#### **👨‍💼 Administrador:**
- **Email:** `admin@embarcacoes.com`
- **Senha:** `Admin@123`

#### **👤 Cliente:**
- **Email:** `teste@cliente.com`
- **Senha:** `123456`

## 🔍 **TROUBLESHOOTING:**

### **Se não conseguir acessar:**

1. **Verificar rede:**
   - Celular e computador na mesma WiFi
   - Testar ping: `ping 192.168.1.105`

2. **Verificar firewall:**
   - Desabilitar temporariamente o Windows Firewall
   - Ou adicionar regra para porta 3000

3. **Verificar Docker:**
   ```bash
   docker-compose logs frontend
   docker-compose restart frontend
   ```

4. **Testar no computador primeiro:**
   - Acesse `http://localhost:3000`
   - Se funcionar localmente, o problema é o firewall

### **Comandos Úteis:**
```bash
# Reiniciar sistema
docker-compose restart

# Ver logs
docker-compose logs frontend

# Verificar IP
ipconfig | findstr "IPv4"
```

## 🎯 **FUNCIONALIDADES DISPONÍVEIS NO MOBILE:**

### **👨‍💼 Área Administrativa:**
- Dashboard com estatísticas
- Gerenciar agendamentos (13 agendamentos de demo)
- Gerenciar usuários (6 usuários cadastrados)
- Notificações (18 notificações ativas)
- Analytics e relatórios
- Logs de auditoria (65 registros)

### **👤 Área do Cliente:**
- Meus agendamentos
- Minhas finanças
- Notificações pessoais
- Perfil do usuário

## 📊 **DADOS DE DEMONSTRAÇÃO INCLUÍDOS:**
- ✅ 13 agendamentos com diferentes status
- ✅ 6 usuários cadastrados
- ✅ 18 notificações ativas
- ✅ 65 logs de auditoria
- ✅ 3 embarcações disponíveis
- ✅ Layout responsivo para mobile

## 🚀 **SISTEMA PRONTO PARA DEMONSTRAÇÃO!**

**O sistema está totalmente funcional com dados realistas para apresentação ao cliente.**
