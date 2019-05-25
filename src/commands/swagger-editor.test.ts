import { expect, test } from '@oclif/test';
import * as path from 'path';
import 'chai';

describe('swagger-editor', () => {
  test
    .stdout()
    .command(['swagger-editor', path.join('examples', 'openapi.yml')])
    .it('runs swagger-editor', (ctx) => {
      expect(ctx.stdout).to.contain('running');
    });

  afterEach(() => {
    // emit disconnect to stop the server
    process.emit('disconnect');
  });
});
