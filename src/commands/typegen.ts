import { Flags } from '@oclif/core';
import { Command, Args } from '@oclif/core';
import { parseDefinition, resolveDefinition } from '../common/definition';
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
    banner: Flags.string({ 
      char: 'b',
      description: 'include a banner comment at the top of the generated file' 
    }),
    ['type-aliases']: Flags.boolean({ 
      char: 'A',
      description: 'Generate module level type aliases for schema components defined in spec', 
      default: true,
      allowNo: true,
    }),
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
        excludeExt: flags?.['exclude-ext'],
        removeUnreferenced: flags?.['remove-unreferenced'],
        strip: flags.strip,
        servers: flags.server,
        header,
        root,
      });
    } catch (err) {
      this.error(err, { exit: 1 });
    }

    const [imports, schemaTypes, operationTypings, _banner, aliases] = await generateTypesForDocument(document, { transformOperationName: (name) => name });

    if (flags.banner) {
      this.log(flags.banner + '\n');
    }

    this.log([
      imports + '\n',
      schemaTypes,
      operationTypings,
    ].join('\n'));

    if (flags['type-aliases'] && aliases) {
      this.log(`\n${aliases}`);
    }
  }
}
