# Rodrigues Modas - Deploy Railway

## 📋 Pré-requisitos para Deploy

1. **Conta no Railway**: Criar conta em railway.app
2. **Repositório GitHub**: Fazer upload do código no GitHub
3. **Configurações de Ambiente**: Definir variáveis no Railway

## 🚀 Passos para Deploy

### 1. Preparar o Repositório GitHub
```bash
# 1. Criar repositório no GitHub
# 2. Fazer upload do código
git init
git add .
git commit -m "Rodrigues Modas - E-commerce completo"
git branch -M main
git remote add origin [SUA_URL_DO_GITHUB]
git push -u origin main
```

### 2. Configurar no Railway

#### A. Criar Novo Projeto
- Acessar railway.app
- Clicar em "New Project"
- Selecionar "Deploy from GitHub repo"
- Conectar seu repositório

#### B. Configurar Database
1. No projeto Railway, clicar em "New Service"
2. Selecionar "PostgreSQL Database"
3. Aguardar provisionamento

#### C. Configurar Web Service
1. Selecionar o serviço principal do projeto
2. Na aba "Settings":
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Port**: 5000

### 3. Variáveis de Ambiente

Na aba "Variables" do Railway, adicionar:

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
PGHOST=${{Postgres.PGHOST}}
PGPORT=${{Postgres.PGPORT}}
PGUSER=${{Postgres.PGUSER}}
PGPASSWORD=${{Postgres.PGPASSWORD}}
PGDATABASE=${{Postgres.PGDATABASE}}
```

### 4. Scripts do Package.json

Verificar se o `package.json` tem os scripts corretos:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "npm run db:push && vite build",
    "start": "NODE_ENV=production tsx server/index.ts",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

## 📁 Estrutura de Arquivos

```
projeto/
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Schemas compartilhados
├── package.json     # Dependencies
├── vite.config.ts   # Build config
├── drizzle.config.ts # Database config
└── tsconfig.json    # TypeScript config
```

## 🔧 Configurações Específicas

### Database
- PostgreSQL fornecido pelo Railway
- Migrations automáticas via Drizzle
- Dados seedados automaticamente

### Build Process
1. `npm install` - Instalar dependências
2. `npm run db:push` - Configurar database
3. `vite build` - Build do frontend
4. `npm start` - Iniciar servidor

## 📱 Funcionalidades

- ✅ Carrinho sem login obrigatório
- ✅ Checkout via WhatsApp (+55 85 99180-2352)
- ✅ Admin login (Camila567 / Js180620)
- ✅ Contatos atualizados (contact.rodriguesmoda@gmail.com)
- ✅ Instagram: @rodriguesmoda___
- ✅ Localização: Fortaleza - CE

## 🚨 Troubleshooting

### Deploy Falha
- Verificar logs no Railway Dashboard
- Confirmar variáveis de ambiente
- Verificar se DATABASE_URL está conectado

### Database Issues
- Executar `npm run db:push` manualmente
- Verificar conexão PostgreSQL
- Confirmar schemas no Drizzle

### Build Errors
- Limpar node_modules: `rm -rf node_modules && npm install`
- Verificar versão Node.js (recomendado: v18+)
- Conferir imports TypeScript

## 📞 Contato

- **WhatsApp**: +55 85 99180-2352
- **Email**: contact.rodriguesmoda@gmail.com
- **Instagram**: @rodriguesmoda___
- **Localização**: Fortaleza - CE

---

**Deploy estimado**: 5-10 minutos após configuração
**Custo Railway**: ~$5/mês (starter plan)