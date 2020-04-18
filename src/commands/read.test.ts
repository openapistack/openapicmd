import { expect, test } from '@oclif/test';
import { resourcePath, testDefinition } from '../test-utils';
import * as SwaggerParser from 'swagger-parser';
import * as YAML from 'js-yaml';
import 'chai';

// tslint:disable: no-unused-expression

const COMMAND = 'read';

describe(COMMAND, () => {
  describe('output', () => {
    test
      .stdout()
      .command([COMMAND, resourcePath('openapi.yml')])
      .it('reads yaml openapi spec', (ctx) => {
        const output = YAML.safeLoad(ctx.stdout);
        expect(output).to.deep.equal(testDefinition);
      });

    test
      .stdout()
      .command([COMMAND, resourcePath('openapi.json')])
      .it('reads json openapi spec', (ctx) => {
        const output = YAML.safeLoad(ctx.stdout);
        expect(output).to.deep.equal(testDefinition);
      });

    test
      .nock('https://myapi.com', (api) => api.get('/openapi.json').reply(200, testDefinition))
      .stdout()
      .command([COMMAND, 'https://myapi.com/openapi.json'])
      .it('reads remote openapi spec', (ctx) => {
        const output = YAML.safeLoad(ctx.stdout);
        expect(output).to.deep.equal(testDefinition);
      });

    test
      .stdout()
      .command([COMMAND, resourcePath('openapi.json'), '--server', 'http://localhost:9999'])
      .it('can add a server', (ctx) => {
        const output = YAML.safeLoad(ctx.stdout);
        expect(output.servers[0].url).to.equal('http://localhost:9999');
      });

    test
      .stdout()
      .command([COMMAND, resourcePath('openapi.json'), '-S', 'http://localhost:9998', '-S', 'http://localhost:9999'])
      .it('can add multiple servers', (ctx) => {
        const output = YAML.safeLoad(ctx.stdout);
        expect(output.servers[0].url).to.equal('http://localhost:9998');
        expect(output.servers[1].url).to.equal('http://localhost:9999');
      });

    test
      .stdout()
      .command([COMMAND, resourcePath('openapi.yml'), '--json'])
      .it('reads openapi spec and outputs json', (ctx) => {
        const output = JSON.parse(ctx.stdout);
        expect(output).to.deep.equal(testDefinition);
      });

    test
      .stdout()
      .command([COMMAND, resourcePath('openapi.json'), '--yaml'])
      .it('reads openapi spec and outputs yaml', (ctx) => {
        const output = YAML.safeLoad(ctx.stdout);
        expect(output).to.deep.equal(testDefinition);
      });
  });

  describe('--validate', () => {
    test
      .stdout()
      .command([COMMAND, resourcePath('openapi.yml'), '--validate'])
      .it('validates correct openapi file', async (ctx) => {
        const output = YAML.safeLoad(ctx.stdout);
        const expected = await SwaggerParser.validate(resourcePath('openapi.yml'));
        expect(output).to.deep.equal(expected);
      });

    test
      .command([COMMAND, resourcePath('openapi-broken.yml'), '--validate'])
      .exit(1)
      .it('validates incorrect openapi file, exits with code 1');
  });

  describe('--dereference', () => {
    test
      .stdout()
      .command([COMMAND, resourcePath('openapi.yml'), '--dereference'])
      .it('resolves $ref pointers from an openapi file', async (ctx) => {
        const output = YAML.safeLoad(ctx.stdout);
        const expected = await SwaggerParser.dereference(resourcePath('openapi.yml'));
        expect(output).to.deep.equal(expected);
      });

    describe('--bundle', () => {
      test
        .stdout()
        .command([COMMAND, resourcePath('openapi.yml'), '--bundle'])
        .it('resolves remote $ref pointers from an openapi file', async (ctx) => {
          const output = YAML.safeLoad(ctx.stdout);
          const expected = await SwaggerParser.bundle(resourcePath('openapi.yml'));
          expect(output).to.deep.equal(expected);
        });
    });
  });
});
