module.exports = {
  preset: "ts-jest",
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
        tsconfig: '<rootDir>/tsconfig.test.json'
    }
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
