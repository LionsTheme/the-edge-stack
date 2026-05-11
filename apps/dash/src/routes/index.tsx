import { Button } from "@repo/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "#/lib/api";
import { useSession } from "#/lib/auth-client";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const [message, setMessage] = useState<string>("Loading...");
	const { data: session } = useSession();

	useEffect(() => {
		api.message.$get({ query: {} }).then((res) => {
			res.json().then((data) => setMessage(data.message));
		});
	}, []);

	return (
		<div className="p-8">
			<h1 className="text-4xl font-bold">The Edge Stack</h1>
			<p className="text-muted-foreground mt-2 text-lg">
				API says: <code>{message}</code>
			</p>

			<div className="mt-8 flex gap-4">
				{session ? (
					<>
						<Link
							to="/dashboard"
							className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-all"
						>
							Dashboard
						</Link>
						<Button variant="secondary" onClick={() => {}}>
							Refresh
						</Button>
					</>
				) : (
					<Link
						to="/sign-in"
						className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-all"
					>
						Sign In
					</Link>
				)}
			</div>
		</div>
	);
}
