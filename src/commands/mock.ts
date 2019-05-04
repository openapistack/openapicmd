import * as fs from 'fs';
import * as path from 'path';
import * as Koa from 'koa';
import * as bodyparser from 'koa-bodyparser';
import * as Router from 'koa-router';
import * as serve from 'koa-static';
import * as mount from 'koa-mount';
import OpenAPIBackend, { Document } from 'openapi-backend';
import { getAbsoluteFSPath } from 'swagger-ui-dist';
import { Command, flags } from '@oclif/command';

export default class Mock extends Command {
  public static description = 'start a local mock API server';

  public static examples = [
    '$ openapi mock -d ./openapi.yml',
    '$ openapi mock -d https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml',
  ];

  public static flags = {
    help: flags.help({ char: 'h' }),
    port: flags.integer({ char: 'p', description: 'port', default: 9000, helpValue: '9000' }),
    definition: flags.string({
      char: 'd',
      description: 'openapi definition file',
      required: true,
      helpValue: './openapi.yml',
    }),
    'swagger-ui': flags.string({ char: 'U', description: 'Swagger UI endpoint', helpValue: 'docs' }),
  };

  public static args = [];

  public async run() {
    const { flags } = this.parse(Mock);
    const { definition, port, 'swagger-ui': swaggerui } = flags;

    this.log(`Reading OpenAPI spec ${definition}...`);

    const api = new OpenAPIBackend({ definition });
    api.register({
      validationFail: (c, ctx) => {
        ctx.status = 400;
        ctx.body = { err: c.validation.errors };
      },
      notFound: (c, ctx) => {
        ctx.status = 404;
        ctx.body = { err: 'not found' };
      },
      notImplemented: (c, ctx) => {
        const { status, mock } = c.api.mockResponseForOperation(c.operation.operationId);
        ctx.status = status;
        ctx.body = mock;
      },
    });
    await api.init();

    this.printInfo(api.document);
    this.printRoutes(api.document);

    const app = new Koa();
    app.use(bodyparser());

    // set up cors
    app.use(async (ctx, next) => {
      await next();
      ctx.set('access-control-allow-origin', '*');
    });

    // serve openapi.json
    const openapijson = '/openapi.json';
    app.use(
      mount(openapijson, async (ctx, next) => {
        await next();
        const doc = api.document;
        doc.servers = [
          {
            url: `http://localhost:${port}`,
          },
        ];
        ctx.body = api.document;
        ctx.status = 200;
      }),
    );

    // serve swagger ui
    if (swaggerui) {
      const swaggerUI = new Koa();
      const router = new Router();

      const swaggerUIRoot = getAbsoluteFSPath();

      const indexHTML = fs.readFileSync(path.join(swaggerUIRoot, 'index.html')).toString('utf8');
      router.get('/', (ctx) => {
        if (!ctx.originalUrl.endsWith('/')) {
          ctx.redirect(`${ctx.originalUrl}/`);
        } else {
          // serve a modified index.html
          ctx.body = indexHTML
            // use our openapi definition
            .replace('https://petstore.swagger.io/v2/swagger.json', openapijson)
            // display operation ids
            .replace('layout: "StandaloneLayout"', 'layout: "StandaloneLayout", displayOperationId: true');
        }
      });
      swaggerUI.use(router.routes());
      swaggerUI.use(serve(swaggerUIRoot));

      app.use(mount(`/${swaggerui}`, swaggerUI));
    }

    // serve openapi-backend
    app.use((ctx) =>
      api.handleRequest(
        {
          method: ctx.request.method,
          path: ctx.request.path,
          body: ctx.request.body,
          query: ctx.request.query,
          headers: ctx.request.headers,
        },
        ctx,
      ),
    );

    const server = app.listen(port);
    process.on('disconnect', () => server.close());

    this.log(`\nMock server running at http://localhost:${port}`);
    if (swaggerui) {
      this.log(`Swagger UI running at http://localhost:${port}/${swaggerui}`);
    }
    this.log(`OpenAPI definition at http://localhost:${port}${openapijson}`);
  }

  private printInfo(document: Document) {
    const { title, version, description } = document.info;
    this.log(`\ntitle: ${title}`);
    this.log(`version: ${version}`);
    if (description) {
      this.log(`description: ${description}`);
    }
  }

  private printRoutes(document: Document) {
    this.log('\nRoutes:');
    for (const path in document.paths) {
      if (document.paths[path]) {
        for (const method in document.paths[path]) {
          if (document.paths[path][method]) {
            const { operationId, summary } = document.paths[path][method];
            let route = `- ${method.toUpperCase()} ${path}`;
            if (summary) {
              route = `${route} - ${summary}`;
            }
            if (operationId) {
              route = `${route} (${operationId})`;
            }
            this.log(route);
          }
        }
      }
    }
  }
}
