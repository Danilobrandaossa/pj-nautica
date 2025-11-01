# 🚀 Deploy Zerado - Sistema Pronto para Uso

## ✅ Sistema Configurado para Subir Zerado

O sistema foi configurado para subir **completamente zerado**, sem dados de exemplo. Apenas sua conta de admin será criada.

## 🔑 Suas Credenciais de Admin

- **Email:** `contato@danilobrandao.com.br`
- **Senha:** `Zy598859D@n`

## 🚀 Como Fazer o Deploy

### 1. **Executar o Script de Deploy**
```bash
chmod +x deploy-completo.sh
./deploy-completo.sh
```

### 2. **O que o Script Faz Automaticamente:**
- ✅ Instala Docker e dependências
- ✅ Cria estrutura de diretórios
- ✅ Configura arquivos de produção
- ✅ Sobe todos os containers
- ✅ Executa migrações do banco
- ✅ **Cria sua conta de admin**
- ✅ Inicializa sistema zerado

### 3. **Após o Deploy:**
1. Acesse: `http://145.223.93.235`
2. Faça login com suas credenciais
3. O sistema estará **completamente zerado**
4. Comece cadastrando suas embarcações
5. Cadastre seus usuários
6. Configure conforme necessário

## 📋 O que Estará Disponível

### ✅ **Sistema Zerado:**
- ❌ Nenhuma embarcação cadastrada
- ❌ Nenhum usuário (exceto seu admin)
- ❌ Nenhum agendamento
- ❌ Nenhum bloqueio
- ✅ Apenas sua conta de admin
- ✅ Sistema funcional e pronto

### 🎯 **Próximos Passos Após Login:**
1. **Cadastrar Embarcações**
   - Nome, descrição, capacidade
   - Localização
   - Limite de reservas

2. **Cadastrar Usuários**
   - Dados pessoais
   - Vincular às embarcações
   - Configurar dados financeiros

3. **Configurar Sistema**
   - Bloqueios de datas (se necessário)
   - Bloqueios semanais (se necessário)
   - Configurar n8n para WhatsApp

## 🔧 Comandos Úteis

### **Verificar Status:**
```bash
docker-compose -f docker-compose.prod.yml ps
```

### **Ver Logs:**
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### **Reiniciar Sistema:**
```bash
docker-compose -f docker-compose.prod.yml restart
```

### **Parar Sistema:**
```bash
docker-compose -f docker-compose.prod.yml down
```

## 🛡️ Segurança

- ✅ Sua senha está criptografada com bcrypt
- ✅ Sistema com todas as proteções de segurança
- ✅ Logs de auditoria ativos
- ✅ Rate limiting configurado

## 📱 URLs de Acesso

- **Sistema:** http://145.223.93.235
- **API:** http://145.223.93.235/api
- **n8n:** http://145.223.93.235:5678

## ⚠️ Importante

1. **Mantenha suas credenciais seguras**
2. **Altere a senha se desejar** (dentro do sistema)
3. **Configure backup automático** após o deploy
4. **Configure SSL** para HTTPS (opcional)

---

## 🎉 **Sistema Pronto para Produção!**

O sistema subirá **completamente zerado** e você poderá começar a cadastrar seus dados reais imediatamente após o login.

**Sua conta de admin já está criada e pronta para uso!**

