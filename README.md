# 🚀 The Edge Stack

Edge-first monorepo boilerplate designed for ultra-fast applications. Built with Turborepo, Hono, Drizzle, Neon, TanStack Start, Astro, Starlight, and Cloudflare Workers.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/LionsTheme/the-edge-stack)

## ✨ Features

- ⚡ **Edge-First**: Deploy to 300+ locations worldwide with Cloudflare Workers
- 🔒 **Type-Safe End-to-End**: Hono RPC shares types between API and frontend
- 🗄️ **Serverless Database**: Neon Postgres with branching for previews
- 🔐 **Stateless Auth**: Better Auth optimized for edge runtimes
- 📦 **Monorepo**: Turborepo + pnpm with shared configs and components
- 🎨 **Shared Design System**: Shadcn/ui + Tailwind CSS across all apps
- 🧪 **Testing Ready**: Vitest with Cloudflare Workers pool
- 📚 **Documentation**: Astro Starlight with shared design tokens

## 🏗️ Architecture

```
the-edge-stack/
├── apps/
│   ├── api/          # Hono API (Cloudflare Worker)
│   ├── dashboard/    # TanStack Start app
│   ├── landing/      # Astro landing page
│   ├── blog/         # Astro blog
│   ├── docs/         # Starlight documentation
│   └── gateway/      # Cloudflare Gateway Worker
├── packages/
│   ├── database/     # Drizzle schema + Neon client
│   ├── auth/         # Better Auth configuration
│   ├── ui/           # Shared UI components (Shadcn)
│   ├── tailwind-config/
│   ├── typescript-config/
│   ├── eslint-config/
│   └── testing/
└── turbo.json
```

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Cloudflare](https://cloudflare.com) account
- [Neon](https://neon.tech) database

### 1. Use this template

Click **"Use this template"** on GitHub or clone directly:

```bash
git clone https://github.com/LionsTheme/the-edge-stack.git
cd the-edge-stack
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Start development

```bash
pnpm dev
```

This starts all apps in parallel:
- API: http://localhost:8787
- Dashboard: http://localhost:3000
- Landing: http://localhost:4321
- Blog: http://localhost:4322
- Docs: http://localhost:4323

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps for production |
| `pnpm test` | Run tests across all packages |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm clean` | Clean all build outputs |

## 🌐 Deployment

### Cloudflare Workers

Each Worker app (`api`, `gateway`) can be deployed with Wrangler:

```bash
cd apps/api
wrangler deploy
```

### Astro Apps (Landing, Blog, Docs)

Deploy to Cloudflare Pages or any static host:

```bash
cd apps/landing
pnpm build
# Upload dist/ to your static host
```

### TanStack Start (Dashboard)

Deploy to Cloudflare Pages:

```bash
cd apps/dashboard
pnpm build
```

### Database Migrations in CI/CD

Migrations run automatically on push to `main` via GitHub Actions. See `.github/workflows/migrate.yml`.

## 🔗 Gateway Routing

The Cloudflare Gateway Worker unifies all apps under a single domain:

| Path | Destination |
|------|-------------|
| `/api/*` | API Worker |
| `/app/*` | Dashboard |
| `/blog/*` | Blog |
| `/docs/*` | Documentation |
| `/*` | Landing page |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Hono](https://hono.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [TanStack](https://tanstack.com)
- [Astro](https://astro.build)
- [Starlight](https://starlight.astro.build)
- [Better Auth](https://better-auth.com)
- [Neon](https://neon.tech)
- [Cloudflare Workers](https://workers.cloudflare.com)