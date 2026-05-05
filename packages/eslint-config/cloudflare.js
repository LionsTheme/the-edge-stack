/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["./base.js"],
  rules: {
    // Prevenir APIs de Node.js en Workers
    "no-restricted-globals": ["error", "process", "Buffer", "require"],
    "@typescript-eslint/no-floating-promises": "error",
  },
  env: {
    browser: true,
    node: false,
  },
};