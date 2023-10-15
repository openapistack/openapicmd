import { expect, test } from '@oclif/test';

import * as fs from 'fs';
import 'chai';
import { CONFIG_FILENAME } from '../common/config';
import { resourcePath } from '../__tests__/test-utils';

describe('auth', () => {
  beforeEach(() => {
    fs.unlink(CONFIG_FILENAME, (_err) => null);
  });

  afterEach(() => {
    fs.unlink(CONFIG_FILENAME, (_err) => null);
  });

  test
    .stdout()
    .command(['auth', '--security', 'BearerAuth', '--token', 'asd123', resourcePath('openapi.yml')])
    .it(`writes security config to the ${CONFIG_FILENAME} file`, (_ctx) => {
      const config = fs.readFileSync(CONFIG_FILENAME, 'utf8');
      expect(config).to.match(/security/);
      expect(config).to.match(/BearerAuth/);
      expect(config).to.match(/asd123/);
    });
});
