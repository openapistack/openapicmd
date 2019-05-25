import { Command, flags } from '@oclif/command';
import { parseDefinition, OutputFormat, stringifyDocument } from '../common/definition';
import * as commonFlags from '../common/flags';
import { Document } from 'swagger-parser';

export default class Read extends Command {
  public static description = 'read, parse and convert OpenAPI definitions';

  public static examples = [
    '$ openapi read https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml',
    `$ openapi read ./openapi.yml -f json > openapi.json`,
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.parseOpts(),
    ...commonFlags.outputFormat(),
  };

  public static args = [
    {
      name: 'definition',
      description: 'input definition file',
      required: true,
    },
  ];

  public async run() {
    const { args, flags } = this.parse(Read);
    const { definition } = args;
    const { dereference, validate } = flags;
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
