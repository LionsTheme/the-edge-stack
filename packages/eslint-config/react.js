/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["./base.js", "plugin:react-hooks/recommended"],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
};