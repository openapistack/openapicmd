import OpenAPIClientAxios, { AxiosRequestConfig, AxiosResponse, OpenAPIClient, Operation } from "openapi-client-axios";
import * as SwaggerParser from "@apidevtools/swagger-parser";
import { matchers as jsonSchemaMatchers } from 'jest-json-schema';

import { getConfigValue } from "../common/config";
import { TestCheck, TestConfig } from "./tests";
import { createSecurityRequestConfig } from '../common/security';
import { parseHeaderFlag } from '../common/utils';
import { getContext } from "../common/context";
import d from 'debug';
import chalk = require("chalk");

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

        let request: AxiosRequestConfig;
        let response: AxiosResponse;
        let operation: Operation;
        let client: OpenAPIClient;
        let failed = false;

        beforeAll(async () => {
          operation = api.getOperation(operationId);
          client = await getClientForTest({ operationId, requestConfig: testDefinition.request.config })
          request = api.getAxiosConfigForOperation(operation, [testDefinition.request.params, testDefinition.request.data]);
        })

        afterEach(() => {
          const currentTest = expect.getState();
          debug('currentTest %o', currentTest)

          if (!failed && currentTest.assertionCalls > currentTest.numPassingAsserts) {
            failed = true;

            verboseLog(`${chalk.bgRed(' FAILED ')} ${chalk.bold(operationId)} › ${testName}\n`);
            verboseLog(`${chalk.green(request.method.toUpperCase())} ${request.url}`);
            verboseLog(request);

            verboseLog(chalk.gray('RESPONSE META:'));
            verboseLog({
              code: response.status,
              status: response.statusText,
              headers: response.headers,
            });
            verboseLog(chalk.gray('RESPONSE BODY:'));
            verboseLog(response.data || chalk.gray('(empty response)'), '\n');
          } 
        })

        test(`request ${operationId}`, async () => {
          debug('request %o', request);
          if (context.flags.verbose) {
            verboseLog(`${chalk.bold(operationId)} › ${testName}\n`);
            verboseLog(`${chalk.green(request.method.toUpperCase())} ${request.url}`);
            verboseLog(request);
          }

          response = await client[operationId](testDefinition.request.params, testDefinition.request.data);

          debug('res %o', { code: response.status, headers: response.headers, data: response.data });
          if (context.flags.verbose) {
            verboseLog(chalk.gray('RESPONSE META:'));
            verboseLog({
              code: response.status,
              status: response.statusText,
              headers: response.headers,
            });
            verboseLog(chalk.gray('RESPONSE BODY:'));
            verboseLog(response.data || chalk.gray('(empty response)'), '\n');
          }
        })

        if ((['Success2XX', 'default', 'all'] satisfies TestCheck[]).some((check) => testDefinition.checks.includes(check))) {
          test('should return 2XX response', async () => {
            expect(`${response.status}`).toMatch(/2\d\d/)
          })
        }

        if ((['ValidResponseBody', 'default', 'all'] satisfies TestCheck[]).some((check) => testDefinition.checks.includes(check))) {
          test('response body should match schema', async () => {
            const operation = api.getOperation(operationId);
            const responseObject =
              operation.responses[response.status] ||
              operation.responses[`${response.status}`] ||
              operation.responses.default ||
              operation.responses[Object.keys(operation.responses)[0]];
            const schema = responseObject?.['content']?.['application/json']?.schema;
            expect(response.data).toMatchSchema(schema)
          })
        }
      })
    }
  })
}

const getClientForTest = async (params: { operationId: string, requestConfig: AxiosRequestConfig }) => {
  const client = await api.init();

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

const verboseLog = (...messages: any[]) => {
  const message = messages.map((m) => (typeof m === 'string' ? m : JSON.stringify(m, null, 2))).join(' ');

  process.stderr.write(`${message}\n`);
}