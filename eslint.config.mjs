import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // proiectul nativ Android/iOS: fișiere generate de Gradle/Xcode
      "android-app/**",
      "node_modules/**",
      // pdf.js, cod terț minificat, copiat ca atare pentru vizualizatorul de PDF din aplicație
      "public/pdfjs/**",
    ],
  },
  {
    // Scripturi Node (CommonJS) care generează ghidurile PDF din docs/ghid.
    files: ["docs/ghid/**/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default eslintConfig;
