import yargs from 'yargs'
import OpenAPIClientAxios, { AxiosRequestConfig, OpenAPIClient } from "openapi-client-axios";
import { getConfigValue } from "../common/config";
import { TestConfig } from "./tests";
import { parseDefinition, resolveDefinition } from '../common/definition';
import { createSecurityRequestConfig } from '../common/security';
import d from 'debug';
import { parseHeaderFlag } from '../common/utils';
const debug = d('cmd');

const testConfig: TestConfig = getConfigValue('tests');

const argv = yargs(process.argv.slice(2))
  .option('server', { alias: 'S', type: 'string', array: true })
  .option('inject', { alias: 'I', type: 'string', array: true })
  .option('apiRoot', { alias: 'R', type: 'string' })
  .option('header', { alias: 'H', type: 'string', array: true })
  .option('security', { alias: 's', type: 'string', array: true })
  .option('apikey', { alias: 'k', type: 'string' })
  .option('token', { alias: 't', type: 'string' })
  .option('username', { alias: 'u', type: 'string' })
  .option('password', { alias: 'p', type: 'string' })
  .parseSync()

const definition = resolveDefinition(argv[0] ?? getConfigValue('definition'));

let api: OpenAPIClientAxios;

beforeAll(async () => {
  const document = await parseDefinition({
    definition,
    servers: argv.server,
    inject: argv.inject,
    header: argv.header,
    induceServers: true,
  });

  api = new OpenAPIClientAxios({ definition: document });
})

for (const operationId of Object.keys(testConfig)) {
  describe(operationId, () => {
    for (const testName of Object.keys(testConfig[operationId])) {
      describe(testName, () => {
        const testDefinition = testConfig[operationId][testName];

        if (testDefinition.checks.includes('Success2XX')) {
          test('should return 2XX response', async () => {
            const client = await getClientForTest({ operationId, requestConfig: testDefinition.request.config })
            const res = await client[operationId](testDefinition.request.params, testDefinition.request.data);

            expect(res.status).toBeGreaterThanOrEqual(200);
            expect(res.status).toBeLessThan(300);
          })
        }
      })
    }
  })
}

const getClientForTest = async (params: { operationId: string, requestConfig: AxiosRequestConfig }) => {
  const client = await api.init();

  const securityRequestConfig = await createSecurityRequestConfig({
    document: definition,
    operation: api.getOperation(params.operationId),
    security: argv.security,
    header: argv.header,
    apikey: argv.apikey,
    token: argv.token,
    username: argv.username,
    password: argv.password,
    noInteractive: true,
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
    ...parseHeaderFlag(argv.header),
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