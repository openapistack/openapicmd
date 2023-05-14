import { Command, flags } from '@oclif/command';
import * as SwaggerParser from '@apidevtools/swagger-parser';
import { parseDefinition, resolveDefinition, printInfo, getOperations } from '../common/definition';
import * as commonFlags from '../common/flags';
import { Document } from '@apidevtools/swagger-parser';
import * as _ from 'lodash';

export default class Info extends Command {
  public static description = 'Display API information';

  public static examples = [
    '$ openapi info https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml',
    `$ openapi info ./openapi.yml`,
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.parseOpts(),
    security: flags.boolean({ description: 'list security schemes in document', default: false }),
    operations: flags.boolean({ description: 'list operations in document', default: false }),
    schemas: flags.boolean({ description: 'list schemas in document', default: false }),
  };

  public static args = [
    {
      name: 'definition',
      description: 'input definition file',
    },
  ];

  public async run() {
    const { args, flags } = this.parse(Info);
    const { dereference, bundle, validate, header } = flags;

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
        strip: flags.strip,
        servers: flags.server,
        inject: flags.inject,
        header,
      });
    } catch (err) {
      this.error(err, { exit: 1 });
    }

    this.log(`Loaded: ${definition}`);
    this.log();
    printInfo(document, this);

    this.printServers(document);

    if (flags.operations) {
      this.log();
      this.printOperations(document);
    } else {
      this.log();
      this.log(`operations: ${getOperations(document).length}`);
      this.log(`tags: ${document.tags ? document.tags.length : 0}`);
    }
    if (flags.schemas) {
      this.log();
      this.printSchemas(document);
    } else {
      this.log(`schemas: ${document.components?.schemas ? Object.entries(document.components.schemas).length : 0}`);
    }
    if (flags.security) {
      this.log();
      this.printSecuritySchemes(document);
    } else {
      this.log(
        `securitySchemes: ${
          document.components?.securitySchemes ? Object.entries(document.components.securitySchemes).length : 0
        }`,
      );
    }
  }

  private printOperations(document: SwaggerParser.Document) {
    const operations: { [tag: string]: { routes: string[]; description?: string } } = {};

    if (document.tags) {
      for (const tag of document.tags) {
        const { name, description } = tag;
        operations[name] = {
          description,
          routes: [],
        };
      }
    }

    for (const path in document.paths) {
      if (document.paths[path]) {
        for (const method in document.paths[path]) {
          if (document.paths[path][method]) {
            const { operationId, summary, description, tags } = document.paths[path][method];
            let route = `${method.toUpperCase()} ${path}`;
            if (summary) {
              route = `${route} - ${summary}`;
            } else if (description) {
              route = `${route} - ${description}`;
            }
            if (operationId) {
              route = `${route} (${operationId})`;
            }
            for (const tag of tags || ['default']) {
              if (!operations[tag]) {
                operations[tag] = { routes: [] };
              }
              operations[tag].routes.push(route);
            }
          }
        }
      }
    }

    this.log(`operations (${getOperations(document).length}):`);
    for (const tag in operations) {
      if (operations[tag]) {
        const routes = operations[tag].routes;
        for (const route of routes) {
          this.log(`- ${route}`);
        }
      }
    }
  }

  private printSchemas(document: SwaggerParser.Document) {
    const schemas = (document.components && document.components.schemas) || {};
    const count = Object.entries(schemas).length;
    if (count > 0) {
      this.log(`schemas (${count}):`);
      for (const schema in schemas) {
        if (schemas[schema]) {
          this.log(`- ${schema}`);
        }
      }
    }
  }

  private printServers(document: SwaggerParser.Document) {
    const servers = document.servers ?? [];
    if (servers.length > 0) {
      this.log(`servers:`);
      for (const server of servers) {
        this.log(`- ${server.url}${server.description ? ` (${server.description})` : ''}`);
      }
    } else {
      this.log('servers: 0');
    }
  }

  private printSecuritySchemes(document: SwaggerParser.Document) {
    const securitySchemes = document.components?.securitySchemes || {};
    const count = Object.entries(securitySchemes).length;
    if (count > 0) {
      this.log(`securitySchemes (${count}):`);
      for (const scheme in securitySchemes) {
        if (securitySchemes[scheme]) {
          this.log(
            `- ${scheme}: (${[
              securitySchemes[scheme]['type'],
              securitySchemes[scheme]['scheme'],
              securitySchemes[scheme]['name'],
            ]
              .filter(Boolean)
              .join(', ')}) ${securitySchemes[scheme]['description']}`,
          );
        }
      }
    }
  }
}
