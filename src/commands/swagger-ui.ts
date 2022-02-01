import { Command, flags } from '@oclif/command';
import { URL } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import * as proxy from 'koa-proxy';
import * as mount from 'koa-mount';
import * as commonFlags from '../common/flags';
import { parseDefinition, resolveDefinition } from '../common/definition';
import { startServer, createServer } from '../common/koa';
import { Document } from '@apidevtools/swagger-parser';
import {
  swaggerUIRoot,
  getSwaggerUIIndexHTML,
  serveSwaggerUI,
  SwaggerUIOpts,
  DocExpansion,
} from '../common/swagger-ui';
import { parseHeaderFlag } from '../common/utils';

export default class SwaggerUI extends Command {
  public static description = 'Start or bundle a Swagger UI instance';

  public static examples = [
    '$ openapi swagger-ui',
    '$ openapi swagger-ui ./openapi.yml',
    '$ openapi swagger-ui ./openapi.yml --bundle outDir',
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.serverOpts(),
    ...commonFlags.servers(),
    ...commonFlags.inject(),
    ...commonFlags.swaggerUIOpts(),
    ...commonFlags.header(),
    ...commonFlags.apiRoot(),
    bundle: flags.string({
      char: 'B',
      description: 'bundle a static site to directory',
      helpValue: 'outDir',
    }),
    proxy: flags.boolean({
      description: 'set up a proxy for the api to avoid CORS issues',
      exclusive: ['bundle'],
    }),
  };

  public static args = [
    {
      name: 'definition',
      description: 'input definition file',
    },
  ];

  public async run() {
    const { args, flags } = this.parse(SwaggerUI);
    const { port, logger, bundle, header, root } = flags;
    const definition = resolveDefinition(args.definition);

    const app = createServer({ logger });

    let proxyPath: string;
    let documentPath: string;
    let document: Document;

    const openApiFile = 'openapi.json';
    if (definition) {
      if (definition.match('://') && !flags.server && !flags.proxy) {
        // use remote definition
        documentPath = definition;
      } else {
        // parse definition
        document = await parseDefinition({ definition, servers: flags.server, inject: flags.inject, header, root });
        documentPath = `./${openApiFile}`;
      }
    }

    // parse opts for Swagger UI from flags
    const swaggerUIOpts: SwaggerUIOpts = {
      docExpansion: flags.expand as DocExpansion,
      displayOperationId: flags.operationids,
      filter: flags.filter,
      deepLinking: flags.deeplinks,
      withCredentials: flags.withcredentials,
      displayRequestDuration: flags.requestduration,
    };

    if (bundle) {
      // bundle files to directory
      const bundleDir = path.resolve(bundle);

      // create a directory if one does not exist
      if (!fs.existsSync(bundleDir)) {
        fs.mkdirSync(bundleDir);
      }
      // copy dist files
      for (const file of fs.readdirSync(swaggerUIRoot)) {
        const src = path.join(swaggerUIRoot, file);
        const target = path.join(bundleDir, file);
        fs.copyFileSync(src, target);
        this.log(`${target}`);
      }

      // copy openapi definition file
      if (document) {
        const openApiPath = path.join(bundleDir, openApiFile);
        fs.writeFileSync(openApiPath, JSON.stringify(document));
        this.log(`${openApiPath}`);
      }

      // write index.html
      const indexPath = path.join(bundleDir, 'index.html');
      fs.writeFileSync(indexPath, getSwaggerUIIndexHTML({ url: documentPath, ...swaggerUIOpts }));
      this.log(`${indexPath}`);
    } else {
      if (flags.proxy) {
        // set up a proxy for the api
        let serverURL = null;
        if (document.servers && document.servers[0]) {
          serverURL = document.servers[0].url;
        }
        if (flags.server && typeof flags.server === 'object') {
          serverURL = flags.server[0];
        }
        if (flags.server && typeof flags.server === 'string') {
          serverURL = flags.server;
        }
        if (!serverURL) {
          this.error('Unable to find server URL from definition, please provide a --server parameter');
        }
        const apiUrl = new URL(serverURL);
        const proxyOpts = {
          host: `${apiUrl.protocol}//${apiUrl.host}`,
          map: (path: string) => {
            if (flags.root) {
              return `${flags.root}${path}`;
            }
            if (apiUrl.pathname === '/') {
              return path;
            }
            return `${apiUrl.pathname}${path}`;
          },
          jar: flags.withcredentials,
        };
        proxyPath = '/proxy';
        app.use(
          mount(proxyPath, (ctx, next) => {
            ctx.request.header = {
              ...ctx.request.header,
              ...parseHeaderFlag(header),
            };
            return proxy(proxyOpts)(ctx, next);
          }),
        );
        document.servers = [{ url: proxyPath }, ...document.servers];
      }

      if (document) {
        // serve the openapi file
        app.use(
          mount(`/${openApiFile}`, (ctx) => {
            ctx.body = JSON.stringify(document);
          }),
        );
      }

      // serve swagger ui
      app.use(mount('/', serveSwaggerUI({ url: documentPath, ...swaggerUIOpts })));

      // start server
      const { port: portRunning } = await startServer({ app, port });
      this.log(`Swagger UI running at http://localhost:${portRunning}`);
      if (document) {
        this.log(`OpenAPI definition at http://localhost:${portRunning}/${openApiFile}`);
      }
      if (proxyPath) {
        this.log(`Proxy running at http://localhost:${portRunning}${proxyPath}`);
      }
      this.log();
    }
  }
}
