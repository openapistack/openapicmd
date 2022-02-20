import { homedir } from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as YAML from 'js-yaml';

export const CONFIG_FILENAME = '.openapiconfig';

export function getConfigValue(key: string, defaultValue?: any): any {
  const configFile = resolveConfigFile();
  if (configFile) {
    const config = YAML.safeLoad(fs.readFileSync(configFile));
    return config[key] || defaultValue;
  }
  return defaultValue;
}

// walk backwards from cwd until homedir and check if CONFIG_FILENAME exists
export function resolveConfigFile() {
  let dir = path.resolve(process.cwd());
  while (dir.length >= homedir().length) {
    const check = path.join(dir, CONFIG_FILENAME);
    if (fs.existsSync(check)) {
      return path.join(dir, CONFIG_FILENAME);
    } else {
      // walk backwards
      dir = path.resolve(path.join(dir, '..'));
    }
  }
}
