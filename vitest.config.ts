import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setupTests.ts"],
      globals: true,
      css: true,
      exclude: [...configDefaults.exclude, "tests/e2e/**"],
      coverage: {
        provider: "v8",
        reportsDirectory: "./coverage/frontend",
        reporter: ["text", "html", "lcov"],
      },
    },
  })
);
