# 🔐 Sistema de Autenticação Supabase

Este projeto implementa autenticação completa usando Supabase Auth integrado ao Nuxt.js.

## ✅ Funcionalidades Implementadas

### 🚪 **Página de Login** (`/`)
- **Login com email/senha**: Autenticação segura via Supabase Auth
- **Cadastro de novos usuários**: Criação de conta com verificação de email
- **Login com Google**: Autenticação social (OAuth)
- **Validação de formulário**: Verificação client-side
- **Mensagens de erro**: Feedback claro para o usuário
- **Estado de carregamento**: Indicadores visuais durante operações

### 🏠 **Dashboard** (`/dashboard`)
- **Proteção por middleware**: Acesso apenas para usuários autenticados
- **Informações do usuário**: Exibe email do usuário logado
- **Botão de logout**: Encerramento seguro da sessão
- **Redirecionamento automático**: Para login se não autenticado

### 🛡️ **Middleware de Segurança**
- **`middleware/auth.ts`**: Protege rotas privadas
- **Redirecionamento automático**: Para login se não autenticado
- **Verificação de sessão**: Usando `useSupabaseUser()`

## 🔧 **Configuração Técnica**

### **Módulos Instalados**
```bash
npm install @nuxtjs/supabase
```

### **Configuração Nuxt** (`nuxt.config.ts`)
```typescript
modules: [
  '@nuxtjs/tailwindcss',
  '@nuxtjs/supabase'
],
supabase: {
  url: process.env.SUPABASE_URL || 'https://euowfdymhmjcdviapfvc.supabase.co',
  key: process.env.SUPABASE_ANON_KEY || 'sua-chave-aqui',
  redirectOptions: {
    login: '/',
    callback: '/dashboard',
    exclude: ['/']
  }
},
runtimeConfig: {
  public: {
    supabaseUrl: process.env.SUPABASE_URL || 'https://euowfdymhmjcdviapfvc.supabase.co',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'sua-chave-aqui'
  }
}
```

### **Variáveis de Ambiente** (`.env`)
```bash
# Crie um arquivo .env na raiz do projeto
SUPABASE_URL=https://euowfdymhmjcdviapfvc.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### **Estrutura de Autenticação**
```
├── pages/
│   ├── index.vue          # 🔑 Página de login
│   └── dashboard.vue      # 🏠 Área protegida
├── middleware/
│   └── auth.ts           # 🛡️ Middleware de proteção
└── layouts/
    ├── auth.vue          # Layout para páginas de autenticação
    └── default.vue       # Layout padrão com navegação
```

## 🚀 **Como Usar**

### **1. Faça Login**
- Acesse: `http://localhost:3000`
- Use email/senha ou clique em "crie uma nova conta"
- Ou use o botão do Google para login social

### **2. Cadastro de Usuário**
- Na página de login, clique em "crie uma nova conta"
- Preencha email e senha
- Confirme sua conta pelo email enviado

### **3. Área Protegida**
- Após login, será redirecionado para `/dashboard`
- Verá informações pessoais e funcionalidades protegidas
- Use o botão "Logout" para encerrar a sessão

## 🔐 **Recursos de Segurança**

### **Autenticação Supabase**
- Tokens JWT seguros
- Refresh tokens automáticos
- Sessões persistentes
- Criptografia bcrypt para senhas

### **Proteção de Rotas**
- Middleware automático de verificação
- Redirecionamento seguro
- Verificação server-side e client-side

### **Validações**
- Verificação de email obrigatória
- Validação de formato de email
- Senhas seguras (mínimo 6 caracteres)
- Mensagens de erro claras

## 📊 **Banco de Dados**

### **Tabelas Supabase**
- `auth.users`: Dados de autenticação dos usuários
- `public.users`: Perfis de usuários (opcional)
- Todas as tabelas de sessão e tokens (gerenciadas automaticamente)

### **Políticas RLS**
- Row Level Security habilitado
- Usuários só acessam seus próprios dados
- Políticas de read/write configuradas

## 🛠️ **Desenvolvimento**

### **Composables Disponíveis**
```typescript
const supabase = useSupabaseClient()  // Cliente Supabase
const user = useSupabaseUser()        // Usuário atual
```

### **Funções de Autenticação**
```typescript
// Login
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Cadastro
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// Login Social
await supabase.auth.signInWithOAuth({
  provider: 'google'
})

// Logout
await supabase.auth.signOut()
```

## 🔄 **Fluxo de Autenticação**

1. **Usuário acessa página protegida** → Middleware verifica autenticação
2. **Se não autenticado** → Redirecionado para `/` (login)
3. **Faz login/cadastro** → Supabase Auth processa credenciais
4. **Se sucesso** → Redirecionado para `/dashboard`
5. **Sessão mantida** → Usuário permanece logado entre recarregamentos
6. **Logout** → Sessão encerrada, redirecionado para login

## 🎨 **Interface**

- **Design moderno**: Tailwind CSS com gradientes e sombras
- **Responsivo**: Funciona em desktop e mobile
- **Acessibilidade**: Labels e navegação por teclado
- **Estados visuais**: Loading, erro, sucesso
- **Animações**: Transições suaves

## 🚨 **Aviso de Segurança**

> **Importante**: O Google OAuth só funcionará em produção ou com domínio configurado no Supabase Dashboard. Para desenvolvimento local, use email/senha.

## 🔧 **Resolução de Problemas**

### **Erro: "Missing supabase anon key"**
```bash
WARN Missing supabase anon key, set it either in nuxt.config.js or via env variable
```

**Soluções:**
1. ✅ **Configuração dupla implementada** - tanto no `supabase:{}` quanto em `runtimeConfig`
2. ✅ **Variáveis de ambiente** - crie arquivo `.env` com `SUPABASE_URL` e `SUPABASE_ANON_KEY`
3. ✅ **Reinicie o servidor** - `npm run dev` após mudanças na configuração

### **Outros Problemas Comuns**
- **Login não funciona**: Verifique se as credenciais estão corretas no Supabase Dashboard
- **Redirecionamento falha**: Confirme URLs no `redirectOptions`
- **Google OAuth não funciona**: Configure domínio no Supabase (só funciona em produção)

## 📝 **Para Produção**

1. Configure domínio personalizado no Supabase
2. Adicione URLs de redirect no Dashboard
3. Configure SMTP para emails de confirmação
4. Habilite MFA se necessário
5. Configure políticas RLS específicas
6. Use variáveis de ambiente para segurança

---

**🎉 Sistema de autenticação implementado com sucesso!**
*Usuários podem se cadastrar, fazer login e acessar áreas protegidas de forma segura.* 