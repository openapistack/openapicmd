import { Command } from '@oclif/command';
import { parseDefinition, OutputFormat, stringifyDocument, resolveDefinition } from '../common/definition';
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
    },
  ];

  public async run() {
    const { args, flags } = this.parse(Read);
    const { dereference, validate, bundle, header } = flags;

    const definition = resolveDefinition(args.definition);
    if (!definition) {
      this.error('Please load a definition file', { exit: 1 });
    }

    let document: Document;
    try {
      document = await parseDefinition({ definition, dereference, bundle, validate, servers: flags.server, header });
    } catch (err) {
      this.error(err, { exit: 1 });
    }
    const format = flags.format === 'json' || flags.json ? OutputFormat.JSON : OutputFormat.YAML;
    this.log(stringifyDocument({ document, format }));
  }
}
