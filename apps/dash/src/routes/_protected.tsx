import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "#/lib/auth.functions";

export const Route = createFileRoute("/_protected")({
	beforeLoad: async () => {
		const session = await getSession();

		console.log("beforeLoad: ", { session: session });

		if (!session) {
			throw redirect({ to: "/sign-in" });
		}

		return { user: session.user };
	},
	component: ProtectedLayout,
});

function ProtectedLayout() {
	return <Outlet />;
}
