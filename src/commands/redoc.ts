import { Command, Flags, Args } from '@oclif/core';
import { URL } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { createProxy } from '../common/proxy';
import * as mount from 'koa-mount';
import * as commonFlags from '../common/flags';
import { parseDefinition, resolveDefinition } from '../common/definition';
import { startServer, createServer } from '../common/koa';
import { Document } from '@apidevtools/swagger-parser';
import { parseHeaderFlag } from '../common/utils';
import { RedocOpts, getRedocIndexHTML, serveRedoc } from '../common/redoc';

export class Redoc extends Command {
  public static description = 'Start or bundle a ReDoc instance';

  public static examples = [
    '$ openapi redoc',
    '$ openapi redoc ./openapi.yml',
    '$ openapi redoc ./openapi.yml --bundle outDir',
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.serverOpts(),
    ...commonFlags.servers(),
    ...commonFlags.inject(),
    ...commonFlags.excludeExt(),
    ...commonFlags.strip(),
    ...commonFlags.header(),
    ...commonFlags.apiRoot(),
    bundle: Flags.string({
      char: 'B',
      description: 'bundle a static site to directory',
      helpValue: 'outDir',
    }),
  };

  public static args = {
    definition: Args.string({
      description: 'input definition file'
    })
  }

  public async run() {
    const { args, flags } = await this.parse(Redoc);
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
        document = await parseDefinition({
          definition,
          servers: flags.server,
          inject: flags.inject,
          excludeExt: flags?.['exclude-ext'],
          removeUnreferenced: flags?.['remove-unreferenced'],
          strip: flags.strip,
          header,
          root,
         });
        documentPath = `./${openApiFile}`;
      }
    }

    const redocOpts: RedocOpts = {
      specUrl: documentPath,
      title: document?.info?.title,
    }

    if (bundle) {
      // bundle files to directory
      const bundleDir = path.resolve(bundle);

      // create a directory if one does not exist
      if (!fs.existsSync(bundleDir)) {
        fs.mkdirSync(bundleDir);
      }

      // copy openapi definition file
      if (document) {
        const openApiPath = path.join(bundleDir, openApiFile);
        fs.writeFileSync(openApiPath, JSON.stringify(document));
        this.log(`${openApiPath}`);
      }

      // copy redoc index.html file
      const redocPath = path.join(bundleDir, 'index.html');
      const redocHtml = getRedocIndexHTML(redocOpts)
      fs.writeFileSync(redocPath, redocHtml);
      this.log(path.join(redocPath));
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
            return createProxy(proxyOpts)(ctx, next);
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
      app.use(mount('/', serveRedoc(redocOpts)));

      // start server
      const { port: portRunning } = await startServer({ app, port });
      this.log(`Redoc running at http://localhost:${portRunning}`);
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
