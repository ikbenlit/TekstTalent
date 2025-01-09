module.exports = {
  extends: [
    'next',
    'prettier'
  ],
  rules: {
    'no-unused-vars': 'error',
    'no-console': ['warn', { allow: ['error', 'warn'] }]
  }
} 