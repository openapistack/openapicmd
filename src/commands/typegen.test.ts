import { expect, test } from '@oclif/test';
import { resourcePath } from '../__tests__/test-utils';
import 'chai';

describe('typegen', () => {
  describe('output', () => {
    test
      .stdout()
      .command(['typegen', resourcePath('openapi.yml')])
      .it('generates import statements', (ctx) => {
        expect(ctx.stdout).to.match(/import type/);
      });

    test
      .stdout()
      .command(['typegen', resourcePath('openapi.json')])
      .it('generates schemas', (ctx) => {
        expect(ctx.stdout).to.match(/Schemas/);
        expect(ctx.stdout).to.match(/Pet/);
      });

    test
      .stdout()
      .command(['typegen', resourcePath('openapi.json')])
      .it('generates operation paths', (ctx) => {
        expect(ctx.stdout).to.match(/Paths/);
        expect(ctx.stdout).to.match(/Responses/);
        expect(ctx.stdout).to.match(/PetRes/);
        expect(ctx.stdout).to.match(/Parameters/);
        expect(ctx.stdout).to.match(/ListPetsRes/);
      });

    test
      .stdout()
      .command(['typegen', resourcePath('openapi.json')])
      .it('generates operation methods', (ctx) => {
        expect(ctx.stdout).to.match(/getPets/);
        expect(ctx.stdout).to.match(/createPet/);
        expect(ctx.stdout).to.match(/getPetById/);
      });

    test
      .stdout()
      .command(['typegen', resourcePath('openapi.json')])
      .it('exports client', (ctx) => {
        expect(ctx.stdout).to.match(/export type Client/);
      })
  });
});
