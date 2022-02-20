import { expect, test } from '@oclif/test';
import { resourcePath } from '../test-utils';
import 'chai';

const COMMAND = 'info';

describe(COMMAND, () => {
  test
    .stdout()
    .command([COMMAND, resourcePath('openapi.yml')])
    .it('prints information about a definition file', (ctx) => {
      expect(ctx.stdout).to.contain('title');
      expect(ctx.stdout).to.contain('version');
      expect(ctx.stdout).to.contain('securitySchemes');
    });

  test
    .stdout()
    .command([COMMAND, resourcePath('openapi.yml'), '--operations'])
    .it('lists api operations', (ctx) => {
      expect(ctx.stdout).to.contain('operations');
    });

  test
    .stdout()
    .command([COMMAND, resourcePath('openapi.yml'), '--schemas'])
    .it('lists api schemas', (ctx) => {
      expect(ctx.stdout).to.contain('schemas');
    });

  test
    .stdout()
    .command([COMMAND, resourcePath('openapi.yml'), '--security'])
    .it('lists security schemes', (ctx) => {
      expect(ctx.stdout).to.contain('securitySchemes');
    });
});
