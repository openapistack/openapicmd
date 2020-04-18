import * as path from 'path';
import * as fs from 'fs';
import * as YAML from 'js-yaml';

export const resourcePath = (...subpath: string[]) => {
  return path.join(__dirname, '..', '__tests__', 'resources', ...subpath);
};

export const testDefinition = YAML.safeLoad(fs.readFileSync(resourcePath('openapi.yml')));
export const testDefinitionBroken = YAML.safeLoad(fs.readFileSync(resourcePath('openapi-broken.yml')));
