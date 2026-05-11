import { Button } from "@repo/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { signOut, useSession } from "#/lib/auth-client";

export const Route = createFileRoute("/_protected/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	const { data: session } = useSession();

	return (
		<div className="p-8">
			<h1 className="text-3xl font-bold">Dashboard</h1>
			<p className="text-muted-foreground mt-2">
				Welcome, {session?.user?.name ?? session?.user?.email}
			</p>

			<div className="mt-8 flex gap-4">
				<Button variant="outline" onClick={() => signOut()}>
					Sign Out
				</Button>
				<Link
					to="/"
					className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-all"
				>
					Home
				</Link>
			</div>
		</div>
	);
}
