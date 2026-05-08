// @ts-check

import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://example.com",
	integrations: [mdx(), react(), sitemap()],

	vite: {
		resolve: { tsconfigPaths: true },
		plugins: [tailwindcss()],
		ssr: {
			noExternal: ["@repo/ui", "@repo/tailwind-config"],
		},
	},

	fonts: [
		{
			provider: fontProviders.local(),
			name: "Atkinson",
			cssVariable: "--font-atkinson",
			fallbacks: ["sans-serif"],
			options: {
				variants: [
					{
						src: ["./src/assets/fonts/atkinson-regular.woff"],
						weight: 400,
						style: "normal",
						display: "swap",
					},
					{
						src: ["./src/assets/fonts/atkinson-bold.woff"],
						weight: 700,
						style: "normal",
						display: "swap",
					},
				],
			},
		},
	],

	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},

		imageService: "cloudflare",
	}),
});
