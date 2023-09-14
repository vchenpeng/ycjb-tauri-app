/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'semi': [2, "never"],
    'singleQuote': 'off',
    'no-console': 'off',
    'trailingComma': 'off'
  },
  globals: {
    MealTakeClass: true
  }
}
