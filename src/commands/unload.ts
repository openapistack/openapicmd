import { Command } from '@oclif/core';
import * as commonFlags from '../common/flags';
import * as fs from 'fs';
import * as YAML from 'js-yaml';
import { Config, resolveConfigFile } from '../common/config';

export class Unload extends Command {
  public static description = 'Unset the default definition file for a workspace (writes to .openapiconfig)';

  public static examples = [`$ openapi unload`];

  public static flags = {
    ...commonFlags.help(),
  };

  public async run() {
    const configFile = resolveConfigFile();
    if (configFile) {
      const oldConfig: Config = YAML.load(fs.readFileSync(configFile).toString());
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { definition, ...newConfig } = oldConfig;
      fs.writeFileSync(configFile, YAML.dump(newConfig));
      this.log(`Written to ${configFile}`);
    }
    this.log('Unloaded succesfully!');
  }
}
