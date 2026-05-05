# Variables de Entorno

Este documento explica **cada variable de entorno** necesaria para ejecutar The Edge Stack, con instrucciones paso a paso para obtener sus valores.

> **Nota importante:** Nunca commitees tu archivo `.env`. Ya está incluido en `.gitignore`, pero verifica siempre antes de hacer `git add`.

---

## 📝 Configuración Rápida

```bash
# 1. Copia el archivo de ejemplo
cp .env.example .env

# 2. Edita el archivo con tu editor favorito
nano .env        # o vim, code, etc.

# 3. Completa TODAS las variables marcadas como obligatorias
```

---

## 🔴 Variables Obligatorias

### `DATABASE_URL` (PostgreSQL)

Conexión a tu base de datos Neon PostgreSQL.

**Formato:**
```
postgresql://USUARIO:CONTRASEÑA@HOST/BASE_DE_DATOS?sslmode=require
```

**Ejemplo real:**
```env
DATABASE_URL=postgresql://john:supersecret@ep-ancient-star-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

#### Cómo obtenerlo (Neon):

1. **Crear cuenta:** Ve a [neon.tech](https://neon.tech) y regístrate (gratis hasta 500MB)
2. **Crear proyecto:** Dale un nombre, selecciona la región más cercana a tus usuarios
3. **Crear base de datos:** Por defecto se crea `neondb`
4. **Obtener connection string:**
   - En el dashboard, haz clic en tu proyecto
   - Ve a la pestaña "Connection Details"
   - Selecciona el rol (por defecto: `neondb_owner`)
   - Copia la URL que empieza con `postgresql://`
5. **Pegar en `.env`:** Reemplaza el valor de `DATABASE_URL`

#### Alternativa: PostgreSQL local

Si prefieres desarrollar localmente sin Neon:

```bash
# Docker
docker run -d \
  --name postgres \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=edgestack \
  -p 5432:5432 \
  postgres:16
```

```env
# .env para PostgreSQL local
DATABASE_URL=postgresql://dev:devpass@localhost:5432/edgestack
```

> ⚠️ **Nota:** Para producción, usa obligatoriamente Neon o PostgreSQL con SSL.

---

### `AUTH_SECRET` (Better Auth)

Clave secreta para firmar tokens JWT y cookies. Debe ser **aleatoria** y tener **al menos 32 caracteres**.

#### Cómo generarlo:

**En Linux/Mac:**
```bash
openssl rand -base64 32
# Resultado: abc123def456... (copia esto)
```

