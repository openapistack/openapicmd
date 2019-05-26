import { Command, flags } from '@oclif/command';
import * as commonFlags from '../common/flags';
import * as path from 'path';
import * as fs from 'fs';
import * as YAML from 'js-yaml';
import { resolveConfigFile, CONFIG_FILENAME, parseDefinition } from '../common/definition';

export default class Load extends Command {
  public static description = 'load an openapi definition file (writes to .openapiconfig)';

  public static examples = [
    `$ openapi load ./openapi.yml`,
    '$ openapi load https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml',
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.validate(),
  };

  public static args = [
    {
      name: 'definition',
      description: 'input definition file',
      required: true,
    },
  ];

  public async run() {
    const { args, flags } = this.parse(Load);
    const definition = path.resolve(args.definition);

    // check that definition can be parsed
    try {
      await parseDefinition({ definition, validate: flags.validate });
    } catch (err) {
      this.error(err, { exit: 1 });
    }

    const configFile = resolveConfigFile();

    // write to config file
    const oldConfig = configFile ? YAML.safeLoad(fs.readFileSync(configFile)) : {};
    const newConfig = {
      ...oldConfig,
      definition,
    };

    // default to current directory
    const writeTo = path.resolve(configFile || `./${CONFIG_FILENAME}`);

    // write as YAML
    fs.writeFileSync(writeTo, YAML.safeDump(newConfig));
    this.log(`Wrote to ${writeTo}`);
    this.log(`Loaded succesfully!`);
  }
}
