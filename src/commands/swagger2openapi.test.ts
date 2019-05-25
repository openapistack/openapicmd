import { expect, test } from '@oclif/test';
import * as path from 'path';
import 'chai';

describe('swagger2openapi', () => {
  test
    .stdout()
    .command(['swagger2openapi', path.join('examples', 'swagger.json')])
    .it('converts json swagger to openapi v3', (ctx) => {
      expect(ctx.stdout).to.contain('openapi: 3');
      expect(ctx.stdout).to.contain('My API');
    });

  test
    .stdout()
    .command(['swagger2openapi', path.join('examples', 'swagger.yml')])
    .it('converts yaml swagger to openapi v3', (ctx) => {
      expect(ctx.stdout).to.contain('openapi: 3');
      expect(ctx.stdout).to.contain('My API');
    });

  test
    .stdout()
    .command(['swagger2openapi', path.join('examples', 'swagger.json'), '--json'])
    .it('converts swagger to openapi v3 json', (ctx) => {
      expect(ctx.stdout).to.contain('{');
      expect(ctx.stdout).to.contain('"openapi": "3');
      expect(ctx.stdout).to.contain('My API');
      expect(ctx.stdout).to.contain('}');
    });
});
