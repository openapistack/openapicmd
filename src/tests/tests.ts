/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AxiosRequestConfig } from "axios";

export const TEST_CHECKS = ['Success2XX'] as const;
export type TestCheck = typeof TEST_CHECKS[number];

export interface TestConfig {
  [operationId: string]: {
    [testName: string]: {
      checks: TestCheck[];
      request: {
        params?: { [key: string]: any };
        data?: any;
        config?: AxiosRequestConfig;
      }
    };
  }
}
