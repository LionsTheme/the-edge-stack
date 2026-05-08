import { Button } from "@repo/ui/components/button";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "#/lib/api";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	const [message, setMessage] = useState<string>("Loading...");

	useEffect(() => {
		api.message.$get({ query: {} }).then((res) => {
			res.json().then((data) => setMessage(data.message));
		});
	}, []);

	return (
		<div className="p-8">
			<h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
			<p className="mt-4 text-lg">
				API says: <code>{message}</code>
			</p>
			<Button className="mt-4" variant="secondary">
				Button
			</Button>
		</div>
	);
}
