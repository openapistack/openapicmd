import { expect, test } from '@oclif/test';
import { resourcePath, testDefinition } from '../__tests__/test-utils';
import 'chai';

// tslint:disable: no-unused-expression

const testURL = 'http://api.json';
const COMMAND = 'call';

describe(COMMAND, () => {
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
    .command([COMMAND, 'https://myapi.com/openapi.json', '-o', 'getPets', '--apikey', 'secret'])
    .it('calls GET /pets with -o getPets', (ctx) => {
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
    .command([COMMAND, 'https://myapi.com/openapi.json', '-o', 'getPetById', '-p', 'id=1', '--apikey', 'secret'])
    .it('calls GET /pets/1 with -o getPetById -p id=1', (ctx) => {
      expect(endpointCalled).to.be.true;
    });
});
