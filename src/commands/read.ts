import { Command, Args } from '@oclif/core';
import { parseDefinition, OutputFormat, stringifyDocument, resolveDefinition } from '../common/definition';
import * as commonFlags from '../common/flags';
import { Document } from '@apidevtools/swagger-parser';

export class Read extends Command {
  public static description = 'Read and manipulate definition files';

  public static examples = [
    '$ openapi read https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml',
    `$ openapi read ./openapi.yml -f json > openapi.json`,
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.parseOpts(),
    ...commonFlags.outputFormat(),
  };

  public static args = {
    definition: Args.string({
      description: 'input definition file'
    })
  }

  public async run() {
    const { args, flags } = await this.parse(Read);
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
        excludeExt: flags?.['exclude-ext'],
        removeUnreferenced: flags?.['remove-unreferenced'],
        servers: flags.server,
        header,
        root,
      });
    } catch (err) {
      this.error(err, { exit: 1 });
    }
    const format = flags.format === 'json' || flags.json ? OutputFormat.JSON : OutputFormat.YAML;

    if (format === OutputFormat.JSON) {
      this.logJson(document)
    } else {
      this.log(stringifyDocument({ document, format }));
    }
  }
}
