import * as path from 'path';
import * as fs from 'fs';
import * as YAML from 'js-yaml';

export const resourcePath = (...subpath: string[]) => {
  return path.join(__dirname, '..', '..', '__tests__', 'resources', ...subpath);
};

export const testDefinition = YAML.load(fs.readFileSync(resourcePath('openapi.yml')).toString());
export const testDefinitionBroken = YAML.load(fs.readFileSync(resourcePath('openapi-broken.yml')).toString());
export const testDefinitionWithoutInternal = YAML.load(fs.readFileSync(resourcePath('openapi-without-internal.yml')).toString());
