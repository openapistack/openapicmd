import { expect, test } from '@oclif/test';
import * as path from 'path';
import 'chai';

describe('init', () => {
  test
    .stdout()
    .command(['init'])
    .it('outputs an openapi file', (ctx) => {
      expect(ctx.stdout).to.contain('openapi: 3');
    });
});
