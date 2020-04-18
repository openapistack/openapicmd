import { expect, test } from '@oclif/test';
import 'chai';

const COMMAND = 'init';

describe(COMMAND, () => {
  test
    .stdout()
    .command([COMMAND])
    .it('outputs an openapi file', (ctx) => {
      expect(ctx.stdout).to.contain('openapi: 3');
    });
});
