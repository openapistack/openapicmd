import { homedir } from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as YAML from 'js-yaml';

export const CONFIG_FILENAME = '.openapiconfig';

export function getConfigValue(key: string, defaultValue?: any): any {
  const configFile = resolveConfigFile();
  if (configFile) {
    const config = YAML.load(fs.readFileSync(configFile));
    return config[key] || defaultValue;
  }
  return defaultValue;
}

// walk backwards from cwd until homedir and check if CONFIG_FILENAME exists
export function resolveConfigFile() {
  let dir = path.resolve(process.cwd());
  while (dir.length >= homedir().length) {
    const checks = [
      path.join(dir, CONFIG_FILENAME),
      path.join(dir, `${CONFIG_FILENAME}.yml`),
      path.join(dir, `${CONFIG_FILENAME}.yaml`),
    ];
    for (const check of checks) {
      if (fs.existsSync(check)) {
        return check;
      }
    }
    // walk backwards
    dir = path.resolve(path.join(dir, '..'));
  }
}
