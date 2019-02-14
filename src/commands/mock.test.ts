import { expect, test } from '@oclif/test';
import * as path from 'path';
import 'chai';

describe('mock', () => {
  test
    .stdout()
    .command(['mock', '-d', path.join('examples', 'openapi.yml')])
    .it('runs mock server', (ctx) => {
      expect(ctx.stdout).to.contain('running');
    });

  afterEach(() => {
    // emit disconnect to stop the server
    process.emit('disconnect');
  });
});
