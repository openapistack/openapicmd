import { expect, test } from '@oclif/test';

import * as fs from 'fs';
import * as YAML from 'js-yaml';
import 'chai';
import { CONFIG_FILENAME } from '../common/config';
import { resourcePath, testDefinition } from '../test-utils';

const COMMAND = 'load';

describe(COMMAND, () => {
  beforeEach(() => {
    fs.unlink(CONFIG_FILENAME, (err) => null);
  });

  afterEach(() => {
    fs.unlink(CONFIG_FILENAME, (err) => null);
  });

  test
    .stdout()
    .command([COMMAND, resourcePath('openapi.yml')])
    .it('loads local definition definition file', (ctx) => {
      expect(ctx.stdout).to.contain('Loaded succesfully!');
    });

  test
    .nock('https://myapi.com', (api) => api.get('/openapi.json').reply(200, testDefinition))
    .stdout()
    .command([COMMAND, 'https://myapi.com/openapi.json'])
    .it('loads remote definition file', (ctx) => {
      expect(ctx.stdout).to.contain('Loaded succesfully!');
    });

  test
    .stdout()
    .command([COMMAND, resourcePath('openapi.yml')])
    .it(`creates a ${CONFIG_FILENAME} file`, (ctx) => {
      expect(fs.existsSync(CONFIG_FILENAME)).to.equal(true);
    });

  test
    .stdout()
    .command([COMMAND, resourcePath('openapi.yml')])
    .it(`writes the definition path to the ${CONFIG_FILENAME} file`, (ctx) => {
      const config = YAML.safeLoad(fs.readFileSync(CONFIG_FILENAME));
      expect(config.definition).to.match(new RegExp('openapi.yml'));
    });
});
