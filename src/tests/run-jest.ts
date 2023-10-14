import OpenAPIClientAxios, { AxiosRequestConfig, AxiosResponse } from "openapi-client-axios";
import { getConfigValue } from "../common/config";
import { TestCheck, TestConfig } from "./tests";
import { createSecurityRequestConfig } from '../common/security';
import { parseHeaderFlag } from '../common/utils';
import { getContext } from "../common/context";
import d from 'debug';
const debug = d('cmd');

const context = getContext()

const api = new OpenAPIClientAxios({ definition: context.document });
debug('jest context %o', context);

const testConfig: TestConfig = getConfigValue('tests');
for (const operationId of Object.keys(testConfig)) {
  describe(operationId, () => {
    for (const testName of Object.keys(testConfig[operationId])) {
      describe(testName, () => {
        const testDefinition = testConfig[operationId][testName];

        let res: AxiosResponse;
        beforeAll(async () => {
          const client = await getClientForTest({ operationId, requestConfig: testDefinition.request.config })
          res = await client[operationId](testDefinition.request.params, testDefinition.request.data);
        })

        if ((['Success2XX', 'default', 'all'] satisfies TestCheck[]).some((check) => testDefinition.checks.includes(check))) {
          test('should return 2XX response', async () => {
            expect(res.status).toBeGreaterThanOrEqual(200);
            expect(res.status).toBeLessThan(300);
          })
        }

        if ((['ValidResponse', 'default', 'all'] satisfies TestCheck[]).some((check) => testDefinition.checks.includes(check))) {
          test('should match response schema', async () => {
            expect(res.status).toBeGreaterThanOrEqual(300);
            expect(res.status).toBeLessThan(400);
          })
        }
      })
    }
  })
}

const getClientForTest = async (params: { operationId: string, requestConfig: AxiosRequestConfig }) => {
  const client = await api.getClient();

  const securityRequestConfig = await createSecurityRequestConfig({
    document: context.document,
    operation: api.getOperation(params.operationId),
    security: context.flags.security,
    header: context.flags.header,
    apikey: context.flags.apikey,
    token: context.flags.token,
    username: context.flags.username,
    password: context.flags.password,
  });
  debug('securityRequestConfig %o', securityRequestConfig);

  // add cookies
  const cookies = {
    ...securityRequestConfig.cookie,
  };
  const cookieHeader = Object.keys(cookies)
    .map((key) => `${key}=${cookies[key]}`)
    .join('; ');

  // add request headers
  client.defaults.headers.common = {
    ...params.requestConfig.headers,
    ...securityRequestConfig.header,
    ...parseHeaderFlag(context.flags.header),
    ...(Boolean(cookieHeader) && { cookie: cookieHeader }),
  };

  // add query params
  client.defaults.params = {
    ...params.requestConfig.params,
    ...securityRequestConfig.query,
  }

  // add basic auth
  client.defaults.auth = {
    ...params.requestConfig.auth,
    ...securityRequestConfig.auth,
  };

  return client;
}