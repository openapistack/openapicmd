import OpenAPIClientAxios, { AxiosRequestConfig, AxiosResponse } from "openapi-client-axios";
import * as SwaggerParser from "@apidevtools/swagger-parser";
import { matchers as jsonSchemaMatchers } from 'jest-json-schema';

import { getConfigValue } from "../common/config";
import { TestCheck, TestConfig } from "./tests";
import { createSecurityRequestConfig } from '../common/security';
import { parseHeaderFlag } from '../common/utils';
import { getContext } from "../common/context";
import d from 'debug';

const debug = d('cmd');

expect.extend(jsonSchemaMatchers);

const context = getContext()
let api: OpenAPIClientAxios

beforeAll(async () => {
  const definition = await SwaggerParser.dereference(context.document);
  api = new OpenAPIClientAxios({ definition });
  await api.init()
});

const testConfig: TestConfig = getConfigValue('tests');
for (const operationId of Object.keys(testConfig)) {
  describe(operationId, () => {
    for (const testName of Object.keys(testConfig[operationId])) {
      describe(testName, () => {
        const testDefinition = testConfig[operationId][testName];

        let res: AxiosResponse;
        test(`request ${operationId}`, async () => {
          const client = await getClientForTest({ operationId, requestConfig: testDefinition.request.config })
          res = await client[operationId](testDefinition.request.params, testDefinition.request.data);
        })

        if ((['Success2XX', 'default', 'all'] satisfies TestCheck[]).some((check) => testDefinition.checks.includes(check))) {
          test('should return 2XX response', async () => {
            expect(res.status).toBeGreaterThanOrEqual(200);
            expect(res.status).toBeLessThan(300);
          })
        }

        if ((['ValidResponseBody', 'default', 'all'] satisfies TestCheck[]).some((check) => testDefinition.checks.includes(check))) {
          test('response body should match schema', async () => {
            const operation = api.getOperation(operationId);
            const responseObject =
              operation.responses[res.status] ||
              operation.responses[`${res.status}`] ||
              operation.responses.default ||
              operation.responses[Object.keys(operation.responses)[0]];
            const schema = responseObject?.['content']?.['application/json']?.schema;
            expect(res.data).toMatchSchema(schema)
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
  const headers = {
    ...params.requestConfig.headers,
    ...securityRequestConfig.header,
    ...parseHeaderFlag(context.flags.header),
    ...(Boolean(cookieHeader) && { cookie: cookieHeader }),
  };
  if (Object.keys(headers).length) {
    client.defaults.headers.common = headers;
  }

  // add query params
  const queryParams = {
    ...params.requestConfig.params,
    ...securityRequestConfig.query,
  }
  if (Object.keys(params).length) {
    client.defaults.params = queryParams;
  }

  // add basic auth
  const auth = {
    ...params.requestConfig.auth,
    ...securityRequestConfig.auth,
  };
  if (Object.keys(auth).length) {
    client.defaults.auth = auth;
  }

  // don't throw on error statuses
  client.defaults.validateStatus = () => true;

  return client;
}