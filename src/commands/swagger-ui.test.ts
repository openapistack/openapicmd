import { expect, test } from '@oclif/test';
import * as path from 'path';
import 'chai';

describe('swagger-ui', () => {
  test
    .stdout()
    .command(['swagger-ui', '-d', path.join('examples', 'openapi.yml')])
    .it('runs swagger-ui', (ctx) => {
      expect(ctx.stdout).to.contain('running');
    });

  afterEach(() => {
    // emit disconnect to stop the server
    process.emit('disconnect');
  });
});
