import { Command, flags } from '@oclif/command';
import { OutputFormat, stringifyDocument } from '../common/definition';
import * as commonFlags from '../common/flags';
import { Document } from 'swagger-parser';
import { OpenAPIV3 } from 'openapi-types';

export default class Init extends Command {
  public static description = 'initialise an OpenAPI definition file';

  public static examples = [`$ openapi init --title 'My API' > openapi.yml`];

  public static flags = {
    ...commonFlags.help(),
    title: flags.string({ char: 'T', description: 'The title for the API', default: 'My API' }),
    description: flags.string({ char: 'd', description: 'Description for the API' }),
    version: flags.string({ char: 'v', description: 'Version of the API', default: '0.0.1' }),
    terms: flags.string({ description: 'A URL to the Terms of Service for the API.' }),
    license: flags.string({ description: 'The license for the API', options: ['mit', 'apache2'] }),
    ...commonFlags.servers(),
    ...commonFlags.outputFormat(),
  };

  public static args = [];

  public async run() {
    const { flags } = this.parse(Init);
    const { title, version, server, license, description, terms } = flags;
    const OPENAPI_VERSION = '3.0.0';

    const info: OpenAPIV3.InfoObject = {
      title,
      version,
    };
    if (description) {
      info.description = description;
    }
    if (terms) {
      info.termsOfService = terms;
    }
    if (license) {
      switch (license) {
        case 'apache2':
          info.license = {
            name: 'Apache 2.0',
            url: 'http://www.apache.org/licenses/LICENSE-2.0.html',
          };
        case 'mit':
          info.license = {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
          };
      }
    }

    let document: Document = {
      openapi: OPENAPI_VERSION,
      info,
      paths: {},
    };

    if (server) {
      const { paths, ...d } = document;
      document = {
        ...d,
        servers: server.map((url) => ({ url })),
        paths,
      };
    }

    const format = flags.format === 'json' || flags.json ? OutputFormat.JSON : OutputFormat.YAML;
    this.log(stringifyDocument({ document, format }));
  }
}
