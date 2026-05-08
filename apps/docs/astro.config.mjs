// @ts-check

import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	integrations: [
		react(),
		starlight({
			title: "My Docs",
			customCss: ["./src/styles/global.css"],
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/withastro/starlight",
				},
			],
			sidebar: [
				{
					label: "Guides",
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: "Example Guide", slug: "guides/example" },
					],
				},
				{
					label: "Reference",
					items: [{ autogenerate: { directory: "reference" } }],
				},
			],
		}),
	],

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
