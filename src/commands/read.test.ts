import { expect, test } from '@oclif/test';
import { resourcePath, testDefinition, testDefinitionWithoutInternal, testDefinitionWithoutInternalAndUnreferenced } from '../__tests__/test-utils';
import * as SwaggerParser from '@apidevtools/swagger-parser';
import * as YAML from 'js-yaml';
import 'chai';

describe('read', () => {
  describe('output', () => {
    test
      .stdout()
      .command(['read', resourcePath('openapi.yml')])
      .it('reads yaml openapi spec', (ctx) => {
        const output = YAML.load(ctx.stdout);
        expect(output).to.deep.equal(testDefinition);
      });

    test
      .stdout()
      .command(['read', resourcePath('openapi-with-internal.yml'), '--exclude-ext', 'x-internal'])
      .it('reads yaml openapi spec exluding operations and resources with x-internal', (ctx) => {
        const output = YAML.load(ctx.stdout);
        expect(output).to.deep.equal(testDefinitionWithoutInternal);
      });


    test
    .stdout()
    .command(['read', resourcePath('openapi-with-internal.yml'), '--exclude-ext', 'x-internal', '--remove-unreferenced'])
    .it('reads yaml openapi spec exluding operations and resources with x-internal and also remove unreferenced components', (ctx) => {
      const output = YAML.load(ctx.stdout);
      expect(output).to.deep.equal(testDefinitionWithoutInternalAndUnreferenced);
    });

    test
      .stdout()
      .command(['read', resourcePath('openapi.json')])
      .it('reads json openapi spec', (ctx) => {
        const output = YAML.load(ctx.stdout);
        expect(output).to.deep.equal(testDefinition);
      });

    test
      .nock('https://myapi.com', (api) => api.get('/openapi.json').reply(200, testDefinition))
      .stdout()
      .command(['read', 'https://myapi.com/openapi.json'])
      .it('reads remote openapi spec', (ctx) => {
        const output = YAML.load(ctx.stdout);
        expect(output).to.deep.equal(testDefinition);
      });

    test
      .stdout()
      .command(['read', resourcePath('openapi.json'), '--server', 'http://localhost:9999'])
      .it('can add a server', (ctx) => {
        const output = YAML.load(ctx.stdout) as SwaggerParser.Document;
        expect(output.servers[0].url).to.equal('http://localhost:9999');
      });

    test
      .stdout()
      .command(['read', resourcePath('openapi.json'), '-S', 'http://localhost:9998', '-S', 'http://localhost:9999'])
      .it('can add multiple servers', (ctx) => {
        const output = YAML.load(ctx.stdout) as SwaggerParser.Document;
        expect(output.servers[0].url).to.equal('http://localhost:9998');
        expect(output.servers[1].url).to.equal('http://localhost:9999');
      });

    test
      .stdout()
      .command(['read', resourcePath('openapi.yml'), '--json'])
      .it('reads openapi spec and outputs json', (ctx) => {
        const output = JSON.parse(ctx.stdout);
        expect(output).to.deep.equal(testDefinition);
      });

    test
      .stdout()
      .command(['read', resourcePath('openapi.json'), '--yaml'])
      .it('reads openapi spec and outputs yaml', (ctx) => {
        const output = YAML.load(ctx.stdout);
        expect(output).to.deep.equal(testDefinition);
      });
  });

  describe('--validate', () => {
    test
      .stdout()
      .command(['read', resourcePath('openapi.yml'), '--validate'])
      .it('validates correct openapi file', async (ctx) => {
        const output = YAML.load(ctx.stdout);
        const expected = await SwaggerParser.validate(resourcePath('openapi.yml'));
        expect(output).to.deep.equal(expected);
      });

    test
      .command(['read', resourcePath('openapi-broken.yml'), '--validate'])
      .exit(1)
      .it('validates incorrect openapi file, exits with code 1');
  });

  describe('--dereference', () => {
    test
      .stdout()
      .command(['read', resourcePath('openapi.yml'), '--dereference'])
      .it('resolves $ref pointers from an openapi file', async (ctx) => {
        const output = YAML.load(ctx.stdout);
        const expected = await SwaggerParser.dereference(resourcePath('openapi.yml'));
        expect(output).to.deep.equal(expected);
      });

    describe('--bundle', () => {
      test
        .stdout()
        .command(['read', resourcePath('openapi.yml'), '--bundle'])
        .it('resolves remote $ref pointers from an openapi file', async (ctx) => {
          const output = YAML.load(ctx.stdout);
          const expected = await SwaggerParser.bundle(resourcePath('openapi.yml'));
          expect(output).to.deep.equal(expected);
        });
    });
  });
});
