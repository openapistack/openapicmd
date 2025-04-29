import { expect, test } from '@oclif/test';
import * as fs from 'fs';
import * as path from 'path';
import * as waitOn from 'wait-on';
import * as rimraf from 'rimraf';
import { resourcePath } from '../__tests__/test-utils';
import { testDefinition } from '../__tests__/test-utils';
import 'chai';

const TEST_PORT = 5552;
const TEST_PORT_PROXY = 5553;

describe('swagger-ui', () => {
  describe('server', () => {
    afterEach(() => {
      // emit disconnect to stop the server
      process.emit('disconnect');
    });

    test
      .stdout()
      .command(['swagger-ui', resourcePath('openapi.yml'), '-p', `${TEST_PORT}`])
      .it('runs swagger-ui', async (ctx) => {
        await waitOn({ resources: [`tcp:localhost:${TEST_PORT}`] });
        expect(ctx.stdout).to.contain('Swagger UI running');
      });
  });

  describe('--proxy', () => {
    let endpointCalled: boolean;
    const setEndpointCalled = (val: boolean) => (endpointCalled = Boolean(val));

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
      .command(['swagger-ui', 'https://myapi.com/openapi.json', '--proxy', '--server', 'https://myapi.com', '-p', `${TEST_PORT_PROXY}`])
      .it('sets up a proxy to the API under /proxy', async (ctx) => {
        await waitOn({ resources: [`tcp:localhost:${TEST_PORT_PROXY}`] });
        expect(ctx.stdout).to.contain('Proxy running');

        const res = await fetch(`http://localhost:${TEST_PORT_PROXY}/proxy/pets`)

        expect(res.status).to.equal(200);
        expect(endpointCalled).to.be.true;
      });
  });

  describe('--bundle', () => {
    const bundleDir = 'static';
    afterEach(() => {
      rimraf.sync(bundleDir);
    });
    test
      .stdout()
      .command(['swagger-ui', resourcePath('openapi.yml'), '--bundle', bundleDir])
      .it('bundles swagger-ui', (_ctx) => {
        expect(fs.existsSync(path.join(bundleDir))).to.equal(true);
        expect(fs.existsSync(path.join(bundleDir, 'index.html'))).to.equal(true);
        expect(fs.existsSync(path.join(bundleDir, 'openapi.json'))).to.equal(true);
        expect(fs.existsSync(path.join(bundleDir, 'swagger-ui.js'))).to.equal(true);
      });
  });

});
