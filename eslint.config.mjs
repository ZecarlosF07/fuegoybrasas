import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/types/database.types.ts"],
    rules: {
      "max-depth": ["error", 2],
      "max-nested-callbacks": ["error", 2],
      "import/no-cycle": ["error", { ignoreExternal: true }],
      "import/order": ["error", {
        groups: [["builtin", "external"], ["internal", "parent", "sibling", "index"]],
        alphabetize: { order: "asc", caseInsensitive: true },
        "newlines-between": "always",
      }],
    },
  },
  {
    files: ["src/**/*.tsx"],
    rules: { "max-lines": ["error", { max: 170, skipBlankLines: false, skipComments: false }] },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/types/**", "src/**/*.types.ts"],
    rules: {
      "no-restricted-syntax": ["error",
        { selector: "TSTypeAliasDeclaration", message: "Declarar tipos en un archivo de la carpeta types/." },
        { selector: "TSInterfaceDeclaration", message: "Declarar interfaces en un archivo de la carpeta types/." },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".h1-boundary-fixture/**",
    ".test-fixtures/**",
    ".h1-install-fixture/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
