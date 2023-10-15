import { expect, test } from '@oclif/test';
import * as fs from 'fs';
import * as path from 'path';
import * as waitOn from 'wait-on';
import * as rimraf from 'rimraf';
import { resourcePath } from '../__tests__/test-utils';
import 'chai';

const TEST_PORT = 5552;

describe('redoc', () => {
  describe('server', () => {
    afterEach(() => {
      // emit disconnect to stop the server
      process.emit('disconnect');
    });

    test
      .stdout()
      .command(['redoc', resourcePath('openapi.yml'), '-p', `${TEST_PORT}`])
      .it('runs local redoc server', async (ctx) => {
        await waitOn({ resources: [`tcp:localhost:${TEST_PORT}`] });
        expect(ctx.stdout).to.contain('running');
      });
  });

  describe('--bundle', () => {
    const bundleDir = 'static';
    afterEach(() => {
      rimraf.sync(bundleDir);
    });
    test
      .stdout()
      .command(['redoc', resourcePath('openapi.yml'), '--bundle', bundleDir])
      .it('bundles redoc', (_ctx) => {
        expect(fs.existsSync(path.join(bundleDir))).to.equal(true);
        expect(fs.existsSync(path.join(bundleDir, 'index.html'))).to.equal(true);
        expect(fs.existsSync(path.join(bundleDir, 'openapi.json'))).to.equal(true);
      });
  });
});
