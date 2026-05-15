import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("Microfrontend Router", () => {
	describe("routing", () => {
		it("routes /blog requests to blog worker", async () => {
			const response = await SELF.fetch("https://example.com/blog");
			expect(response.status).toBe(200);

			const html = await response.text();
			expect(html).toContain("<h1>Blog</h1>");
			expect(html).toContain("Path: /");
		});

		it("routes /blog/subpath requests to blog worker with stripped prefix", async () => {
			const response = await SELF.fetch("https://example.com/blog/subpath");
			expect(response.status).toBe(200);

			const html = await response.text();
			expect(html).toContain("<h1>Blog</h1>");
			expect(html).toContain("Path: /subpath");
		});

		it("routes /docs requests to docs worker", async () => {
			const response = await SELF.fetch("https://example.com/docs");
			expect(response.status).toBe(200);

			const html = await response.text();
			expect(html).toContain("<h1>Docs</h1>");
		});

		it("routes /docs/nested/path requests correctly", async () => {
			const response = await SELF.fetch("https://example.com/docs/nested/path");
			expect(response.status).toBe(200);

			const html = await response.text();
			expect(html).toContain("<h1>Docs</h1>");
			expect(html).toContain("Path: /nested/path");
		});
	});

	describe("URL rewriting", () => {
		it("rewrites asset URLs in HTML from /blog", async () => {
			const response = await SELF.fetch("https://example.com/blog");
			const html = await response.text();

			// Asset paths should be rewritten to include mount prefix
			expect(html).toContain('href="/blog/assets/style.css"');
			expect(html).toContain('src="/blog/assets/logo.png"');
			expect(html).toContain('src="/blog/static/app.js"');
		});

		it("rewrites favicon URLs", async () => {
			const response = await SELF.fetch("https://example.com/blog");
			const html = await response.text();

			// Favicon should be rewritten even though it doesn't match asset prefixes
			expect(html).toContain('href="/blog/favicon.ico"');
		});

		it("rewrites asset URLs in HTML from /docs", async () => {
			const response = await SELF.fetch("https://example.com/docs");
			const html = await response.text();

			// Asset paths should be rewritten to include mount prefix
			expect(html).toContain('href="/docs/build/style.css"');
			expect(html).toContain('src="/docs/assets/image.png"');
		});
	});

	describe("redirect handling", () => {
		it("rewrites redirect Location headers", async () => {
			const response = await SELF.fetch(
				"https://example.com/docs/redirect-test",
				{ redirect: "manual" },
			);

			expect(response.status).toBe(302);
			const location = response.headers.get("Location");
			// Location should be rewritten to include mount prefix
			expect(location).toContain("/docs/redirected");
		});
	});

	describe("cookie handling", () => {
		it("rewrites Set-Cookie Path to include mount prefix", async () => {
			const response = await SELF.fetch("https://example.com/docs/set-cookie");

			const setCookie = response.headers.get("Set-Cookie");
			expect(setCookie).toBeTruthy();
			// Path=/ should be rewritten to Path=/docs/
			expect(setCookie).toContain("Path=/docs/");
		});
	});

	describe("preload script", () => {
		it("serves preload script at /__mf-preload.js when other routes have preload enabled", async () => {
			// The preload script is only served when there are OTHER routes with preload: true
			const response = await SELF.fetch(
				"https://example.com/docs/__mf-preload.js",
			);

			expect(response.status).toBe(200);
			expect(response.headers.get("Content-Type")).toContain(
				"application/javascript",
			);

			const script = await response.text();
			expect(script).toContain("fetch");
			expect(script).toContain("/blog"); // Should contain the route to preload
		});
	});
});
