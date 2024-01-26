import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  shims: true,
  minify: true,
  bundle: true,
  skipNodeModulesBundle: true,
  splitting: true
  // outDir: "lib"
});
