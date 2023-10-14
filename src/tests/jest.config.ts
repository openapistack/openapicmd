module.exports = __filename.endsWith('.ts') ? {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/run-jest.ts'],
  testTimeout: 30000,
} : {
  testEnvironment: 'node',
  testMatch: ['**/run-jest.js'],
  testTimeout: 30000,
}