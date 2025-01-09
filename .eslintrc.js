module.exports = {
  extends: [
    'next/core-web-plugins',
    'prettier'
  ],
  rules: {
    'no-unused-vars': 'error',
    'no-console': ['warn', { allow: ['error', 'warn'] }]
  }
} 