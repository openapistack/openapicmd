import { Command, Flags, Args } from '@oclif/core';
import * as bodyparser from 'koa-bodyparser';
import * as cors from '@koa/cors';
import * as mount from 'koa-mount';
import OpenAPIBackend, { Document } from 'openapi-backend';
import * as commonFlags from '../common/flags';
import { startServer, createServer } from '../common/koa';
import { serveSwaggerUI } from '../common/swagger-ui';
import { resolveDefinition, parseDefinition } from '../common/definition';

export class Mock extends Command {
  public static description = 'Start a local mock API server';

  public static examples = [
    '$ openapi mock ./openapi.yml',
    '$ openapi mock https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v3.0/petstore.yaml',
  ];

  public static flags = {
    ...commonFlags.help(),
    ...commonFlags.serverOpts(),
    ...commonFlags.servers(),
    ...commonFlags.inject(),
    ...commonFlags.strip(),
    ...commonFlags.header(),
    ...commonFlags.apiRoot(),
    'swagger-ui': Flags.string({ char: 'U', description: 'Swagger UI endpoint', helpValue: 'docs' }),
    validate: Flags.boolean({
      description: '[default: true] validate requests according to schema',
      default: true,
      allowNo: true,
    }),
  };

  public static args = {
    definition: Args.string({
      description: 'input definition file'
    })
  }

  public async run() {
    const { args, flags } = await this.parse(Mock);
    const { port, logger, 'swagger-ui': swaggerui, validate, header, root } = flags;

    let portRunning = port;

    const definition = resolveDefinition(args.definition);
    if (!definition) {
      this.error('Please load a definition file', { exit: 1 });
    }

    let document: Document;
    try {
      document = await parseDefinition({
        definition,
        validate,
        servers: flags.server,
        inject: flags.inject,
        strip: flags.strip,
        header,
        root,
        induceServers: true,
      });
    } catch (err) {
      this.error(err, { exit: 1 });
    }

    const api = new OpenAPIBackend({
      definition: document,
      validate,
      apiRoot: root,
    });

    api.register({
      validationFail: (c, ctx) => {
        ctx.status = 400;
        ctx.body = { err: c.validation.errors };
      },
      notFound: (c, ctx) => {
        ctx.status = 404;
        ctx.body = { err: 'not found' };
      },
      methodNotAllowed: (c, ctx) => {
        ctx.status = 405;
        ctx.body = { err: 'method not allowed' };
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
    const server = await startServer({ app, port });
    portRunning = server.port;

    if (!document.servers || !document.servers.length) {
      api.document.servers = [{ url: `http://localhost:${portRunning}` }];
    }

    this.log();
    this.log(`Mock server running at http://localhost:${portRunning}`);
    if (swaggerui) {
      this.log(`Swagger UI running at http://localhost:${portRunning}/${swaggerui}`);
    }
    this.log(`OpenAPI definition at http://localhost:${portRunning}${documentPath}`);
    this.log();
  }
}
