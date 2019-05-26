import { Command, flags } from '@oclif/command';
import * as SwaggerParser from 'swagger-parser';
import * as s2o from 'swagger2openapi';
import { promisify } from 'util';
import * as commonFlags from '../common/flags';
import { parseDefinition, OutputFormat, stringifyDocument } from '../common/definition';

export default class Swagger2Openapi extends Command {
  public static description = 'convert Swagger 2.0 definitions to OpenAPI 3.0.x';

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
      required: true,
    },
  ];

  public async run() {
    const { args, flags } = this.parse(Swagger2Openapi);

    // parse definition
    const { definition } = args;
    const { dereference, validate } = flags;
    const swagger = await parseDefinition({ definition, dereference, validate });

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
