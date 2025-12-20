export default {
  testEnvironment: "node",
  testMatch: ["**/test/**/*.test.js"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "services/**/*.js",
    "utils/**/*.js",
    "middleware/**/*.js",
    "!**/node_modules/**",
    "!**/test/**",
  ],
  coverageDirectory: "coverage",
  verbose: true,
  testTimeout: 60000,
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
};
