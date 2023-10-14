import yargs from 'yargs'
import OpenAPIClientAxios from "openapi-client-axios";
import { getConfigValue } from "../common/config";
import { TestConfig } from "./tests";
import { parseDefinition, resolveDefinition } from '../common/definition';

const testConfig: TestConfig = getConfigValue('tests');

const argv = yargs(process.argv.slice(2))
  .option('header', { alias: 'H', type: 'string', array: true })
  .option('server', { alias: 'S', type: 'string', array: true })
  .option('inject', { alias: 'I', type: 'string', array: true })
  .option('apiRoot', { alias: 'R', type: 'string' })
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
  await api.init();
})

for (const operationId of Object.keys(testConfig)) {
  describe(operationId, () => {
    for (const testName of Object.keys(testConfig[operationId])) {
      describe(testName, () => {
        const testDefinition = testConfig[operationId][testName];

        if (testDefinition.checks.includes('Success2XX')) {
          test('should return 2XX response', async () => {
            const client = await api.getClient()        
            const res = await client[operationId](testDefinition.request.params, testDefinition.request.data, testDefinition.request.config);

            expect(res.status).toBeGreaterThanOrEqual(200);
            expect(res.status).toBeLessThan(300);
          })
        }
      })
    }
  })
}
