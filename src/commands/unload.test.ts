import { expect, test } from '@oclif/test';
import * as fs from 'fs';
import * as YAML from 'js-yaml';
import { resourcePath } from '../test-utils';
import 'chai';
import { CONFIG_FILENAME } from '../common/definition';

const COMMAND = 'unload';

// tslint:disable: no-unused-expression

describe(COMMAND, () => {
  beforeEach(() => {
    fs.writeFileSync(CONFIG_FILENAME, YAML.safeDump({ definition: 'openapi.json' }));
  });

  afterEach(() => {
    fs.unlink(CONFIG_FILENAME, (err) => null);
  });

  test
    .stdout()
    .command([COMMAND])
    .it('unloads definition from config file', (ctx) => {
      expect(ctx.stdout).to.contain('Unloaded succesfully!');
    });

  test
    .stdout()
    .command([COMMAND, resourcePath('openapi.yml')])
    .it(`removes the definition property from the config file`, (ctx) => {
      const config = YAML.safeLoad(fs.readFileSync(CONFIG_FILENAME));
      expect(config.definition).to.not.exist;
    });
});
