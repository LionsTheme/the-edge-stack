import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b px-4 py-3 flex items-center gap-4">
        <Link to="/" className="font-bold text-lg">Dashboard</Link>
        <Link to="/posts" className="text-muted-foreground hover:text-foreground">Posts</Link>
      </nav>
      <main className="p-6">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  );
}