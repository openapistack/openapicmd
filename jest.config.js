module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).ts?(x)'],
  testPathIgnorePatterns: ['node_modules', 'examples'],
  testTimeout: 15000,
  verbose: true,
  silent: true,
};
