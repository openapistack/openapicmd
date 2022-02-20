import { Command } from '@oclif/command';
import * as commonFlags from '../common/flags';
import * as fs from 'fs';
import * as YAML from 'js-yaml';
import { resolveConfigFile } from '../common/config';

export default class Unload extends Command {
  public static description = 'Unset the default definition file for a workspace (writes to .openapiconfig)';

  public static examples = [`$ openapi unload`];

  public static flags = {
    ...commonFlags.help(),
  };

  public static args = [];

  public async run() {
    const configFile = resolveConfigFile();
    if (configFile) {
      const oldConfig = YAML.safeLoad(fs.readFileSync(configFile));
      const { definition, ...newConfig } = oldConfig;
      fs.writeFileSync(configFile, YAML.safeDump(newConfig));
      this.log(`Written to ${configFile}`);
    }
    this.log('Unloaded succesfully!');
  }
}
