import { Command, flags } from '@oclif/command';
import * as SwaggerParser from 'swagger-parser';
import * as YAML from 'yamljs';
import { convertObj } from 'swagger2openapi';
import { promisify } from 'util';

export default class Swagger2Openapi extends Command {
  public static description = 'convert Swagger 2.0 definitions into OpenApi 3.0.x';

  public static examples = [`$ openapiw swagger2openapi --yaml -d ./swagger.json > openapi.yml`];

  public static flags = {
    help: flags.help({ char: 'h' }),
    definition: flags.string({
      char: 'd',
      description: 'openapi definition file',
      required: true,
      helpValue: './openapi.yml',
    }),
    format: flags.enum({
      char: 'f',
      description: '[default: yaml] output format',
      options: ['json', 'yaml', 'yml'],
      exclusive: ['json', 'yaml'],
    }),
    json: flags.boolean({ description: 'output as json (short for -f json)', exclusive: ['format', 'yaml'] }),
    yaml: flags.boolean({ description: 'output as yaml (short for -f yaml)', exclusive: ['format', 'json'] }),
    dereference: flags.boolean({ char: 'D', description: 'resolve $ref pointers' }),
    validate: flags.boolean({ char: 'V', description: 'validate against openapi schema' }),
  };

  public static args = [];

  public async run() {
    const { flags } = this.parse(Swagger2Openapi);
    const { definition, format, dereference, validate } = flags;
    const options = {};

    let method = SwaggerParser.parse;
    if (dereference) {
      method = SwaggerParser.dereference;
    }
    if (validate) {
      method = SwaggerParser.validate;
    }

    const swagger = await method.bind(SwaggerParser)(definition);
    const { openapi: output } = await promisify(convertObj)(swagger, options);
    if (format === 'json' || flags.json) {
      // JSON output
      this.log(JSON.stringify(output, null, 2));
    } else {
      // YAML output
      this.log(YAML.stringify(output, 99, 2));
    }
  }
}
