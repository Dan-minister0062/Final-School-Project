import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'cpanel-upload',
    'handoff-package',
    'school-backend/vendor',
    'school-backend/storage',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: { react },
    settings: { react: { version: 'detect' } },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      // Context providers legitimately co-locate their `useX` hook and the
      // context object with the Provider component. Splitting them into extra
      // files would only churn import sites; the rule is told to allow them.
      'react-refresh/only-export-components': [
        'warn',
        {
          allowExportNames: [
            'useLanguage',
            'useNotification',
            'useRbac',
            'LanguageContext',
            'NotificationContext',
            'RbacContext',
            'ThemeContext',
          ],
        },
      ],
    },
  },
])
