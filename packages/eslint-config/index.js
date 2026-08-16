const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  {
  ignores: ["dist/", "build/", ".next/", "node_modules/"],
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    extends: [tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
