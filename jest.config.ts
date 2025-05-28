import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": [
      "ts-jest",
      {
        // Параметры конфигурации ts-jest могут быть указаны здесь
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  transformIgnorePatterns: ["/node_modules/(?!serialize-error)"],
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
};

export default config;
