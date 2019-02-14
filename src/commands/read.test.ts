import { expect, test } from '@oclif/test';
import * as path from 'path';
import 'chai';

describe('read', () => {
  test
    .stdout()
    .command(['read', '-d', path.join('examples', 'openapi.yml')])
    .it('reads openapi spec', (ctx) => {
      expect(ctx.stdout).to.contain('My API');
    });

  test
    .stdout()
    .command(['read', '-d', path.join('examples', 'openapi.yml'), '--json'])
    .it('reads openapi spec and outputs json', (ctx) => {
      expect(ctx.stdout).to.contain('{');
      expect(ctx.stdout).to.contain('}');
    });
});
