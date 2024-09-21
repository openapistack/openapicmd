import { Flags } from '@oclif/core';
import { Command, Args } from '@oclif/core';
import { parseDefinition, resolveDefinition } from '../common/definition';
import * as commonFlags from '../common/flags';
import { Document } from '@apidevtools/swagger-parser';
import { generateTypesForDocument } from '../typegen/typegen';

type TypegenMode = 'client' | 'backend' | 'both';

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
    client: Flags.boolean({
      description: 'Generate types for openapi-client-axios (default)',
      default: false,
    }),
    backend: Flags.boolean({
      description: 'Generate types for openapi-backend',
      default: false,
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

    const withTypeAliases = flags['type-aliases'];
    const mode = this.mode(flags.client, flags.backend);

    await this.outputBanner(flags.banner);
    await this.outputTypes(document, mode, withTypeAliases);
  }

  private mode(client: boolean, backend: boolean): TypegenMode {
    if (client && backend) {
      return 'both';
    } else if (backend) {
      return 'backend';
    }

    // default to client
    return 'client';
  }

  private async outputBanner(banner: string) {
    if (banner) {
      this.log(banner + '\n');
    }
  }

  private async outputTypes(document: Document, mode: TypegenMode, withTypeAliases: boolean) {
    const { clientImports, backendImports, schemaTypes, clientOperationTypes, backendOperationTypes, rootLevelAliases } = await generateTypesForDocument(document, { transformOperationName: (name) => name });

    if (['both', 'client'].includes(mode)) {
      this.log(clientImports)
    }

    if (['both', 'backend'].includes(mode)) {
      this.log(backendImports)
    }

    this.log(`\n${schemaTypes}`);

    if (['both', 'client'].includes(mode)) {
      this.log(`\n${clientOperationTypes}`);
    }

    if (['both', 'backend'].includes(mode)) {
      this.log(`\n${backendOperationTypes}`);
    }

    if (withTypeAliases && rootLevelAliases) {
      this.log(`\n${rootLevelAliases}`);
    }
  }
}
