export interface Env {
	API: Fetcher;
	DASH: Fetcher;
	BLOG: Fetcher;
	LANDING: Fetcher;
	DOCS: Fetcher;
	ROUTES: string;
	ASSET_PREFIXES?: string;
}

/** Only the Fetcher keys (service bindings), excluding config vars. */
export type BindingKey = Exclude<keyof Env, "ROUTES" | "ASSET_PREFIXES">;

export interface RouteConfig {
	binding: BindingKey;
	path: string;
	preload?: boolean;
}
