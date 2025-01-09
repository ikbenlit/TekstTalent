module.exports = {
  extends: [
    'next',
    'prettier'
  ],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': ['warn', { allow: ['error', 'warn'] }]
  }
} 