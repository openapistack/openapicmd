import { Command, Args } from '@oclif/core';
import { parseDefinition, OutputFormat, stringifyDocument, resolveDefinition } from '../common/definition';
import * as commonFlags from '../common/flags';
import { Document } from '@apidevtools/swagger-parser';
import { generateTypesForDocument } from 'openapi-client-axios-typegen'

export class Typegen extends Command {
  public static description = 'Generate types from openapi definition';

  public static examples = [
    `$ openapi typegen ./openapi.yml > openapi.d.ts`,
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.parseOpts(),
  };

  public static args = {
    definition: Args.string({
      description: 'input definition file'
    })
  }

  public async run() {
    const { args, flags } = await this.parse(Typegen);
    const { dereference, validate, bundle, header, root } = flags;

    const definition = resolveDefinition(args.definition);
    if (!definition) {
      this.error('Please load a definition file', { exit: 1 });
    }

    let document: Document;
    try {
      document = await parseDefinition({
        definition,
        dereference,
        bundle,
        validate,
        inject: flags.inject,
        strip: flags.strip,
        servers: flags.server,
        header,
        root,
      });
    } catch (err) {
      this.error(err, { exit: 1 });
    }

    const [imports, ...restTypes] = await generateTypesForDocument(document, { transformOperationName: (name) => name });

    this.log([
      imports + '\n',
      ...restTypes,
    ].join('\n'));
  }
}
