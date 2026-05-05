# Despliegue

Esta guía explica cómo llevar The Edge Stack a producción paso a paso.

---

## 📋 Pre-requisitos

Antes de desplegar, asegúrate de tener:

- [ ] Cuenta en [Cloudflare](https://cloudflare.com) (gratis)
- [ ] Cuenta en [Neon](https://neon.tech) (gratis)
- [ ] Cuenta en [GitHub](https://github.com)
- [ ] Variables de entorno configuradas en `.env`
- [ ] Wrangler CLI instalado y autenticado

---

## 🗄️ Paso 1: Base de Datos

### Crear base de datos en Neon

1. Ve a [console.neon.tech](https://console.neon.tech)
2. Crea un proyecto nuevo
3. Guarda la `DATABASE_URL`
4. Aplica migraciones:

```bash
DATABASE_URL=tu-url-de-produccion pnpm db:migrate
```

### Configurar secrets de Cloudflare

```bash
cd apps/api
wrangler secret put DATABASE_URL
# Pega tu DATABASE_URL de producción

wrangler secret put AUTH_SECRET
# Pega tu AUTH_SECRET

wrangler secret put GOOGLE_CLIENT_SECRET
# Pega tu Google Client Secret
```

---

## ⚡ Paso 2: API Worker

```bash
cd apps/api

# Desarrollo
wrangler dev

# Producción
wrangler deploy
```

Verifica que funciona:
```bash
curl https://the-edge-stack-api.tu-subdominio.workers.dev/api/health
```

---

## 🚪 Paso 3: Gateway Worker

El Gateway es el punto de entrada único:

```bash
cd apps/gateway

# Actualiza wrangler.toml con los nombres reales de tus services
vim wrangler.toml

# Desplegar
wrangler deploy
```

**Configurar Custom Domain (opcional):**

1. Ve al dashboard de Cloudflare
2. Workers & Pages → Tu gateway → Settings → Triggers
3. Añade un Custom Domain: `miapp.com`

---

## 🎨 Paso 4: Astro Apps (Landing, Blog, Docs)

### Cloudflare Pages

```bash
cd apps/landing

# Build
pnpm build

# Deploy
wrangler pages deploy dist
```

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd apps/landing
vercel --prod
```

### Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
cd apps/landing
netlify deploy --prod --dir=dist
```

---

## 💻 Paso 5: Dashboard (TanStack Start)

```bash
cd apps/dashboard

# Build para Cloudflare Pages
pnpm build

# Deploy
wrangler pages deploy .output
```

---

## 🔧 Paso 6: CI/CD Automático

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm build

      - name: Deploy API
        working-directory: apps/api
        run: wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Deploy Gateway
        working-directory: apps/gateway
        run: wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### Secrets de GitHub

1. Repo Settings → Secrets and variables → Actions
2. Añade:
   - `CLOUDFLARE_API_TOKEN`
   - `DATABASE_URL`

---

## 🗺️ Configuración DNS

Para unificar todo bajo un dominio:

```
miapp.com           → Gateway Worker (A record o CNAME)
www.miapp.com       → Redirect a miapp.com
api.miapp.com       → API Worker (opcional, si no usas Gateway)
```

En el dashboard de Cloudflare:
1. DNS → Add Record
2. Type: CNAME
3. Name: `@` (raíz) o `www`
4. Target: tu-gateway.workers.dev
5. Proxy status: 🟠 Proxied

---

## ✅ Checklist de Producción

- [ ] Base de datos migrada y funcionando
- [ ] Secrets configurados en Cloudflare
- [ ] API Worker desplegado y saludable
- [ ] Gateway Worker desplegado
- [ ] Apps estáticas desplegadas
- [ ] DNS configurado
- [ ] HTTPS funcionando
- [ ] OAuth redirects actualizados en Google Console
- [ ] Logs configurados (`wrangler tail`)
- [ ] CI/CD funcionando

---

## 🆘 Rollback

Si algo falla:

```bash
# Workers: deploy versión anterior
wrangler deploy --env production

# Base de datos: Neon soporta Point-in-Time Recovery
# Ve al dashboard → Branches → Restore

# Estático: re-deploy versión anterior desde CI/CD
```