# Turborepo y pnpm

## ¿Qué es un Monorepo?

Un **monorepo** es un único repositorio Git que contiene múltiples proyectos relacionados. En The Edge Stack, tenemos:

- **6 aplicaciones** (api, dashboard, landing, blog, docs, gateway)
- **7 paquetes compartidos** (database, auth, ui, configs, testing)

## ¿Por qué Turborepo?

**Turborepo** es un orquestador de tareas que hace tu monorepo más rápido mediante:

- **Cacheo inteligente:** Si el código no cambió, no recompila
- **Paralelismo:** Ejecuta tareas independientes simultáneamente
- **Pipeline definido:** Control total del orden de ejecución

## ¿Por qué pnpm?

**pnpm** es un gestor de paquetes que:

- **Ahorra espacio:** Usa links duros en lugar de copiar `node_modules`
- **Es más rápido:** Instalaciones significativamente más veloz que npm/yarn
- **Workspaces nativo:** Soporta monorepos de forma nativa
- **Estricto:** Previene el "phantom dependency" problem

---

## 📁 Estructura de Workspaces

```
the-edge-stack/
├── apps/           # Aplicaciones desplegables
│   ├── api/
│   ├── dashboard/
│   ├── landing/
│   ├── blog/
│   ├── docs/
│   └── gateway/
├── packages/       # Código compartido
│   ├── database/
│   ├── auth/
│   ├── ui/
│   ├── typescript-config/
│   ├── eslint-config/
│   ├── tailwind-config/
│   └── testing/
├── pnpm-workspace.yaml
└── turbo.json
```

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Esto le dice a pnpm que trate cada carpeta dentro de `apps/` y `packages/` como un workspace independiente.

### turbo.json

```json
{
  "pipeline": {
    "db:generate": { "cache": false },
    "db:migrate": { "cache": false },
    "build": {
      "dependsOn": ["^build", "^db:generate"],
      "outputs": ["dist/**", ".output/**", ".next/**", "build/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "test": { "dependsOn": ["^build"] }
  }
}
```

**Significado:**

| Tarea | `dependsOn` | Significado |
|-------|-------------|-------------|
| `build` | `^build` | Cada app compila después de que sus dependencias compilen |
| `build` | `^db:generate` | La API espera que Drizzle genere tipos primero |
| `dev` | `cache: false` | Nunca cachear (siempre en ejecución) |
| `test` | `^build` | Los tests corren después de compilar |

---

## 🔗 Dependencias entre Workspaces

### Workspace Protocol

Para referenciar otro paquete del monorepo:

```json
{
  "dependencies": {
    "@repo/database": "workspace:*",
    "@repo/ui": "workspace:*"
  }
}
```

`workspace:*` significa: "Usa la versión que está en este monorepo, sea cual sea".

### Grafo de Dependencias

```
@repo/ui
  └── @repo/tailwind-config

@repo/auth
  └── @repo/database

@repo/api
  ├── @repo/auth
  └── @repo/database

apps/dashboard
  ├── @repo/ui
  └── (usa la API vía Hono RPC)

apps/landing
  └── @repo/tailwind-config
```

---

## 🛠️ Comandos Útiles

### Instalación

```bash
# Instalar TODAS las dependencias del monorepo
pnpm install

# Instalar en un workspace específico
pnpm --filter @repo/api add hono

# Instalar como devDependency
pnpm --filter @repo/ui add -D @types/react
```

### Desarrollo

```bash
# Iniciar TODAS las apps en paralelo
pnpm dev

# Iniciar solo la API
pnpm --filter @repo/api dev

# Iniciar dashboard y API
pnpm --filter @repo/api --filter @repo/dashboard dev
```

### Build

```bash
# Compilar todo
pnpm build

# Compilar solo packages
pnpm --filter './packages/**' build

# Compilar API y sus dependencias
pnpm --filter @repo/api... build
```

### Testing

```bash
# Tests en todo el monorepo
pnpm test

# Tests de un paquete
pnpm --filter @repo/api test
```

### Database

```bash
# Generar migraciones
pnpm db:generate

# Aplicar migraciones
pnpm db:migrate

# Push schema (solo desarrollo, NUNCA en producción)
pnpm db:push
```

---

## 📦 Agregar un Nuevo Paquete

### 1. Crear estructura

```bash
mkdir packages/mi-nuevo-paquete
cd packages/mi-nuevo-paquete
```

### 2. Crear package.json

```json
{
  "name": "@repo/mi-nuevo-paquete",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "typescript": "^5.4.0"
  }
}
```

### 3. Crear tsconfig.json

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### 4. Crear código fuente

```bash
mkdir src
touch src/index.ts
```

### 5. Instalar dependencias

```bash
pnpm install
```

pnpm automáticamente detectará el nuevo workspace.

---

## 🧹 Limpieza y Mantenimiento

```bash
# Limpiar builds
pnpm clean

# Limpiar TODO (incluyendo node_modules)
pnpm clean && rm -rf node_modules && pnpm install

# Verificar dependencias duplicadas
pnpm dedupe

# Actualizar dependencias
pnpm update --latest
```

---

## 🎯 Buenas Prácticas

1. **Nunca uses `npm` o `yarn`** dentro del monorepo. Siempre `pnpm`.
2. **Siempre usa `--filter`** para comandos en un solo workspace.
3. **Mantén las versiones consistentes** entre workspaces (ej: todos usan React 18).
4. **Aprovecha el cacheo:** Si un build falla, borra `.turbo/` y reintenta.
5. **Los `workspace:*` nunca deben publicarse a npm.** Por eso todos tienen `"private": true`.