**En Windows (PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**En Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Online (si prefieres):**
- Ve a [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

**Ejemplo en `.env`:**
```env
AUTH_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

> 🔒 **Seguridad:**
> - Usa valores DIFERENTES para cada entorno (dev, staging, prod)
> - No compartas este secreto
> - En producción, usa Cloudflare Secrets en lugar de `.env`

---

### `APP_URL`

URL pública de tu aplicación. Better Auth la usa para generar callbacks de OAuth.

**Valores comunes:**

| Entorno | Valor |
|---------|-------|
| Desarrollo local | `http://localhost:8787` |
| Preview (Cloudflare) | `https://staging.my-app.pages.dev` |
| Producción | `https://miapp.com` |

**Ejemplo:**
```env
APP_URL=http://localhost:8787
```

> **Importante:** Esta URL debe coincidir con las "Authorized redirect URIs" configuradas en Google OAuth Console.

---

### `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`

Credenciales OAuth 2.0 de Google para autenticación social.

#### Paso 1: Crear proyecto en Google Cloud

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Haz clic en el selector de proyecto (arriba) → "New Project"
3. Nombra tu proyecto (ej: "The Edge Stack App")
4. Espera a que se cree y selecciónalo

#### Paso 2: Habilitar API de Google

1. Ve a "APIs & Services" → "Library"
2. Busca "Google+ API" o "People API"
3. Haz clic en "Enable"

#### Paso 3: Crear credenciales OAuth

1. Ve a "APIs & Services" → "Credentials"
2. Haz clic en "CREATE CREDENTIALS" → "OAuth client ID"
3. Si es la primera vez, configura la pantalla de consentimiento:
   - Tipo: "External" (para apps públicas)
   - Nombre de app: "The Edge Stack"
   - Email de soporte: tu email
   - Guarda
4. Selecciona "Web application"
5. **Nombre:** "The Edge Stack Web Client"
6. **Authorized JavaScript origins:**
   - `http://localhost:8787`
   - `https://tu-dominio.com` (producción)
7. **Authorized redirect URIs:** (¡muy importante!)
   ```
   http://localhost:8787/api/auth/callback/google
   https://tu-dominio.com/api/auth/callback/google
   ```
8. Haz clic en "Create"
9. Copia el **Client ID** y **Client Secret**

**Ejemplo en `.env`:**
```env
GOOGLE_CLIENT_ID=123456789012-abc123def456ghi789jkl012mno345pqr.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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45pqr
```

---

## 🔵 Variables de Cloudflare (Wrangler)

### `CLOUDFLARE_ACCOUNT_ID`

Identificador de tu cuenta de Cloudflare.

#### Cómo obtenerlo:

1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com)
2. Inicia sesión
3. En la barra lateral derecha, verás **"Account ID"**
4. También aparece en la URL: `https://dash.cloudflare.com/ABC123DEF456/...`

**Ejemplo:**
```env
CLOUDFLARE_ACCOUNT_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
```

---

### `CLOUDFLARE_API_TOKEN`

Token para autenticar Wrangler CLI con tu cuenta de Cloudflare.

#### Cómo crearlo:

**Opción recomendada: Token específico**

1. Ve a [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Haz clic en "Create Token"
3. Usa el template: **"Edit Cloudflare Workers"**
4. O crea uno custom con estos permisos:
   | Recurso | Permiso |
   |---------|---------|
   | Account | Read |
   | Cloudflare Pages | Edit |
   | Workers Scripts | Edit |
   | Zone | Read |
5. Selecciona tu cuenta en "Account Resources"
6. "Continue to summary" → "Create token"
7. **¡Copia el token!** Solo se muestra una vez

**Opción alternativa: Login interactivo**
```bash
npx wrangler login
# Te abrirá un navegador para autorizar
```

**Ejemplo:**
```env
CLOUDFLARE_API_TOKEN=AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCd
```

> ⚠️ **Seguridad:** Nunca uses tu Global API Key en archivos de código. El API Token es más seguro porque tiene permisos limitados.

---

## 🟢 Variables Opcionales

### `TURBO_TOKEN` (Remote Cache)

Para compartir builds cacheadas entre CI y desarrolladores.

```bash
# Configurar Turborepo Remote Cache
pnpm turbo login
pnpm turbo link
```

### `NEON_API_KEY` (CI/CD Branching)

Para crear branches de Neon automáticamente en Pull Requests.

1. Ve a [console.neon.tech](https://console.neon.tech)
2. Account Settings → API Keys
3. Genera una nueva key

---

## ✅ Checklist de Configuración

Antes de ejecutar `pnpm dev`, verifica:

- [ ] `DATABASE_URL` → Conexión a Neon válida
- [ ] `AUTH_SECRET` → String aleatorio de 32+ caracteres
- [ ] `APP_URL` → URL correcta para tu entorno
- [ ] `GOOGLE_CLIENT_ID` → Desde Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` → Desde Google Cloud Console
- [ ] `CLOUDFLARE_ACCOUNT_ID` → Desde el dashboard de Cloudflare
- [ ] `CLOUDFLARE_API_TOKEN` → Token con permisos de Workers

---

## 🧪 Verificar Conexiones

```bash
# 1. Verificar base de datos
pnpm db:migrate
# Si funciona, la conexión es correcta

# 2. Verificar Cloudflare
npx wrangler whoami
# Debe mostrar tu email y account ID

# 3. Verificar Google OAuth
# Inicia la app y prueba el login con Google
```

---

## 🆘 Solución de Problemas

### "Connection refused" en DATABASE_URL
- Verifica que Neon esté activo (dashboard)
- Si usas PostgreSQL local, verifica que el contenedor Docker esté corriendo
- Comprueba que no haya firewall bloqueando el puerto 5432

### "Invalid client" en Google OAuth
- Verifica que `APP_URL` coincida con las URLs configuradas en Google Console
- Asegúrate de que las "Authorized redirect URIs" incluyan `/api/auth/callback/google`
- El Client ID y Secret deben ser del proyecto correcto

### Wrangler no reconoce la cuenta
- Ejecuta `npx wrangler login` para re-autenticar
- Verifica que `CLOUDFLARE_API_TOKEN` no haya expirado
- El token debe tener permisos suficientes