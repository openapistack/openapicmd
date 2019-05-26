import { Command, flags } from '@oclif/command';
import * as fs from 'fs';
import * as path from 'path';
import * as Koa from 'koa';
import * as bodyparser from 'koa-bodyparser';
import * as Router from 'koa-router';
import * as serve from 'koa-static';
import * as mount from 'koa-mount';
import OpenAPIBackend, { Document } from 'openapi-backend';
import { getAbsoluteFSPath } from 'swagger-ui-dist';
import * as commonFlags from '../common/flags';
import { startServer } from '../common/koa';
import { serveSwaggerUI } from '../common/swagger-ui';

export default class Mock extends Command {
  public static description = 'start a local mock API server';

  public static examples = [
    '$ openapi mock ./openapi.yml',
    '$ openapi mock https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml',
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.port({ required: true }),
    'swagger-ui': flags.string({ char: 'U', description: 'Swagger UI endpoint', helpValue: 'docs' }),
  };

  public static args = [
    {
      name: 'definition',
      description: 'input definition file',
      required: true,
    },
  ];

  public async run() {
    const { args, flags } = this.parse(Mock);
    const { definition } = args;
    const { port, 'swagger-ui': swaggerui } = flags;

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

    const app = new Koa();
    app.use(bodyparser());

    // serve openapi.json
    const openApiFile = 'openapi.json';
    const documentPath = `/${openApiFile}`;
    app.use(
      mount(documentPath, async (ctx, next) => {
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
      app.use(mount(`/${swaggerui}`, serveSwaggerUI({ documentPath })));
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

    // start server
    const { port: portRunning } = await startServer({ app, port });

    // print metadata
    this.printInfo(api.document);
    this.printRoutes(api.document);

    this.log(`\nMock server running at http://localhost:${portRunning}`);
    if (swaggerui) {
      this.log(`Swagger UI running at http://localhost:${portRunning}/${swaggerui}`);
    }
    this.log(`OpenAPI definition at http://localhost:${portRunning}${documentPath}`);
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
