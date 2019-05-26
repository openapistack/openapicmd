import { expect, test } from '@oclif/test';
import 'chai';

describe('init', () => {
  test
    .stdout()
    .command(['init'])
    .it('outputs an openapi file', (ctx) => {
      expect(ctx.stdout).to.contain('openapi: 3');
    });
});
