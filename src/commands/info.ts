import { Command, flags } from '@oclif/command';
import { parseDefinition, resolveDefinition, printInfo, printOperations, printSchemas } from '../common/definition';
import * as commonFlags from '../common/flags';
import { Document } from 'swagger-parser';

export default class Info extends Command {
  public static description = 'print information about definition file';

  public static examples = [
    '$ openapi info https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml',
    `$ openapi info ./openapi.yml`,
  ];

  public static flags = {
    ...commonFlags.help(),
    operations: flags.boolean({ description: 'list operations in document', default: true, allowNo: true }),
    schemas: flags.boolean({ description: 'list schemas in document', default: false, allowNo: true }),
  };

  public static args = [
    {
      name: 'definition',
      description: 'input definition file',
    },
  ];

  public async run() {
    const { args, flags } = this.parse(Info);

    const definition = resolveDefinition(args.definition);
    if (!definition) {
      this.error('Please load a definition file', { exit: 1 });
    }

    let document: Document;
    try {
      document = await parseDefinition({ definition });
    } catch (err) {
      this.error(err, { exit: 1 });
    }

    this.log(`Loaded: ${definition}`);
    this.log();
    printInfo(document, this);
    if (flags.operations) {
      this.log();
      printOperations(document, this);
    }
    if (flags.schemas) {
      this.log();
      printSchemas(document, this);
    }
  }
}
