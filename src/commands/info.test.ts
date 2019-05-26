import { expect, test } from '@oclif/test';
import * as path from 'path';
import 'chai';

describe('info', () => {
  test
    .stdout()
    .command(['info', path.join('examples', 'swagger.json')])
    .it('prints information about a definition file', (ctx) => {
      expect(ctx.stdout).to.contain('title');
      expect(ctx.stdout).to.contain('version');
    });

  test
    .stdout()
    .command(['info', path.join('examples', 'swagger.json'), '--operations'])
    .it('lists api operations', (ctx) => {
      expect(ctx.stdout).to.contain('Operations:');
    });
});
