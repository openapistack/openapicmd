import { Command, flags } from '@oclif/command';
import * as URL from 'url';
import * as fs from 'fs';
import * as path from 'path';
import * as Koa from 'koa';
import * as proxy from 'koa-proxy';
import * as mount from 'koa-mount';
import * as commonFlags from '../common/flags';
import { parseDefinition, resolveDefinition } from '../common/definition';
import { startServer, createServer } from '../common/koa';
import { Document } from 'swagger-parser';
import {
  swaggerUIRoot,
  getSwaggerUIIndexHTML,
  serveSwaggerUI,
  SwaggerUIOpts,
  DocExpansion,
} from '../common/swagger-ui';

export default class SwaggerUI extends Command {
  public static description = 'serve or bundle a Swagger UI instance';

  public static examples = ['$ openapi swagger-ui', '$ openapi swagger-ui ./openapi.yml'];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.serverOpts(),
    ...commonFlags.servers(),
    ...commonFlags.swaggerUIOpts(),
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
    const { port, logger, bundle } = flags;
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
        document = await parseDefinition({ definition, servers: flags.server });
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
        if (document && document.servers) {
          serverURL = document.servers[0];
        }
        if (flags.server && typeof flags.server === 'object') {
          serverURL = flags.server[0];
        }
        if (flags.server && typeof flags.server === 'string') {
          serverURL = flags;
        }
        if (!serverURL) {
          this.error('Unable to find server URL from definition, please provide a --server parameter');
        }
        const api = URL.parse(serverURL);
        const proxyOpts = {
          host: URL.format({ protocol: api.protocol, host: api.host, port: api.port }),
          map: (path: string) => {
            if (api.pathname === '/') {
              return path;
            }
            return `${api.pathname}${path}`;
          },
          jar: flags.withcredentials,
        };
        proxyPath = '/proxy';
        document.servers[0].url = proxyPath;
        app.use(mount(proxyPath, proxy(proxyOpts)));
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
