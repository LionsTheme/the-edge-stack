interface Env {
	DASHBOARD_URL: string;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {}
}
