// @ts-check

import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	integrations: [react()],

	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},

		imageService: "cloudflare",
	}),

	vite: {
		resolve: { tsconfigPaths: true },
		plugins: [tailwindcss()],
		ssr: {
			noExternal: ["@repo/ui", "@repo/tailwind-config"],
		},
	},
});
