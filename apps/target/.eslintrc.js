/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@webs5/eslint-config/server.js"],
  parserOptions: {
    parser: "@typescript-eslint/parser",
    project: true,
  },
  rules: {
    "no-console": "off",
  },
};
