module.exports = __filename.endsWith('.ts') ? {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/run-jest.ts'],
  testTimeout: 30000,
} : {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/run-jest.js'],
  testPathIgnorePatterns: [],
  testTimeout: 30000,
}