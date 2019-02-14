import { expect, test } from '@oclif/test';
import * as path from 'path';
import 'chai';

describe('swaggerui', () => {
  test
    .stdout()
    .command(['swaggerui', '-d', path.join('examples', 'openapi.yml')])
    .it('runs swaggerui', (ctx) => {
      expect(ctx.stdout).to.contain('running');
    });

  afterEach(() => {
    // emit disconnect to stop the server
    process.emit('disconnect');
  });
});
