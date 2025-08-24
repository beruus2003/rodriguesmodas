# 🚀 Deploy Gratuito - Rodrigues Modas

## 📋 Resumo das Opções

| Plataforma | Tempo Grátis | Vantagem | Desvantagem |
|------------|--------------|----------|-------------|
| **Render** | 750h/mês | Fácil, sempre ativo | Dorme após 15min |
| **Railway** | $5 crédito | Super fácil | Crédito acaba |
| **Vercel+Supabase** | Ilimitado | Muito rápido | Mais complexo |

---

## 🏆 OPÇÃO 1: RENDER (RECOMENDADO)

### Passos para Deploy:

#### 1. Fazer Upload no GitHub
```bash
# No seu computador, criar repositório
git init
git add .
git commit -m "Rodrigues Modas - E-commerce"
git branch -M main
git remote add origin [URL_DO_SEU_GITHUB]
git push -u origin main
```

#### 2. Configurar no Render

**A. Criar conta em render.com**

**B. Criar Web Service:**
- Clicar "New" → "Web Service"
- Conectar seu repositório GitHub
- Configurações:
  - **Name**: rodrigues-modas
  - **Environment**: Node
  - **Build Command**: `npm install && npm run build`
  - **Start Command**: `npm start`

**C. Criar Database:**
- Clicar "New" → "PostgreSQL"
- Nome: rodrigues-modas-db
- Aguardar provisionar

**D. Variáveis de Ambiente:**
No Web Service, aba "Environment":
```env
NODE_ENV=production
DATABASE_URL=${{DATABASE_URL do PostgreSQL criado}}
```

#### 3. Deploy Automático
- Render fará build e deploy automaticamente
- URL será fornecida (ex: https://rodrigues-modas.onrender.com)

---

## 🚀 OPÇÃO 2: RAILWAY

### Passos para Deploy:

#### 1. Upload no GitHub (mesmo processo acima)

#### 2. Deploy no Railway:
- Acessar railway.app
- "New Project" → "Deploy from GitHub repo"
- Selecionar repositório
- Railway detecta automaticamente e faz deploy

#### 3. Configurar Database:
- No projeto, "New Service" → "PostgreSQL"
- Variáveis são conectadas automaticamente

**Custo**: $5 inicial, depois ~$5-10/mês

---

## ⚡ OPÇÃO 3: VERCEL + SUPABASE

### Passos para Deploy:

#### 1. Frontend no Vercel:
- Acessar vercel.com
- "New Project" → conectar GitHub
- Deploy automático do frontend

#### 2. Backend e Database no Supabase:
- Acessar supabase.com
- Criar projeto
- Copiar DATABASE_URL

#### 3. Configurar API Routes:
```javascript
// Criar pasta /api no projeto
// Mover rotas Express para serverless functions
```

---

## 🔧 Preparação do Código

### Arquivo: render.yaml (opcional)
```yaml
services:
  - type: web
    name: rodrigues-modas
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
  
  - type: pserv
    name: rodrigues-modas-db
    env: postgresql
```

---

## 📱 Após o Deploy

### 1. Teste a Aplicação:
- Abrir URL fornecida
- Testar carrinho sem login
- Testar login admin (Camila567 / Js180620)
- Testar checkout WhatsApp

### 2. Configurar Domínio (opcional):
- Comprar domínio (.com.br ~R$40/ano)
- Configurar DNS nas configurações da plataforma

### 3. Monitoramento:
- Render: Dashboard mostra logs e performance
- Railway: Interface intuitiva de monitoring
- Vercel: Analytics detalhado

---

## 💡 Dicas Importantes

### Para Render:
- App dorme após 15min → primeira visita pode ser lenta
- 750h/mês = sempre ativo se usado regularmente
- Logs disponíveis no dashboard

### Para Railway:
- Monitore uso de crédito
- $5 inicial dura ~1-2 meses
- Upgrade automático quando necessário

### Para Vercel:
- Frontend super rápido
- Backend limitado a 10s por requisição
- Ideal para APIs simples

---

## 🎯 Recomendação Final

**Para começar**: Use Render
- Fácil configuração
- Truly free
- Perfeito para MVPs

**Para crescer**: Migre para Railway ou planos pagos
- Melhor performance
- Sem sleep
- Suporte profissional

---

## 📞 Suporte

Se tiver dúvidas no deploy:
1. Verificar logs na plataforma
2. Testar localmente primeiro
3. Conferir variáveis de ambiente
4. Verificar se DATABASE_URL está correto

**Contato do projeto:**
- WhatsApp: +55 85 99180-2352
- Email: contact.rodriguesmoda@gmail.com