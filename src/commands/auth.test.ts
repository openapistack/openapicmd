import { expect, test } from '@oclif/test';

import * as fs from 'fs';
import * as YAML from 'js-yaml';
import 'chai';
import { CONFIG_FILENAME } from '../common/config';
import { resourcePath, testDefinition } from '../__tests__/test-utils';

const COMMAND = 'auth';

describe(COMMAND, () => {
  beforeEach(() => {
    fs.unlink(CONFIG_FILENAME, (err) => null);
  });

  afterEach(() => {
    fs.unlink(CONFIG_FILENAME, (err) => null);
  });

  test
    .stdout()
    .command([COMMAND, '--security', 'BearerAuth', '--token', 'asd123', resourcePath('openapi.yml')])
    .it(`writes security config to the ${CONFIG_FILENAME} file`, (ctx) => {
      const config = fs.readFileSync(CONFIG_FILENAME, 'utf8');
      expect(config).to.match(/security/);
      expect(config).to.match(/BearerAuth/);
      expect(config).to.match(/asd123/);
    });
});
