import { Command, flags } from '@oclif/command';
import * as SwaggerParser from 'swagger-parser';
import * as YAML from 'yamljs';

export default class Read extends Command {
  public static description = 'read, parse and convert OpenAPI definitions';

  public static examples = [
    `$ openapi read -d ./openapi.yml -f json > openapi.json`,
    '$ openapi read -d https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml',
  ];

  public static flags = {
    help: flags.help({ char: 'h' }),
    definition: flags.string({ char: 'd', description: 'openapi definition file', required: true }),
    format: flags.enum({ char: 'f', description: 'format', options: ['json', 'yaml', 'yml'], default: 'yaml' }),
    json: flags.boolean({ description: 'format as json (short for -f json)' }),
    yaml: flags.boolean({ description: 'format as yaml (short for -f yaml)' }),
    dereference: flags.boolean({ char: 'D', description: 'resolve $ref pointers' }),
    validate: flags.boolean({ char: 'V', description: 'validate against openapi schema' }),
  };

  public static args = [];

  public async run() {
    const { flags } = this.parse(Read);
    const { definition, format, dereference, validate } = flags;

    let method = SwaggerParser.parse;
    if (dereference) {
      method = SwaggerParser.dereference;
    }
    if (validate) {
      method = SwaggerParser.validate;
    }

    const output = await method.bind(SwaggerParser)(definition);
    if (format === 'json' || flags.json) {
      // JSON output
      this.log(JSON.stringify(output, null, 2));
    } else {
      // YAML output
      this.log(YAML.stringify(output, 99, 2));
    }
  }
}
