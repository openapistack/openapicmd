import { expect, test } from '@oclif/test';
import { resourcePath } from '../__tests__/test-utils';
import 'chai';

describe('info', () => {
  test
    .stdout()
    .command(['info', resourcePath('openapi.yml')])
    .it('prints information about a definition file', (ctx) => {
      expect(ctx.stdout).to.contain('title');
      expect(ctx.stdout).to.contain('version');
      expect(ctx.stdout).to.contain('securitySchemes');
      expect(ctx.stdout).to.contain('servers');
    });

  test
    .stdout()
    .command(['info', resourcePath('openapi.yml'), '--operations'])
    .it('lists api operations', (ctx) => {
      expect(ctx.stdout).to.contain('operations');
    });

  test
    .stdout()
    .command(['info', resourcePath('openapi.yml'), '--schemas'])
    .it('lists api schemas', (ctx) => {
      expect(ctx.stdout).to.contain('schemas');
    });

  test
    .stdout()
    .command(['info', resourcePath('openapi.yml'), '--security'])
    .it('lists security schemes', (ctx) => {
      expect(ctx.stdout).to.contain('securitySchemes');
    });
});
