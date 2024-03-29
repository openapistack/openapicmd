import { expect, test } from '@oclif/test';
import { testDefinition } from '../__tests__/test-utils';
import 'chai';

describe('call', () => {
  let endpointCalled: boolean;
  const setEndpointCalled = (val: boolean) => (endpointCalled = Boolean(val));

  // silence console.warn during tests
  const consoleWarn = console.warn;
  beforeEach(() => {
    console.warn = () => null;
  });
  afterEach(() => {
    console.warn = consoleWarn;
  });

  test
    .do(() => setEndpointCalled(false))
    .nock('https://myapi.com', (api) =>
      api
        .get('/openapi.json')
        .reply(200, testDefinition)
        .get('/pets')
        .reply(200, () => {
          setEndpointCalled(true);
          return {};
        }),
    )
    .stdout()
    .command(['call', 'https://myapi.com/openapi.json', '-o', 'getPets', '--apikey', 'secret'])
    .it('calls GET /pets with -o getPets', (_ctx) => {
      expect(endpointCalled).to.be.true;
    });

  test
    .do(() => setEndpointCalled(false))
    .nock('https://myapi.com', (api) =>
      api
        .get('/openapi.json')
        .reply(200, testDefinition)
        .get('/pets/1')
        .reply(200, () => {
          setEndpointCalled(true);
          return {};
        }),
    )
    .stdout()
    .command(['call', 'https://myapi.com/openapi.json', '-o', 'getPetById', '-p', 'id=1', '--apikey', 'secret'])
    .it('calls GET /pets/1 with -o getPetById -p id=1', (_ctx) => {
      expect(endpointCalled).to.be.true;
    });
});
