import { expect, test } from '@oclif/test';
import * as fs from 'fs';
import * as YAML from 'js-yaml';
import { resourcePath } from '../__tests__/test-utils';
import 'chai';
import { CONFIG_FILENAME, Config } from '../common/config';

describe('unload', () => {
  beforeEach(() => {
    fs.writeFileSync(CONFIG_FILENAME, YAML.dump({ definition: 'openapi.json' }));
  });

  afterEach(() => {
    fs.unlink(CONFIG_FILENAME, (_err) => null);
  });

  test
    .stdout()
    .command(['unload'])
    .it('unloads definition from config file', (ctx) => {
      expect(ctx.stdout).to.contain('Unloaded succesfully!');
    });

  test
    .stdout()
    .command(['unload', resourcePath('openapi.yml')])
    .it(`removes the definition property from the config file`, (_ctx) => {
      const config = YAML.load(fs.readFileSync(CONFIG_FILENAME).toString()) as Config;
      expect(config.definition).to.not.exist;
    });
});
