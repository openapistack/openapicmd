import { expect, test } from '@oclif/test';
import * as path from 'path';
import 'chai';

describe('unload', () => {
  test
    .stdout()
    .command(['unload'])
    .it('unloads definition from config file', (ctx) => {
      expect(ctx.stdout).to.contain('Unloaded succesfully!');
    });
});
