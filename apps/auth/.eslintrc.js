/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@repo/eslint-config/server.js"],
  parserOptions: {
    parser: "@typescript-eslint/parser",
    project: true,
  },
  rules: {
    "no-console": "off",
  },
};
