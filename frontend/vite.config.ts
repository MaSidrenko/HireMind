import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "vite";
import { noDeprecation } from "process";
import basicSsl from '@vitejs/plugin-basic-ssl'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	return {
		plugins: [react(), basicSsl()],
		server: {
			https: true,
			port: 5173,
			strictPort: true,
			proxy: {
				"/api": {
					target: env.API_PROXY_TARGET,
					changeOrigin: true,
					secure: false
				}
			}
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		test: {
			globals: true,
			environment: "jsdom",
			setupFiles: "./src/setupTests.ts",
			include: ["src/**/*.test.{ts,tsx}"],
			exclude: ["tests/**", "e2e/**", "node_modules/**"],
		},
	};
});
