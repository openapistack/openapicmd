import { expect, test } from '@oclif/test';
import * as fs from 'fs';
import * as YAML from 'js-yaml';
import { resourcePath } from '../__tests__/test-utils';
import 'chai';
import { CONFIG_FILENAME } from '../common/config';

const COMMAND = 'unload';

// tslint:disable: no-unused-expression

describe(COMMAND, () => {
  beforeEach(() => {
    fs.writeFileSync(CONFIG_FILENAME, YAML.dump({ definition: 'openapi.json' }));
  });

  afterEach(() => {
    fs.unlink(CONFIG_FILENAME, (_err) => null);
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
    .it(`removes the definition property from the config file`, (_ctx) => {
      const config = YAML.load(fs.readFileSync(CONFIG_FILENAME));
      expect(config.definition).to.not.exist;
    });
});
