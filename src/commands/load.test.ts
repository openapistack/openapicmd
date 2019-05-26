import { expect, test } from '@oclif/test';
import * as path from 'path';
import 'chai';
import { CONFIG_FILENAME } from '../common/definition';

describe('load', () => {
  test
    .stdout()
    .command(['load', path.join('examples', 'swagger.json')])
    .it('loads definition to config file', (ctx) => {
      expect(ctx.stdout).to.contain(CONFIG_FILENAME);
      expect(ctx.stdout).to.contain('Loaded succesfully!');
    });
});
