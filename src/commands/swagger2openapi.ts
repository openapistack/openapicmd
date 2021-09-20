import { Command } from '@oclif/command';
import * as SwaggerParser from '@apidevtools/swagger-parser';
import * as s2o from 'swagger2openapi';
import { promisify } from 'util';
import * as commonFlags from '../common/flags';
import { parseDefinition, OutputFormat, stringifyDocument, resolveDefinition } from '../common/definition';

export default class Swagger2Openapi extends Command {
  public static description = 'Convert Swagger 2.0 definitions to OpenAPI 3.0.x';

  public static examples = [`$ openapi swagger2openapi --yaml ./swagger.json > openapi.yml`];

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
    const { args, flags } = this.parse(Swagger2Openapi);
    const { dereference, bundle, validate, header, root } = flags;

    // parse definition
    const definition = resolveDefinition(args.definition);
    if (!definition) {
      this.error('Please load a definition file', { exit: 1 });
    }

    const swagger = await parseDefinition({ definition, dereference, bundle, validate, header, root });

    // convert to swagger
    let document: SwaggerParser.Document;
    try {
      const convertOptions = {}; // @TODO: take in some flags?
      const converted = await promisify(s2o.convertObj)(swagger, convertOptions);
      document = converted.openapi;
    } catch (err) {
      this.error(err, { exit: 1 });
    }

    // output in correct format
    const format = flags.format === 'json' || flags.json ? OutputFormat.JSON : OutputFormat.YAML;
    this.log(stringifyDocument({ document, format }));
  }
}
