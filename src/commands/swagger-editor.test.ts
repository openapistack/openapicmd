import { expect, test } from '@oclif/test';
import * as waitOn from 'wait-on';
import { resourcePath } from '../test-utils';
import 'chai';

const COMMAND = 'swagger-editor';
const TEST_PORT = 5552;

describe(COMMAND, () => {
  test
    .stdout()
    .command([COMMAND, resourcePath('openapi.yml'), '-p', `${TEST_PORT}`])
    .it('runs swagger-editor', async (ctx) => {
      await waitOn({ resources: [`tcp:localhost:${TEST_PORT}`] });
      expect(ctx.stdout).to.contain('running');
    });

  afterEach(() => {
    // emit disconnect to stop the server
    process.emit('disconnect');
  });
});
