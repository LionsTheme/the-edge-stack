# Neon PostgreSQL

## ¿Qué es Neon?

**Neon** es PostgreSQL como servicio serverless. A diferencia de PostgreSQL tradicional:

- **Serverless:** Se escala automáticamente a cero cuando no hay tráfico
- **Branching:** Crea copias de tu base de datos en segundos (como Git)
- **Instantáneas:** Restaura cualquier punto en el tiempo
- **Edge-optimized:** Latencia mínima para Workers

## 🔧 Configuración Inicial

### 1. Crear Cuenta y Proyecto

1. Ve a [neon.tech](https://neon.tech)
2. Regístrate con GitHub o email
3. Crea un **nuevo proyecto**
   - Nombre: `the-edge-stack`
   - Región: Elige la más cercana a tus usuarios
   - Postgres version: 16 (recomendado)

### 2. Obtener Connection String

1. En el dashboard, selecciona tu proyecto
2. Ve a la pestaña **"Connection Details"**
3. Selecciona el rol (por defecto: `neondb_owner`)
4. Copia la URL completa
5. Pégala en tu `.env` como `DATABASE_URL`

### 3. Verificar Conexión

```bash
# Instalar dependencias
pnpm install

# Correr migraciones
pnpm db:migrate

# Si funciona, la conexión es correcta
```

---

## 🌿 Branching (Característica Clave)

Neon permite crear "branches" de tu base de datos, ideal para previews.

```
main (producción)
  ├── preview/pr-42
  ├── preview/pr-43
  └── preview/pr-44
```

### Crear un Branch Manualmente

1. Dashboard → Branches → "Create Branch"
2. Selecciona el branch padre (ej: `main`)
3. Asigna un nombre (ej: `preview-feature-x`)
4. Obtén la nueva connection string
5. Configúrala en tu preview deployment

### Branching Automático en CI/CD

Neon tiene una [GitHub Action](https://github.com/neondatabase/create-branch-action) para crear branches automáticamente:

```yaml
# .github/workflows/preview.yml
- uses: neondatabase/create-branch-action@v5
  with:
    project_id: tu-project-id
    branch_name: preview/${{ github.head_ref }}
    api_key: ${{ secrets.NEON_API_KEY }}
```

---

## 📊 Planes y Límites

| Plan | Storage | Compute | Precio |
|------|---------|---------|--------|
| Free | 500 MB | 0.25 vCPU | Gratis |
| Pro | 10 GB | Hasta 7 vCPU | Desde $19/mes |

**Para este boilerplate:** El plan Free es suficiente para desarrollo y proyectos pequeños.

---

## 🔒 Seguridad

- **SSL obligatorio:** Neon solo acepta conexiones con `sslmode=require`
- **Roles:** Usa el rol `neondb_owner` solo para migraciones. Para la app, crea un rol con permisos limitados
- **IPs:** Neon acepta conexiones desde cualquier IP por defecto. Puedes restringirlo en Settings

---

## 🐛 Solución de Problemas

### "Connection refused"
```
Error: connect ECONNREFUSED
```
- Verifica que la URL esté completa (incluye `?sslmode=require`)
- Comprueba que el proyecto Neon esté activo (no suspendido)

### "password authentication failed"
- El rol o contraseña en la URL son incorrectos
- Ve al dashboard y regenera la connection string

### "database does not exist"
- El nombre de la base de datos en la URL es incorrecto
- Por defecto es `neondb` para proyectos nuevos

### Rendimiento lento
- Activa **"Auto-suspend"** en el dashboard
- La primera conexión después de suspensión tiene latencia extra (cold start)
- Para producción, considera el plan Pro con compute dedicado