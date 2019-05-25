import { Command, flags } from '@oclif/command';
import { parseDefinition, OutputFormat, stringifyDocument } from '../common/definition';
import * as commonFlags from '../common/flags';
import { Document } from 'swagger-parser';

export default class Read extends Command {
  public static description = 'read, parse and convert OpenAPI definitions';

  public static examples = [
    `$ openapi read -d ./openapi.yml -f json > openapi.json`,
    '$ openapi read -d https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml',
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.definition({ required: true }),
    ...commonFlags.outputFormat(),
    ...commonFlags.parseOpts(),
  };

  public static args = [];

  public async run() {
    const { flags } = this.parse(Read);
    const { definition, dereference, validate } = flags;
    let document: Document;
    try {
      document = await parseDefinition({ definition, dereference, validate });
    } catch (err) {
      this.error(err, { exit: 1 });
    }
    const format = flags.format === 'json' || flags.json ? OutputFormat.JSON : OutputFormat.YAML;
    this.log(stringifyDocument({ document, format }));
  }
}
