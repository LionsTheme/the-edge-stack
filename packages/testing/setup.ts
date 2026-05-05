import { vi } from "vitest";

// Mocks globales para Cloudflare Workers
globalThis.fetch = vi.fn();
