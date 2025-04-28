import tseslint from "typescript-eslint";
import eslint from "@eslint/js";
import perfectionist from 'eslint-plugin-perfectionist'

export default tseslint.config(
  {
    ignores: ["**/*.{js,mjs}"],
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  perfectionist.configs['recommended-natural'],
);