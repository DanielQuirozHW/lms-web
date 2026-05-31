import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import importPlugin from 'eslint-plugin-import'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'node_modules/**']),
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/no-cycle': 'error',
      // Disallow any type
      '@typescript-eslint/no-explicit-any': 'error',
      // Require explicit return types on functions exported from modules
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // Prevent accidental console logs in production
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      // Require explicit sanitization before dangerouslySetInnerHTML — use sanitize() from @/lib/sanitize
      'react/no-danger': 'error',
      // Prefer const
      'prefer-const': 'error',
      // No unused vars (TypeScript handles this, but ESLint catches more cases)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
])

export default eslintConfig
