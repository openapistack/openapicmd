import { expect, test } from '@oclif/test';
import * as path from 'path';
import 'chai';

describe('read', () => {
  describe('output', () => {
    test
      .stdout()
      .command(['read', '-d', path.join('examples', 'openapi.yml')])
      .it('reads yaml openapi spec', (ctx) => {
        expect(ctx.stdout).to.contain('My API');
      });

    test
      .stdout()
      .command(['read', '-d', path.join('examples', 'openapi.json')])
      .it('reads json openapi spec', (ctx) => {
        expect(ctx.stdout).to.contain('My API');
      });

    test
      .stdout()
      .command(['read', '-d', path.join('examples', 'openapi.yml'), '--json'])
      .it('reads openapi spec and outputs json', (ctx) => {
        expect(ctx.stdout).to.contain('My API');
        expect(ctx.stdout).to.contain('{');
        expect(ctx.stdout).to.contain('"openapi": "3');
        expect(ctx.stdout).to.contain('}');
      });

    test
      .stdout()
      .command(['read', '-d', path.join('examples', 'openapi.yml'), '--yaml'])
      .it('reads openapi spec and outputs yaml', (ctx) => {
        expect(ctx.stdout).to.contain('My API');
        expect(ctx.stdout).to.contain('openapi: 3');
      });
  });

  describe('validation', () => {
    test
      .stdout()
      .command(['read', '-d', path.join('examples', 'openapi.yml'), '--validate'])
      .it('validates correct openapi spec and outputs', (ctx) => {
        expect(ctx.stdout).to.contain('My API');
      });

    test
      .command(['read', '-d', path.join('examples', 'openapi-broken.yml'), '--validate'])
      .exit(1)
      .it('validates incorrect openapi spec, exits with code 1');
  });
});
