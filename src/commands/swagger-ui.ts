import { Command, flags } from '@oclif/command';
import * as fs from 'fs';
import * as path from 'path';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as serve from 'koa-static';
import * as SwaggerUIDist from 'swagger-ui-dist';
import * as commonFlags from '../common/flags';
import { parseDefinition } from '../common/definition';
import { startServer } from '../common/koa';
import { Document } from 'swagger-parser';

export default class SwaggerUI extends Command {
  public static description = 'serve or bundle a Swagger UI instance';

  public static examples = ['$ openapi swagger-ui', '$ openapi swagger-ui ./openapi.yml'];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.port(),
    ...commonFlags.servers(),
    bundle: flags.string({
      char: 'B',
      description: 'bundle a static site to directory',
      helpValue: 'outDir',
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
    const { definition } = args;
    const { port, bundle } = flags;

    const app = new Koa();
    const router = new Router();

    let documentPath: string;
    let document: Document;

    const openApiFile = 'openapi.json';
    if (definition) {
      if (definition.match('://') && !flags.server) {
        // use remote definition
        documentPath = definition;
      } else {
        // parse definition
        document = await parseDefinition({ definition });
        router.get(`/${openApiFile}`, async (ctx) => {
          if (flags.server) {
            const addServers = flags.server.map((url) => ({ url }));
            document.servers = document.servers ? [...document.servers, ...addServers] : addServers;
          }
          ctx.body = document;
        });
        documentPath = `./${openApiFile}`;
      }
    }

    const swaggerUIRoot = SwaggerUIDist.getAbsoluteFSPath();

    // modify index.html
    let indexHTML = fs
      .readFileSync(path.join(swaggerUIRoot, 'index.html'))
      .toString('utf8')
      // display operation ids
      .replace('layout: "StandaloneLayout"', 'layout: "StandaloneLayout", displayOperationId: true');

    if (documentPath) {
      // use our openapi definition
      indexHTML = indexHTML.replace('https://petstore.swagger.io/v2/swagger.json', documentPath);
    }

    // serve from root
    router.get('/', (ctx) => {
      ctx.body = indexHTML;
    });

    app.use(router.routes());
    app.use(serve(swaggerUIRoot));

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

      if (document) {
        const openApiPath = path.join(bundleDir, openApiFile);
        fs.writeFileSync(openApiPath, JSON.stringify(document));
        this.log(`${openApiPath}`);
      }

      // write index.html
      const indexPath = path.join(bundleDir, 'index.html');
      fs.writeFileSync(indexPath, indexHTML);
      this.log(`${indexPath}`);
    } else {
      // run server
      const { port: portRunning } = await startServer({ app, port });
      this.log(`Swagger UI running at http://localhost:${portRunning}`);
    }
  }
}
