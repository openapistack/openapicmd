import { Command, flags } from '@oclif/command';
import * as Koa from 'koa';
import * as bodyparser from 'koa-bodyparser';
import * as cors from '@koa/cors';
import * as mount from 'koa-mount';
import OpenAPIBackend, { Document } from 'openapi-backend';
import * as commonFlags from '../common/flags';
import { startServer, createServer } from '../common/koa';
import { serveSwaggerUI } from '../common/swagger-ui';
import { resolveDefinition, printInfo, printOperations } from '../common/definition';

export default class Mock extends Command {
  public static description = 'start a local mock API server';

  public static examples = [
    '$ openapi mock ./openapi.yml',
    '$ openapi mock https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml',
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.serverOpts(),
    'swagger-ui': flags.string({ char: 'U', description: 'Swagger UI endpoint', helpValue: 'docs' }),
  };

  public static args = [
    {
      name: 'definition',
      description: 'input definition file',
    },
  ];

  public async run() {
    const { args, flags } = this.parse(Mock);
    const { port, logger, 'swagger-ui': swaggerui } = flags;

    const definition = resolveDefinition(args.definition);
    if (!definition) {
      this.error('Please load a definition file', { exit: 1 });
    }

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

    const app = createServer({ logger });
    app.use(bodyparser());
    app.use(cors({ credentials: true }));

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
      app.use(mount(`/${swaggerui}`, serveSwaggerUI({ url: documentPath })));
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

    this.log();
    this.log(`Mock server running at http://localhost:${portRunning}`);
    if (swaggerui) {
      this.log(`Swagger UI running at http://localhost:${portRunning}/${swaggerui}`);
    }
    this.log(`OpenAPI definition at http://localhost:${portRunning}${documentPath}`);
    this.log();
  }
}
